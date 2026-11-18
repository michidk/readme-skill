import { catalogSchema, type Policy } from "./policy";
import { inspectRepository } from "./repository";
import { run } from "./io";
export async function metadataProposal(options: {
  root: string;
  policy: Policy;
  catalog?: string;
  github?: boolean;
}) {
  const repo = await inspectRepository(options.root, options.policy);
  const related = options.catalog
    ? (catalogSchema.parse(await Bun.file(options.catalog).json()).repositories[
        repo.repository ?? ""
      ] ?? [])
    : [];
  let current: unknown = null;
  if (options.github) {
    if (!repo.repository) throw new Error("No GitHub origin found");
    const result = await run(
      ["gh", "api", `repos/${repo.repository}`],
      repo.root,
    );
    if (result.code !== 0) throw new Error(result.stderr);
    const raw = await import("zod");
    const data = raw.z
      .object({
        description: raw.z.string().nullable(),
        homepage: raw.z.string().nullable(),
        topics: raw.z.array(raw.z.string()).optional(),
      })
      .parse(JSON.parse(result.stdout));
    current = data;
  }
  return {
    schemaVersion: 1,
    repository: repo.repository,
    current,
    proposed: {
      description: options.policy.description ?? null,
      homepage: options.policy.homepage ?? null,
      topics: options.policy.topics ?? null,
    },
    related: [...options.policy.related, ...related],
    missing: ["description", "homepage", "topics"].filter(
      (key) => !(key in options.policy),
    ),
    applied: false,
    socialPreview:
      "Prepare 1280x640 image under 1 MB; upload separately when authorized.",
  };
}
