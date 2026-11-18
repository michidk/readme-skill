import sharp from "sharp";
import { z } from "zod";
import { resolve, join, extname, basename } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { run, protectSource } from "./io";
import { hash, managedAsset } from "./assets";
export const HYPERWEAVE_VERSION = "0.4.7";
const node = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    desc: z.string().optional(),
  })
  .strict();
export const graphicSchema = z.discriminatedUnion("kind", [
  z
    .object({
      schemaVersion: z.literal(1),
      kind: z.literal("badge"),
      label: z.string().min(1),
      value: z.string().min(1),
      face: z.literal("light").default("light"),
    })
    .strict(),
  z
    .object({
      schemaVersion: z.literal(1),
      kind: z.literal("diagram"),
      title: z.string().min(1),
      orientation: z.enum(["horizontal", "vertical"]).default("vertical"),
      nodes: z.array(node).min(2).max(7),
      edges: z
        .array(
          z
            .object({
              source: z.string(),
              target: z.string(),
              label: z.string().optional(),
            })
            .strict(),
        )
        .max(12),
      face: z.literal("light").default("light"),
    })
    .strict(),
]);
export async function renderGraphic(options: {
  spec: string;
  output: string;
  executable?: string;
  force?: boolean;
}) {
  await protectSource(options.spec, [
    resolve(options.output),
    `${resolve(options.output)}.source.json`,
  ]);
  const spec = graphicSchema.parse(await Bun.file(options.spec).json());
  const isolated = join(
    homedir(),
    ".cache/readme-skill/hyperweave/bin/hyperweave",
  );
  const executable =
    options.executable ??
    process.env.HYPERWEAVE_BIN ??
    ((await Bun.file(isolated).exists()) ? isolated : "hyperweave");
  const version = await run([executable, "--version"]);
  if (
    version.code !== 0 ||
    version.stdout.trim() !== `hyperweave v${HYPERWEAVE_VERSION}`
  )
    throw new Error(
      `Requires HyperWeave ${HYPERWEAVE_VERSION}; install the pinned tool or set HYPERWEAVE_BIN`,
    );
  if (spec.kind === "diagram") {
    const ids = new Set(spec.nodes.map((n) => n.id));
    if (
      ids.size !== spec.nodes.length ||
      spec.edges.some((e) => !ids.has(e.source) || !ids.has(e.target))
    )
      throw new Error(
        "Diagram node IDs must be unique and edges must reference existing nodes",
      );
  }
  const extension = extname(options.output);
  if (![".svg", ".png", ".webp"].includes(extension))
    throw new Error("Render output must be .svg, .png or .webp");
  if (resolve(options.spec) === resolve(options.output))
    throw new Error("Output must differ from spec");
  const specification = {
    ...spec,
    renderer: `hyperweave/${HYPERWEAVE_VERSION}`,
    theme: "primer.porcelain",
    layoutRevision: 3,
    rasterizer: sharp.versions.sharp,
    format: extension,
  };
  return {
    schemaVersion: 1,
    ...(await managedAsset({
      output: resolve(options.output),
      source: basename(options.spec),
      specification,
      inputHash: hash(JSON.stringify(specification)),
      force: options.force,
      produce: async () => {
        const temp = await mkdtemp(join(tmpdir(), "readme-render-"));
        try {
          const out = join(temp, "artifact.svg");
          const args = [executable, "compose", spec.kind];
          if (spec.kind === "badge") args.push(spec.label, spec.value);
          else {
            const path = join(temp, "diagram.json");
            await Bun.write(
              path,
              JSON.stringify({
                topology: "pipeline",
                orientation: spec.orientation,
                chassis:
                  spec.orientation === "vertical"
                    ? { width: 400, node: { w: 280, h: 80 }, card_min_w: 280 }
                    : {},
                title: spec.title,
                nodes: spec.nodes,
                edges: spec.edges,
              }),
            );
            args.push("--spec-file", path);
          }
          args.push(
            "-g",
            "primer",
            "--variant",
            "porcelain",
            "--motion",
            "static",
            "--font-mode",
            "system",
            "--format",
            "svg-static",
            "-o",
            out,
          );
          if (spec.kind === "diagram")
            args.push("--surface", "plate", "--face", spec.face);
          const rendered = await run(args, undefined, 60_000);
          if (rendered.code !== 0)
            throw new Error(
              `HyperWeave render failed: ${rendered.stderr || rendered.stdout}`,
            );
          const bytes = await Bun.file(out).bytes();
          if (!bytes.length)
            throw new Error("HyperWeave produced an empty artifact");
          if (extension === ".png") return sharp(bytes).png().toBuffer();
          if (extension === ".webp")
            return sharp(bytes).webp({ quality: 90 }).toBuffer();
          return bytes;
        } finally {
          await rm(temp, { recursive: true, force: true });
        }
      },
    })),
  };
}
