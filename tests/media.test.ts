import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((p) => rm(p, { recursive: true, force: true })),
  );
});
async function fixture() {
  const p = await mkdtemp(join(tmpdir(), "readme-media-"));
  roots.push(p);
  return p;
}
async function cli(...args: string[]) {
  const p = Bun.spawn(
    [process.execPath, resolve("src/cli.ts"), ...args, "--json"],
    { stdout: "pipe", stderr: "pipe" },
  );
  const [out, err, code] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  return { out, err, code, data: out ? JSON.parse(out) : null };
}
test("media creates a thumbnail, preserves source and reuses identical output", async () => {
  const root = await fixture();
  const input = join(root, "input.png"),
    output = join(root, "demo.webp");
  await sharp({
    create: { width: 640, height: 360, channels: 3, background: "#97abcb" },
  })
    .png()
    .toFile(input);
  const before = await Bun.file(input).bytes();
  const first = await cli(
    "media",
    input,
    "--output",
    output,
    "--width",
    "800",
    "--play",
  );
  expect(first.code).toBe(0);
  expect(first.data.width).toBe(640);
  expect(await Bun.file(input).bytes()).toEqual(before);
  expect(first.data.reused).toBe(false);
  const second = await cli(
    "media",
    input,
    "--output",
    output,
    "--width",
    "800",
    "--play",
  );
  expect(second.data.reused).toBe(true);
  await writeFile(output, "changed by someone else");
  const third = await cli(
    "media",
    input,
    "--output",
    output,
    "--width",
    "800",
    "--play",
  );
  expect(third.code).toBe(2);
  expect(third.err).toContain("modified");
});
test("does not overwrite unmanaged output or source", async () => {
  const root = await fixture();
  const input = join(root, "input.png");
  await sharp({
    create: { width: 30, height: 20, channels: 3, background: "red" },
  })
    .png()
    .toFile(input);
  expect((await cli("media", input, "--output", input, "--force")).code).toBe(
    2,
  );
  const output = join(root, "existing.png");
  await writeFile(output, "keep me");
  expect((await cli("media", input, "--output", output)).code).toBe(2);
  expect(await Bun.file(output).text()).toBe("keep me");
});
test("candidate letterboxing is reported and never cropped automatically", async () => {
  const root = await fixture();
  const input = join(root, "bars.png");
  await sharp({
    create: { width: 160, height: 120, channels: 3, background: "black" },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width: 160,
            height: 90,
            channels: 3,
            background: "#8a94a4",
          },
        })
          .png()
          .toBuffer(),
        left: 0,
        top: 15,
      },
    ])
    .png()
    .toFile(input);
  const result = await cli("media", input);
  expect(result.data.letterboxCandidate.top).toBeGreaterThan(0);
  const output = join(root, "out.png");
  await cli("media", input, "--output", output);
  expect((await sharp(output).metadata()).height).toBe(120);
  const crop = await cli(
    "media",
    input,
    "--output",
    join(root, "crop.png"),
    "--crop",
    "0,15,160,90",
  );
  expect(crop.data.height).toBe(90);
});
test("invalid image and crop return an actionable failure", async () => {
  const root = await fixture();
  const input = join(root, "bad.png");
  await writeFile(input, "not an image");
  expect((await cli("media", input)).code).toBe(2);
});

test("protects source and unmanaged provenance sidecars even when output does not exist", async () => {
  const root = await fixture();
  const output = join(root, "out.png"),
    sidecar = output + ".source.json";
  await sharp({
    create: { width: 30, height: 20, channels: 3, background: "blue" },
  })
    .png()
    .toFile(sidecar);
  const before = await Bun.file(sidecar).bytes();
  expect(
    (await cli("media", sidecar, "--output", output, "--force")).code,
  ).toBe(2);
  expect(await Bun.file(sidecar).bytes()).toEqual(before);
  const input = join(root, "input.png");
  await writeFile(input, before);
  await writeFile(sidecar, "unrelated data");
  expect((await cli("media", input, "--output", output)).code).toBe(2);
  expect(await Bun.file(sidecar).text()).toBe("unrelated data");
});

test("encoder format participates in cache identity and malformed sidecars can be explicitly replaced", async () => {
  const root = await fixture();
  const input = join(root, "input.png"),
    png = join(root, "asset.png"),
    webp = join(root, "asset.webp");
  await sharp({
    create: { width: 64, height: 32, channels: 3, background: "red" },
  })
    .png()
    .toFile(input);
  await cli("media", input, "--output", png);
  const { rename } = await import("node:fs/promises");
  await rename(png, webp);
  await rename(png + ".source.json", webp + ".source.json");
  const converted = await cli("media", input, "--output", webp);
  expect(converted.data.reused).toBe(false);
  expect((await sharp(webp).metadata()).format).toBe("webp");
  await writeFile(webp + ".source.json", "{broken");
  expect((await cli("media", input, "--output", webp, "--force")).code).toBe(0);
});

test("dark application content is not automatically removed and invalid crop is rejected", async () => {
  const root = await fixture();
  const input = join(root, "dark-ui.png"),
    output = join(root, "out.png");
  await sharp({
    create: { width: 120, height: 80, channels: 3, background: "#070707" },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="120" height="80"><rect x="10" y="20" width="100" height="40" fill="#172b4d"/></svg>',
        ),
      },
    ])
    .png()
    .toFile(input);
  const report = await cli("media", input, "--output", output);
  expect(report.data.height).toBe(80);
  expect(report.data.width).toBe(120);
  expect(
    (
      await cli(
        "media",
        input,
        "--output",
        join(root, "bad.png"),
        "--crop",
        "0,0,200,100",
      )
    ).code,
  ).toBe(2);
});
