import { readdir, lstat, realpath } from "node:fs/promises";
import { basename, join } from "node:path";
import { z } from "zod";
import { run, localPath, message } from "./io";
import type { Policy } from "./policy";
const skip = new Set([
  ".git",
  "node_modules",
  "vendor",
  "target",
  "dist",
  "build",
  ".next",
  ".serena",
  ".codex",
  ".claude",
  ".agents",
]);
const secret = /(^|\/)(\.env(?:\.|$)|credentials(?:\.|$)|.*\.(?:pem|key)$)/i;
const manifestSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    license: z.string().optional(),
    homepage: z.string().optional(),
    scripts: z.record(z.string(), z.string()).optional(),
  })
  .passthrough();
export async function inventory(root: string) {
  const git = await run(
    ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    root,
  );
  let files: string[] = [];
  if (git.code === 0) files = git.stdout.split("\0").filter(Boolean);
  else {
    async function walk(dir: string, depth: number) {
      if (depth > 12 || files.length >= 10_000) return;
      for (const entry of await readdir(join(root, dir), {
        withFileTypes: true,
      })) {
        if (skip.has(entry.name) || entry.isSymbolicLink()) continue;
        const path = join(dir, entry.name);
        if (secret.test(path)) continue;
        if (entry.isDirectory()) await walk(path, depth + 1);
        else if (entry.isFile()) files.push(path);
      }
    }
    await walk("", 0);
  }
  const safe: string[] = [];
  for (const path of files.sort().slice(0, 10_000)) {
    if (secret.test(path) || path.split("/").some((part) => skip.has(part)))
      continue;
    try {
      const target = await localPath(root, path);
      if (!(await lstat(target)).isSymbolicLink()) safe.push(path);
    } catch {
      /* inaccessible inventory entries are omitted; document checks report referenced paths */
    }
  }
  return {
    files: safe,
    truncated: files.length >= 10_000,
    git: git.code === 0,
  };
}
export async function inspectRepository(root: string, policy: Policy) {
  root = await realpath(root);
  const listed = await inventory(root);
  const warnings: string[] = [];
  const revision = await run(["git", "rev-parse", "HEAD"], root);
  const remote = await run(["git", "remote", "get-url", "origin"], root);
  const repository =
    remote.stdout
      .trim()
      .match(/github\.com[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?$/)?.[1] ?? null;
  const manifests = [];
  for (const path of listed.files
    .filter((p) =>
      /(^|\/)(package.json|Cargo.toml|pyproject.toml|go.mod)$/.test(p),
    )
    .slice(0, 30)) {
    const file = Bun.file(await localPath(root, path));
    if (file.size > 128_000) {
      warnings.push(`${path}: too large to inspect`);
      continue;
    }
    try {
      if (basename(path) === "package.json") {
        const data = manifestSchema.parse(await file.json());
        manifests.push({
          path,
          kind: "package",
          name: data.name,
          description: data.description,
          declaredLicense: data.license,
          homepage: data.homepage,
          commands: Object.entries(data.scripts ?? {}).map(
            ([name, command]) => ({
              name,
              command,
              verification: "discovered-not-executed",
            }),
          ),
        });
      } else
        manifests.push({
          path,
          kind: "manifest",
          verification: "located-not-parsed",
        });
    } catch (error) {
      warnings.push(`${path}: ${message(error)}`);
    }
  }
  const license =
    listed.files.find((p) =>
      /^(LICENSE|LICENCE|COPYING)([.-][^/]+)?$/i.test(p),
    ) ?? null;
  const documents = listed.files.filter((p) => /\.md$/i.test(p));
  const readme =
    [".github/README.md", "README.md", "docs/README.md"].find((p) =>
      listed.files.includes(p),
    ) ??
    documents.find((p) => /^readme\.md$/i.test(p)) ??
    null;
  return {
    schemaVersion: 1,
    root,
    repository,
    revision: revision.code === 0 ? revision.stdout.trim() : null,
    readme,
    license,
    documents,
    assets: listed.files.filter((p) =>
      /\.(png|jpe?g|webp|svg|gif|mp4|webm)$/i.test(p),
    ),
    manifests,
    policy,
    warnings,
    truncated: listed.truncated,
    verification: { commands: "not-executed", claims: "require-agent-review" },
  };
}
