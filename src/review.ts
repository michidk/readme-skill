import type { Element } from "hast";
import { unified } from "unified";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import { visit } from "unist-util-visit";
import { markdownFacts } from "./markdown";
import { localPath } from "./io";
import { inspectRepository } from "./repository";
import type { Policy } from "./policy";

const questions = [
  {
    id: "purpose",
    question:
      "Can the intended reader explain what this does and why they would use it?",
  },
  {
    id: "first-success",
    question:
      "Is there a complete first useful action with prerequisites, real input, and an observable result? Verify it or explain why execution is not applicable.",
  },
  {
    id: "claims",
    question:
      "Which consequential claims are supported by implementation or release evidence, and which remain unverified?",
  },
  {
    id: "adoption",
    question:
      "Are the basic requirements and available distribution/license facts accurate and useful? Omit unfinished sections and missing-license notices. Ask the user about known issues before documenting them.",
  },
  {
    id: "header",
    question:
      "Does the header follow the requested visual direction: clear identity, concise selectable description, useful navigation, a compact row of fully configured, useful verified shields above the hero, and a relevant, well-sized hero or logo? Honor requested imagery and explain omissions.",
  },
  {
    id: "media-production",
    question:
      "Are screenshots legible at their displayed size, and do real video links have cropped thumbnails without confirmed black borders, visible play indicators, and text links? Inspect light/dark and narrow/wide presentation; mark absent media not applicable with a reason.",
  },
  {
    id: "consistency",
    question:
      "Do shared standards, related Markdown and repository links, and proposed description/homepage/topics agree with this project's evidence? Account for each original requirement without inventing releases, licenses, links, or support promises.",
  },
  {
    id: "visuals",
    question:
      "Does each visual explain a result or concept, remain readable, and have an appropriate alternative? Remove redundant decoration while preserving useful visual identity and the user's requested artwork.",
  },
  {
    id: "navigation",
    question:
      "Can readers find useful existing docs, contribution steps, releases, and related projects? Create companion documents only when explicitly requested. Does every sentence help readers understand, install, or use the project?",
  },
];

export function reviewMarkdown(text: string) {
  const facts = markdownFacts(text);
  const html = unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .runSync(facts.tree);
  const headings: { text: string; line: number }[] = [];
  const examples: { text: string; line: number }[] = [];
  const imageLayout: {
    source: string;
    line: number;
    width: string | number | null;
    height: string | number | null;
  }[] = [];
  function content(node: Element) {
    let value = "";
    visit(node, "text", (child) => {
      value += child.value;
    });
    return value.trim();
  }
  visit(html, "element", (node) => {
    const line = node.position?.start.line ?? 1;
    if (/^h[1-6]$/.test(node.tagName))
      headings.push({ text: content(node), line });
    if (node.tagName === "img" && typeof node.properties.src === "string") {
      const { width, height } = node.properties;
      imageLayout.push({
        source: node.properties.src,
        line,
        width:
          typeof width === "number" || typeof width === "string" ? width : null,
        height:
          typeof height === "number" || typeof height === "string"
            ? height
            : null,
      });
    }
    if (node.tagName === "pre") examples.push({ text: content(node), line });
  });
  return {
    schemaVersion: 1,
    kind: "editorial-review-brief",
    limitation:
      "Locations are evidence to inspect, not quality judgments. Code blocks may be setup, usage, or output. No commands were executed; no claims or visual quality were verified.",
    evidence: {
      headings,
      examples,
      media: facts.references.filter((ref) => ref.kind === "image"),
      links: facts.references.filter((ref) => ref.kind === "link"),
    },
    imageLayout,
    review: questions.map((item) => ({
      ...item,
      status: "unreviewed",
      evidence: [],
      action: "",
    })),
    instructions:
      "For each question record a judgment (supported, needs-work, unverified, or not-applicable), source paths/lines or observed results, and a concrete action. Repeat after editing. Do not infer quality from this inventory or assign a numeric score.",
  };
}

export async function reviewRepository(options: {
  root: string;
  policy: Policy;
  readme?: string;
}) {
  const repo = await inspectRepository(options.root, options.policy);
  const path = options.readme ?? repo.readme ?? "README.md";
  const file = Bun.file(await localPath(repo.root, path));
  if (file.size > 1_000_000)
    throw new Error("README exceeds 1 MB inspection limit");
  return { ...reviewMarkdown(await file.text()), file: path };
}
