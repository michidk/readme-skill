import { z } from "zod";
import { resolve } from "node:path";
import { localPath } from "./io";
export const relationSchema = z
  .object({
    repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
    relationship: z.string().min(1),
    description: z.string().min(1),
  })
  .strict();
export const policySchema = z
  .object({
    schemaVersion: z.literal(1).default(1),
    profile: z
      .enum([
        "application",
        "library",
        "cli",
        "experimental",
        "infrastructure",
        "resource",
      ])
      .default("application"),
    maturity: z
      .enum(["experimental", "active", "maintenance", "archived"])
      .optional(),
    maxBadges: z.number().int().min(0).max(20).default(4),
    imageBudgetBytes: z.number().int().positive().default(500_000),
    heroBudgetBytes: z.number().int().positive().default(300_000),
    requiredSections: z
      .array(z.string().min(1))
      .default(["usage", "contributing", "license"]),
    description: z.string().min(1).max(350).optional(),
    homepage: z.url().optional(),
    topics: z
      .array(z.string().regex(/^[a-z0-9][a-z0-9-]{0,49}$/))
      .max(20)
      .optional(),
    related: z.array(relationSchema).default([]),
  })
  .strict();
export type Policy = z.infer<typeof policySchema>;
const overrides = policySchema.partial();
export async function loadPolicy(
  root: string,
  shared?: string,
): Promise<Policy> {
  async function read(path: string) {
    if (!(await Bun.file(path).exists())) return {};
    const raw = z
      .record(z.string(), z.unknown())
      .parse(await Bun.file(path).json());
    const parsed = overrides.parse(raw);
    return Object.fromEntries(
      Object.entries(parsed).filter(([key]) => Object.hasOwn(raw, key)),
    );
  }
  const common = shared ? await read(resolve(shared)) : {};
  if (shared && !(await Bun.file(resolve(shared)).exists()))
    throw new Error(`Shared policy not found: ${shared}`);
  const local = await read(await localPath(root, "readme-skill.json"));
  return policySchema.parse({ ...common, ...local });
}
export const catalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    repositories: z.record(
      z.string().regex(/^[\w.-]+\/[\w.-]+$/),
      z.array(relationSchema),
    ),
  })
  .strict();
