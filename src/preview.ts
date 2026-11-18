import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { dirname, relative, resolve, extname } from "node:path";
import sharp from "sharp";
import { localPath, atomicWrite, protectSource } from "./io";
export async function createPreview(options: {
  root: string;
  readme: string;
  output: string;
  force?: boolean;
}) {
  const input = await localPath(options.root, options.readme);
  await protectSource(input, [resolve(options.output)]);
  if ((await Bun.file(options.output).exists()) && !options.force)
    throw new Error("Preview exists; use --force to replace");
  const parser = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize);
  const tree = await parser.run(parser.parse(await Bun.file(input).text()));
  const jobs: Promise<void>[] = [];
  visit(tree, "element", (node) => {
    if (node.tagName === "img" && typeof node.properties.src === "string") {
      const source = node.properties.src;
      delete node.properties.src;
      jobs.push(
        (async () => {
          try {
            if (/^[a-z]+:|^\/\//i.test(source)) return;
            const path = source.split(/[?#]/)[0] ?? "";
            const local = await localPath(
              options.root,
              path.startsWith("/")
                ? decodeURIComponent(path.slice(1))
                : relative(
                    options.root,
                    resolve(dirname(input), decodeURIComponent(path)),
                  ),
            );
            if (Bun.file(local).size > 5_000_000) return;
            let data = await Bun.file(local).bytes();
            let mime = Bun.file(local).type;
            if (extname(local) === ".svg") {
              data = await sharp(data).png().toBuffer();
              mime = "image/png";
            }
            node.properties.src = `data:${mime};base64,${Buffer.from(data).toString("base64")}`;
          } catch {
            node.properties.alt = `Unavailable preview image: ${source}`;
          }
        })(),
      );
    }
  });
  await Promise.all(jobs);
  const body = String(await unified().use(rehypeStringify).stringify(tree));
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline';"><title>README review</title><style>body{margin:24px;font:16px/1.6 system-ui;background:#e9edf1;color:#1f2328}section{margin:24px 0}article{box-sizing:border-box;padding:24px;border:1px solid #d0d7de;border-radius:6px;background:white;overflow-wrap:anywhere;max-width:100%}article.dark{background:#0d1117;color:#e6edf3}article.wide{width:900px}article.narrow{width:360px}img{max-width:100%;height:auto}pre{padding:16px;overflow:auto;background:#8881}code{font-family:monospace}a{color:#0969da}.dark a{color:#58a6ff}table{display:block;overflow:auto;border-collapse:collapse}td,th{border:1px solid #8886;padding:6px 12px}h1,h2{border-bottom:1px solid #8884}blockquote{border-left:3px solid #8886;padding-left:16px;margin-left:0}</style><h1>README review</h1><p>Sanitized local approximation. Remote images are omitted. GitHub alerts, Mermaid, and GitHub-specific rendering require a separate check.</p>${["wide", "narrow"].flatMap((size) => ["light", "dark"].map((theme) => `<section><h2>${size} / ${theme}</h2><article class="${size} ${theme}">${body}</article></section>`)).join("")}</html>`;
  await atomicWrite(resolve(options.output), html);
  return {
    schemaVersion: 1,
    output: resolve(options.output),
    renderer: "sanitized-local-approximation",
    githubVerified: false,
  };
}
