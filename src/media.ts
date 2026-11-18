import sharp from "sharp";
import { basename, extname, resolve, join } from "node:path";
import { mkdtemp, realpath, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { z } from "zod";
import { hash, managedAsset } from "./assets";
import { run, protectSource } from "./io";
const cropSchema = z.tuple([
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.number().int().positive(),
  z.number().int().positive(),
]);
export const mediaOptions = z
  .object({
    output: z.string().optional(),
    width: z.coerce.number().int().min(16).max(4096).default(800),
    quality: z.coerce.number().int().min(20).max(100).default(85),
    play: z.boolean().default(false),
    crop: z.string().optional(),
    force: z.boolean().default(false),
    frame: z.coerce.number().min(0).max(86400).optional(),
    json: z.boolean().optional(),
  })
  .strict();
async function fetchImage(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty image response");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 20_000_000) throw new Error("Image exceeds 20 MB limit");
      chunks.push(part.value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks);
}
export async function youtubeThumbnail(
  url: string,
  download: (url: string) => Promise<Buffer> = fetchImage,
) {
  const parsed = new URL(url);
  let id: string | null = null;
  if (parsed.hostname === "youtu.be") id = parsed.pathname.slice(1);
  else if (
    ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(
      parsed.hostname,
    )
  )
    id =
      parsed.searchParams.get("v") ??
      parsed.pathname.match(/^\/(?:shorts|embed)\/([^/]+)$/)?.[1] ??
      null;
  if (!id || !/^[-\w]{11}$/.test(id))
    throw new Error(
      "Expected a YouTube video URL with an 11-character video ID",
    );
  for (const variant of [
    "maxresdefault",
    "sddefault",
    "hqdefault",
    "mqdefault",
  ]) {
    try {
      const bytes = await download(
        `https://i.ytimg.com/vi/${id}/${variant}.jpg`,
      );
      const meta = await sharp(bytes).metadata();
      if ((meta.width ?? 0) < 300) continue;
      return {
        bytes,
        source: `https://www.youtube.com/watch?v=${id}`,
        variant,
      };
    } catch {
      continue;
    }
  }
  throw new Error(
    "No usable YouTube thumbnail available; provide a local thumbnail",
  );
}
async function sourceImage(input: string, frame?: number) {
  if (/^https?:\/\//i.test(input)) return youtubeThumbnail(input);
  const file = Bun.file(input);
  if (!(await file.exists())) throw new Error(`Input does not exist: ${input}`);
  if (/\.(mp4|webm|mov|mkv)$/i.test(input)) {
    const temp = await mkdtemp(join(tmpdir(), "readme-frame-"));
    try {
      const output = join(temp, "frame.png");
      const result = await run(
        [
          "ffmpeg",
          "-nostdin",
          "-v",
          "error",
          "-ss",
          String(frame ?? 0),
          "-i",
          resolve(input),
          "-frames:v",
          "1",
          "-vf",
          "scale=1920:1920:force_original_aspect_ratio=decrease",
          "-y",
          output,
        ],
        undefined,
        30_000,
      );
      if (result.code !== 0)
        throw new Error(`Frame extraction failed: ${result.stderr}`);
      return {
        bytes: Buffer.from(await Bun.file(output).bytes()),
        source: basename(input),
        variant: `frame:${frame ?? 0}`,
      };
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  }
  if (file.size > 20_000_000) throw new Error("Image exceeds 20 MB limit");
  return {
    bytes: Buffer.from(await file.bytes()),
    source: basename(input),
    variant: "local",
  };
}
async function letterbox(bytes: Uint8Array) {
  const { data, info } = await sharp(bytes)
    .rotate()
    .resize({ width: 160, withoutEnlargement: true })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  function dark(y: number) {
    let sum = 0;
    for (let x = 0; x < info.width; x++)
      for (let c = 0; c < 3; c++)
        sum += data[(y * info.width + x) * info.channels + c] ?? 255;
    return sum / (info.width * 3) < 10;
  }
  let top = 0,
    bottom = 0;
  while (top < info.height / 3 && dark(top)) top++;
  while (bottom < info.height / 3 && dark(info.height - bottom - 1)) bottom++;
  return top || bottom
    ? {
        top,
        bottom,
        measurementHeight: info.height,
        note: "Candidate dark rows only. Dark UI can look identical; crop explicitly after inspection.",
      }
    : null;
}
export async function processMedia(input: string, raw: unknown) {
  const options = mediaOptions.parse(raw);
  const source = await sourceImage(input, options.frame);
  const metadata = await sharp(source.bytes).rotate().metadata();
  if (!metadata.width || !metadata.height)
    throw new Error("Image has no dimensions");
  if (!options.output)
    return {
      schemaVersion: 1,
      source: source.source,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      bytes: source.bytes.length,
      letterboxCandidate: await letterbox(source.bytes),
    };
  const output = resolve(options.output);
  if (!/^https?:/.test(input))
    await protectSource(input, [output, `${output}.source.json`]);
  const extension = extname(output).toLowerCase();
  if (![".png", ".webp", ".jpg", ".jpeg"].includes(extension))
    throw new Error("Output must end in .png, .webp, .jpg or .jpeg");
  const crop = options.crop
    ? cropSchema.parse(options.crop.split(",").map(Number))
    : null;
  const specification = {
    operation: "media",
    format: extension === ".jpeg" ? ".jpg" : extension,
    width: options.width,
    quality: options.quality,
    play: options.play,
    crop,
    variant: source.variant,
    sharp: sharp.versions.sharp,
  };
  const result = await managedAsset({
    output,
    source: source.source,
    specification,
    inputHash: hash(
      Buffer.concat([source.bytes, Buffer.from(JSON.stringify(specification))]),
    ),
    force: options.force,
    produce: async () => {
      let pipeline = sharp(source.bytes, {
        limitInputPixels: 40_000_000,
      }).rotate();
      if (crop) {
        const [left, top, width, height] = crop;
        pipeline = pipeline.extract({ left, top, width, height });
      }
      const resized = await pipeline
        .resize({ width: options.width, withoutEnlargement: true })
        .png()
        .toBuffer();
      const meta = await sharp(resized).metadata();
      if (!meta.width || !meta.height) throw new Error("Cannot size output");
      let composed = sharp(resized);
      if (options.play) {
        const w = meta.width,
          h = meta.height,
          r = Math.max(8, Math.min(w, h) * 0.095);
        const overlay = Buffer.from(
          `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><circle cx="${w / 2}" cy="${h / 2}" r="${r}" fill="#111827" fill-opacity="0.85" stroke="white" stroke-width="${Math.max(1, r / 16)}"/><path d="M ${w / 2 - r * 0.25} ${h / 2 - r * 0.48} L ${w / 2 + r * 0.5} ${h / 2} L ${w / 2 - r * 0.25} ${h / 2 + r * 0.48} Z" fill="white"/></svg>`,
        );
        composed = composed.composite([{ input: overlay }]);
      }
      return extension === ".png"
        ? composed.png({ compressionLevel: 9 }).toBuffer()
        : extension === ".webp"
          ? composed.webp({ quality: options.quality }).toBuffer()
          : composed
              .jpeg({ quality: options.quality, mozjpeg: true })
              .toBuffer();
    },
  });
  const meta = await sharp(output).metadata();
  return {
    schemaVersion: 1,
    output,
    reused: result.reused,
    width: meta.width,
    height: meta.height,
    bytes: Bun.file(output).size,
    record: `${output}.source.json`,
  };
}
