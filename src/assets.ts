import { createHash } from "node:crypto";
import { lstat } from "node:fs/promises";
import { z } from "zod";
import { atomicWrite } from "./io";
export function hash(data: string | Uint8Array) {
  return createHash("sha256").update(data).digest("hex");
}
const recordSchema = z
  .object({
    schemaVersion: z.literal(1),
    tool: z.enum(["readme-skill/0.1.0", "readme-workshop/0.1.0"]),
    inputHash: z.string(),
    outputHash: z.string(),
    specification: z.unknown(),
    source: z.string(),
  })
  .strict();
export async function managedAsset(options: {
  output: string;
  inputHash: string;
  specification: unknown;
  source: string;
  force?: boolean;
  produce: () => Promise<Uint8Array>;
}) {
  const { output } = options;
  const sidecar = `${output}.source.json`;
  for (const path of [output, sidecar]) {
    try {
      if ((await lstat(path)).isSymbolicLink())
        throw new Error(`Refusing symlink output: ${path}`);
    } catch (error) {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ))
        throw error;
    }
  }
  const exists = await Bun.file(output).exists();
  const hasRecord = await Bun.file(sidecar).exists();
  let record: z.infer<typeof recordSchema> | undefined;
  if (hasRecord) {
    try {
      const parsed = recordSchema.safeParse(await Bun.file(sidecar).json());
      if (parsed.success) record = parsed.data;
    } catch {
      /* malformed sidecars are unmanaged and require explicit replacement */
    }
  }
  if ((exists || hasRecord) && !record && !options.force)
    throw new Error(
      "Output or provenance is unmanaged; use --force to explicitly replace it",
    );
  if (exists && record) {
    const actual = hash(await Bun.file(output).bytes());
    if (actual !== record.outputHash && !options.force)
      throw new Error(
        "Output was modified outside this tool; use --force to replace it",
      );
    if (actual === record.outputHash && record.inputHash === options.inputHash)
      return { output, reused: true, record };
  }
  const data = await options.produce();
  const nextRecord = recordSchema.parse({
    schemaVersion: 1,
    tool: "readme-skill/0.1.0",
    inputHash: options.inputHash,
    outputHash: hash(data),
    specification: options.specification,
    source: options.source,
  });
  await atomicWrite(output, data);
  await atomicWrite(sidecar, JSON.stringify(nextRecord, null, 2) + "\n");
  return { output, reused: false, record: nextRecord };
}
