import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";
export function markdownTree(text: string) {
  return unified().use(remarkParse).use(remarkGfm).parse(text);
}
export function markdownFacts(text: string) {
  const tree = markdownTree(text);
  const slugger = new GithubSlugger();
  const anchors = new Set<string>();
  const headings: string[] = [];
  const references: {
    url: string;
    line: number;
    kind: "link" | "image";
    alt?: string;
  }[] = [];
  const definitions = new Map<string, string>();
  const unresolved: { id: string; line: number }[] = [];
  visit(tree, "definition", (node) => {
    definitions.set(node.identifier.toLowerCase(), node.url);
  });
  visit(tree, (node) => {
    const line = node.position?.start.line ?? 1;
    if (node.type === "link")
      references.push({ url: node.url, line, kind: "link" });
    if (node.type === "image")
      references.push({
        url: node.url,
        line,
        kind: "image",
        alt: node.alt ?? "",
      });
    if (node.type === "linkReference" || node.type === "imageReference") {
      const url = definitions.get(node.identifier.toLowerCase());
      if (url)
        references.push({
          url,
          line,
          kind: node.type === "imageReference" ? "image" : "link",
          ...("alt" in node ? { alt: node.alt ?? "" } : {}),
        });
      else unresolved.push({ id: node.identifier, line });
    }
  });
  const html = unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .runSync(tree);
  // Markdown references were already collected; HTML nodes retain their raw source positions.
  visit(html, "element", (node) => {
    if (/^h[1-6]$/.test(node.tagName)) {
      let title = "";
      visit(node, "text", (text) => {
        title += text.value;
      });
      headings.push(title);
      anchors.add(slugger.slug(title));
    }
    const id = node.properties.id;
    if (typeof id === "string") anchors.add(id);
    if (node.tagName === "a" && typeof node.properties.name === "string")
      anchors.add(node.properties.name);
    const line = node.position?.start.line ?? 1;
    if (
      node.tagName === "img" &&
      typeof node.properties.src === "string" &&
      !references.some(
        (r) =>
          r.kind === "image" &&
          r.line === line &&
          r.url === node.properties.src,
      )
    )
      references.push({
        kind: "image",
        url: node.properties.src,
        alt:
          typeof node.properties.alt === "string"
            ? node.properties.alt
            : undefined,
        line,
      });
    if (
      node.tagName === "a" &&
      typeof node.properties.href === "string" &&
      !references.some(
        (r) =>
          r.kind === "link" &&
          r.line === line &&
          r.url === node.properties.href,
      )
    )
      references.push({ kind: "link", url: node.properties.href, line });
    if (node.tagName === "source" && typeof node.properties.srcSet === "string")
      for (const source of node.properties.srcSet.split(",")) {
        const url = source.trim().split(/\s+/)[0];
        if (url) references.push({ kind: "image", url, line, alt: "" });
      }
  });
  return { tree, anchors, headings, references, unresolved };
}
