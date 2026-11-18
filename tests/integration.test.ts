import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { checkRemote } from "../src/check";
import { loadPolicy } from "../src/policy";
import { createPreview } from "../src/preview";
import { renderGraphic } from "../src/render";
import { metadataProposal } from "../src/metadata";
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((p) => rm(p, { recursive: true, force: true })),
  );
});
async function fixture() {
  const p = await mkdtemp(join(tmpdir(), "readme-integration-"));
  roots.push(p);
  return p;
}
test("remote status distinguishes broken links from blocked or unavailable links", async () => {
  const server = Bun.serve({
    port: 0,
    fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === "/fallback")
        return new Response("", {
          status: request.method === "HEAD" ? 405 : 200,
        });
      return new Response("", { status: Number(path.slice(1)) });
    },
  });
  try {
    expect(await checkRemote(`${server.url}200`)).toBeNull();
    expect(await checkRemote(`${server.url}fallback`)).toBeNull();
    expect((await checkRemote(`${server.url}404`))?.severity).toBe("error");
    for (const code of [403, 429, 503])
      expect((await checkRemote(`${server.url}${code}`))?.severity).toBe(
        "unverified",
      );
  } finally {
    server.stop(true);
  }
});
test("policy merges shared defaults with project overrides; metadata never invents unknown fields", async () => {
  const root = await fixture();
  const shared = join(root, "shared.json");
  await writeFile(
    shared,
    JSON.stringify({ maxBadges: 2, description: "A useful tool" }),
  );
  await writeFile(
    join(root, "readme-skill.json"),
    JSON.stringify({ maxBadges: 3 }),
  );
  const policy = await loadPolicy(root, shared);
  expect(policy.maxBadges).toBe(3);
  expect(policy.description).toBe("A useful tool");
  const proposal = await metadataProposal({ root, policy });
  expect(proposal.applied).toBe(false);
  expect(proposal.proposed.homepage).toBeNull();
  expect(proposal.proposed.description).toBe("A useful tool");
});
test("preview embeds local images and strips active HTML", async () => {
  const root = await fixture();
  await sharp({
    create: { width: 20, height: 20, channels: 3, background: "red" },
  })
    .png()
    .toFile(join(root, "demo.png"));
  await writeFile(
    join(root, "README.md"),
    '# Demo\n\n![Demo](demo.png)\n<script>alert(1)</script>\n<img src="https://example.invalid/tracker" onerror="alert(2)">',
  );
  const output = join(root, "review.html");
  const result = await createPreview({ root, readme: "README.md", output });
  const html = await Bun.file(output).text();
  expect(html).toContain("data:image/png;base64,");
  expect(html).not.toContain("<script>");
  expect(html).not.toContain("onerror");
  expect(html).not.toContain('src="https:');
  expect(result.githubVerified).toBe(false);
});
test("installed skill launcher runs from an unrelated directory", async () => {
  const root = await fixture();
  const destination = join(root, "skill");
  const p = Bun.spawn(
    [
      process.execPath,
      resolve("scripts/install-skill.ts"),
      "--destination",
      destination,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  const stderr = await new Response(p.stderr).text();
  expect(await p.exited, stderr).toBe(0);
  const launch = Bun.spawn(
    [
      process.execPath,
      join(destination, "scripts/readme-skill.ts"),
      "inspect",
      "--root",
      root,
      "--json",
    ],
    { cwd: tmpdir(), stdout: "pipe", stderr: "pipe" },
  );
  const text = await new Response(launch.stdout).text();
  expect(await launch.exited).toBe(0);
  expect(JSON.parse(text).schemaVersion).toBe(1);
  const again = Bun.spawn(
    [
      process.execPath,
      resolve("scripts/install-skill.ts"),
      "--destination",
      destination,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  await new Response(again.stderr).text();
  expect(await again.exited).not.toBe(0);
}, 60_000);
const hyperweave = process.env.HYPERWEAVE_BIN;
test.skipIf(!hyperweave)(
  "pinned HyperWeave renders badge and diagram and reuses output",
  async () => {
    const root = await fixture();
    for (const name of ["status", "workflow"]) {
      const output = join(root, `${name}.svg`);
      const options = {
        spec: resolve(`examples/${name}.json`),
        output,
        executable: hyperweave,
      };
      const first = await renderGraphic(options);
      expect(first.reused).toBe(false);
      expect((await sharp(output).metadata()).width).toBeGreaterThan(0);
      const png = join(root, `${name}.png`);
      await renderGraphic({ ...options, output: png });
      const expected = await sharp(output).png().toBuffer();
      expect(await Bun.file(png).bytes()).toEqual(new Uint8Array(expected));
      const second = await renderGraphic(options);
      expect(second.reused).toBe(true);
    }
  },
  60_000,
);

test("partial project policy preserves every omitted shared policy field", async () => {
  const root = await fixture();
  const shared = join(root, "shared.json");
  await writeFile(
    shared,
    JSON.stringify({
      maxBadges: 1,
      profile: "cli",
      requiredSections: ["install"],
    }),
  );
  await writeFile(
    join(root, "readme-skill.json"),
    JSON.stringify({ description: "Useful tool" }),
  );
  const policy = await loadPolicy(root, shared);
  expect(policy.maxBadges).toBe(1);
  expect(policy.profile).toBe("cli");
  expect(policy.requiredSections).toEqual(["install"]);
});

test("preview cannot overwrite README through a parent-directory symlink", async () => {
  const root = await fixture();
  await writeFile(join(root, "README.md"), "# Preserve me");
  const { symlink } = await import("node:fs/promises");
  await symlink(root, join(root, "alias"));
  await expect(
    createPreview({
      root,
      readme: "README.md",
      output: join(root, "alias", "README.md"),
      force: true,
    }),
  ).rejects.toThrow();
  expect(await Bun.file(join(root, "README.md")).text()).toBe("# Preserve me");
});

test("render protects the spec when it occupies the output provenance path", async () => {
  const root = await fixture();
  const output = join(root, "diagram.svg"),
    spec = output + ".source.json";
  const text = JSON.stringify({
    schemaVersion: 1,
    kind: "badge",
    label: "status",
    value: "test",
  });
  await writeFile(spec, text);
  await expect(renderGraphic({ spec, output, force: true })).rejects.toThrow(
    "differ from source",
  );
  expect(await Bun.file(spec).text()).toBe(text);
});

test("YouTube thumbnail selection falls back from unavailable and placeholder variants", async () => {
  const { youtubeThumbnail } = await import("../src/media");
  const tiny = await sharp({
    create: { width: 120, height: 90, channels: 3, background: "red" },
  })
    .jpeg()
    .toBuffer();
  const good = await sharp({
    create: { width: 480, height: 360, channels: 3, background: "blue" },
  })
    .jpeg()
    .toBuffer();
  const server = Bun.serve({
    port: 0,
    fetch(request) {
      const path = new URL(request.url).pathname;
      return path.includes("maxres")
        ? new Response("", { status: 404 })
        : new Response(path.includes("sddefault") ? tiny : good);
    },
  });
  try {
    const result = await youtubeThumbnail(
      "https://youtu.be/abcdefghijk",
      async (url: string) => {
        const response = await fetch(
          new URL(new URL(url).pathname, server.url),
        );
        if (!response.ok) throw new Error("Unavailable");
        return Buffer.from(await response.arrayBuffer());
      },
    );
    expect(result.variant).toBe("hqdefault");
    expect((await sharp(result.bytes).metadata()).width).toBe(480);
  } finally {
    server.stop(true);
  }
});
