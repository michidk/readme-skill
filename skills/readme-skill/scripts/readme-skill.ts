#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const bundled = resolve(import.meta.dir, "../runtime/src/cli.ts");
const source = resolve(import.meta.dir, "../../../src/cli.ts");
const cli = existsSync(bundled) ? bundled : source;
if (!existsSync(cli))
  throw new Error(
    "README Skill runtime is missing. Install the complete skill using bun run install-skill.",
  );
const child = Bun.spawn([process.execPath, cli, ...process.argv.slice(2)], {
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});
process.exitCode = await child.exited;
