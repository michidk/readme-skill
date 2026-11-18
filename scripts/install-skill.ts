import { cp, mkdir, mkdtemp, rename, rm, lstat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve, join } from "node:path";
import { parseArgs } from "node:util";
import { run } from "../src/io";
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    destination: { type: "string" },
    force: { type: "boolean", default: false },
  },
});
const source = resolve(import.meta.dir, "..");
const destination = resolve(
  values.destination ??
    join(
      process.env.CODEX_HOME ?? join(homedir(), ".codex"),
      "skills",
      "readme-skill",
    ),
);
const parent = dirname(destination);
await mkdir(parent, { recursive: true });
let exists = false;
try {
  const info = await lstat(destination);
  exists = true;
  if (info.isSymbolicLink())
    throw new Error(
      "Refusing to replace a managed symlink. Install into the canonical skill directory.",
    );
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
    throw error;
}
if (exists && !values.force)
  throw new Error(
    "Skill already exists; inspect it first, then use --force to replace explicitly.",
  );
const temp = await mkdtemp(join(parent, ".readme-skill-"));
const backup = `${temp}.previous`;
try {
  await cp(join(source, "skills/readme-skill"), temp, { recursive: true });
  const runtime = join(temp, "runtime");
  await mkdir(runtime);
  for (const path of ["src", "package.json", "bun.lock", "schemas", "examples"])
    await cp(join(source, path), join(runtime, path), { recursive: true });
  const installed = await run(
    [process.execPath, "install", "--frozen-lockfile", "--production"],
    runtime,
    120_000,
  );
  if (installed.code !== 0) throw new Error(installed.stderr);
  if (exists) await rename(destination, backup);
  try {
    await rename(temp, destination);
  } catch (error) {
    if (exists) await rename(backup, destination);
    throw error;
  }
  if (exists) await rm(backup, { recursive: true, force: true });
  process.stdout.write(
    `Installed ${destination}\nRun: bun ${join(destination, "scripts/readme-skill.ts")} --help\n`,
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
