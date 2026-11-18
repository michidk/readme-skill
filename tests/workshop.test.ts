import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const roots: string[] = [];
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "readme-skill-"));
  roots.push(root);
  return root;
}
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
async function cli(root: string, ...args: string[]) {
  const p = Bun.spawn(
    [
      process.execPath,
      resolve("src/cli.ts"),
      ...args,
      "--root",
      root,
      "--json",
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  const [out, err, code] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  return { code, out, err, data: out ? JSON.parse(out) : null };
}
test("inspect reports evidence without leaking secret files and flags malformed manifests", async () => {
  const root = await fixture();
  await writeFile(join(root, "README.md"), "# Example\n");
  await writeFile(join(root, ".env"), "API_KEY=secret-value");
  await writeFile(join(root, "package.json"), "{broken");
  const result = await cli(root, "inspect");
  expect(result.code).toBe(0);
  expect(result.out).not.toContain("secret-value");
  expect(result.data.warnings.length).toBeGreaterThan(0);
  expect(result.data.license).toBeNull();
});
test("check resolves duplicate anchors, encoded paths and HTML image references", async () => {
  const root = await fixture();
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs", "a b.md"), "# Intro\n\n# Intro\n");
  await writeFile(
    join(root, "README.md"),
    '# Example\n\nUseful tool.\n\n[OK](docs/a%20b.md#intro-1)\n[Bad](docs/a%20b.md#missing)\n<img src="lost.png" alt="Example">\n\n## Usage\n\nRun it.\n\n## Contributing\n\nOpen an issue.\n',
  );
  const result = await cli(root, "check");
  expect(result.code).toBe(1);
  expect(
    result.data.findings.filter(
      (f: { code: string }) => f.code === "anchor.missing",
    ),
  ).toHaveLength(1);
  expect(result.out).toContain("asset.missing");
  expect(result.out).toContain("license.missing");
});
test("repository symlinks and traversal are not read", async () => {
  const root = await fixture();
  const outside = await fixture();
  await writeFile(join(outside, "private.md"), "# Private");
  await symlink(join(outside, "private.md"), join(root, "outside.md"));
  await writeFile(
    join(root, "README.md"),
    "# Demo\n\n[External](outside.md#private)\n[Escape](../private.md)\n",
  );
  const result = await cli(root, "check");
  expect(result.out).toContain("path.outside");
  expect(
    result.data.findings.filter(
      (f: { code: string }) => f.code === "path.outside",
    ),
  ).toHaveLength(2);
});
test("policy rejects unknown keys rather than silently ignoring mistakes", async () => {
  const root = await fixture();
  await writeFile(
    join(root, "readme-skill.json"),
    JSON.stringify({ maxBadgez: 2 }),
  );
  const result = await cli(root, "inspect");
  expect(result.code).toBe(2);
  expect(result.err).toContain("maxBadgez");
});
test("audit does not create or modify project files", async () => {
  const root = await fixture();
  const content = "# Tool\n\nDoes a useful thing.\n";
  await writeFile(join(root, "README.md"), content);
  await cli(root, "check");
  expect(await Bun.file(join(root, "README.md")).text()).toBe(content);
  expect(await Array.fromAsync(new Bun.Glob("*").scan(root))).toEqual([
    "README.md",
  ]);
});

test("HTML headings, directory links, and dual-license files are recognized", async () => {
  const root = await fixture();
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "LICENSE-MIT"), "MIT License");
  await writeFile(
    join(root, "README.md"),
    "<h1>Tool</h1>\n\n<h2>Usage</h2>\n\n[Usage](#usage)\n[Docs](docs/)\n\n## Contributing\n\nSend patches.\n\n## License\n\n[MIT](LICENSE-MIT)\n",
  );
  const result = await cli(root, "check");
  expect(
    result.data.findings.filter(
      (f: { severity: string }) => f.severity === "error",
    ),
  ).toEqual([]);
});

test("large linked documents remain unverified rather than being read without bounds", async () => {
  const root = await fixture();
  await writeFile(
    join(root, "README.md"),
    "# Demo\n\n[Large](large.md#example)",
  );
  await writeFile(join(root, "large.md"), "x".repeat(1_100_000));
  const result = await cli(root, "check");
  expect(result.out).toContain("reference.too-large");
  expect(
    result.data.findings.find(
      (f: { code: string }) => f.code === "reference.too-large",
    ).severity,
  ).toBe("unverified");
});
