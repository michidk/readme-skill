import { expect, test } from "bun:test";
import { reviewMarkdown } from "../src/review";

test("review locates Markdown and HTML evidence without claiming example success", () => {
  const report = reviewMarkdown(
    "# Demo\n\n## Install\n\n```sh\nbun install\n```\n\n<pre><code>actual example</code></pre>\n\n![Result][result]\n\n[result]: result.png\n",
  );
  expect(report.evidence.examples).toEqual([
    { text: "bun install", line: 5 },
    { text: "actual example", line: 9 },
  ]);
  expect(report.evidence.media[0]?.url).toBe("result.png");
  expect(report.review.every((item) => item.status === "unreviewed")).toBe(
    true,
  );
  expect(report).not.toHaveProperty("ok");
});

test("resource README without executable examples receives questions, not a failure", () => {
  const report = reviewMarkdown(
    "# Resources\n\nCopy [the template](template.md).",
  );
  expect(report.evidence.examples).toEqual([]);
  expect(report.evidence.links[0]?.url).toBe("template.md");
  expect(
    report.review.find((item) => item.id === "first-success")?.status,
  ).toBe("unreviewed");
});

test("documented CLI example returns the promised evidence and rejects escaping paths", async () => {
  const cwd = new URL("..", import.meta.url).pathname;
  const run = async (readme: string) => {
    const child = Bun.spawn(
      [
        process.execPath,
        "src/cli.ts",
        "review",
        "--root",
        ".",
        "--readme",
        readme,
        "--json",
      ],
      { cwd, stdout: "pipe", stderr: "pipe" },
    );
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    return { stdout, stderr, code };
  };
  const example = await run("examples/review-input.md");
  expect(example.code).toBe(0);
  expect(JSON.parse(example.stdout).evidence).toEqual({
    headings: [{ text: "Example project", line: 1 }],
    examples: [{ text: "bun install", line: 5 }],
    media: [],
    links: [],
  });
  const escaped = await run("../README.md");
  expect(escaped.code).toBe(2);
  expect(escaped.stderr).toContain("path.outside");
});

test("branded header review preserves image display hints without treating them as verified dimensions", () => {
  const report = reviewMarkdown(
    '<h1 align="center">Workshop</h1>\n\n<p align="center"><a href="#usage">Usage</a></p>\n\n<p align="center"><img src="hero.png" width="800" alt="Composing a README"></p>\n\n![Screenshot](screen.png)\n\n## Usage',
  );
  expect(report.evidence.headings[0]?.text).toBe("Workshop");
  expect(report.imageLayout).toEqual([
    { source: "hero.png", line: 5, width: 800, height: null },
    { source: "screen.png", line: 7, width: null, height: null },
  ]);
  expect(report.evidence.links[0]?.url).toBe("#usage");
  expect(report.review.find((item) => item.id === "header")?.status).toBe(
    "unreviewed",
  );
  expect(
    report.review.find((item) => item.id === "media-production")?.status,
  ).toBe("unreviewed");
});
