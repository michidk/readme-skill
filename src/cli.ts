#!/usr/bin/env bun
import { Command } from "commander";
import { resolve } from "node:path";
import { loadPolicy } from "./policy";
import { inspectRepository } from "./repository";
import { checkRepository } from "./check";
import { metadataProposal } from "./metadata";
import { message } from "./io";
import { z } from "zod";
import { processMedia } from "./media";
import { renderGraphic } from "./render";
import { reviewRepository } from "./review";
import { createPreview } from "./preview";
const base = z.object({
  root: z.string(),
  json: z.boolean().optional(),
  policy: z.string().optional(),
});
const program = new Command()
  .name("readme-skill")
  .description("Evidence and media tools for an agent-led README workflow")
  .version("0.1.0");
function common(cmd: Command) {
  return cmd
    .option("--root <directory>", "Target repository", ".")
    .option("--policy <file>", "Shared policy JSON")
    .option("--json", "Machine-readable output");
}
function output(data: unknown, json?: boolean) {
  process.stdout.write(
    json ? JSON.stringify(data, null, 2) + "\n" : format(data),
  );
}
function format(data: unknown): string {
  const report = z
    .object({
      findings: z.array(
        z.object({
          severity: z.string(),
          code: z.string(),
          message: z.string(),
          line: z.number().optional(),
        }),
      ),
    })
    .safeParse(data);
  if (report.success)
    return (
      report.data.findings
        .map(
          (f) =>
            `${f.severity.toUpperCase()} ${f.code}${f.line ? `:${f.line}` : ""} ${f.message}`,
        )
        .join("\n") + "\n"
    );
  return JSON.stringify(data, null, 2) + "\n";
}
common(program.command("inspect")).action(async (raw) => {
  const o = base.parse(raw);
  output(
    await inspectRepository(
      resolve(o.root),
      await loadPolicy(resolve(o.root), o.policy),
    ),
    o.json,
  );
});
common(program.command("check"))
  .option("--readme <path>", "README path relative to root")
  .option("--network", "Check external links")
  .action(async (raw) => {
    const o = base
      .extend({
        readme: z.string().optional(),
        network: z.boolean().optional(),
      })
      .parse(raw);
    const report = await checkRepository({
      ...o,
      root: resolve(o.root),
      policy: await loadPolicy(resolve(o.root), o.policy),
    });
    output(report, o.json);
    process.exitCode = report.ok ? 0 : 1;
  });
common(program.command("review"))
  .description(
    "Gather README evidence and unanswered editorial review questions",
  )
  .option("--readme <path>", "README path relative to root")
  .action(async (raw) => {
    const o = base.extend({ readme: z.string().optional() }).parse(raw);
    output(
      await reviewRepository({
        ...o,
        root: resolve(o.root),
        policy: await loadPolicy(resolve(o.root), o.policy),
      }),
      o.json,
    );
  });
common(program.command("metadata"))
  .option("--catalog <file>", "Related-repository catalog JSON")
  .option("--github", "Read current metadata through managed gh")
  .action(async (raw) => {
    const o = base
      .extend({
        catalog: z.string().optional(),
        github: z.boolean().optional(),
      })
      .parse(raw);
    output(
      await metadataProposal({
        ...o,
        root: resolve(o.root),
        policy: await loadPolicy(resolve(o.root), o.policy),
      }),
      o.json,
    );
  });
program
  .command("media <input>")
  .description(
    "Inspect or process a local image, local video, or YouTube thumbnail",
  )
  .option("--output <file>")
  .option("--width <pixels>", "Maximum output width", "800")
  .option("--quality <number>", "JPEG/WebP quality", "85")
  .option("--play", "Composite a play indicator")
  .option(
    "--crop <left,top,width,height>",
    "Explicit crop in source pixels after orientation",
  )
  .option("--frame <seconds>", "Local video frame time")
  .option("--force", "Replace an unmanaged or modified output")
  .option("--json")
  .action(async (input: string, raw) => {
    output(await processMedia(input, raw), raw.json);
  });
program
  .command("render <spec>")
  .requiredOption("--output <file>")
  .option("--executable <path>", "Pinned HyperWeave executable")
  .option("--force")
  .option("--json")
  .action(async (spec: string, raw) => {
    const o = z
      .object({
        output: z.string(),
        executable: z.string().optional(),
        force: z.boolean().optional(),
        json: z.boolean().optional(),
      })
      .parse(raw);
    output(await renderGraphic({ ...o, spec }), o.json);
  });
program
  .command("preview")
  .option("--root <directory>", "Repository root", ".")
  .option("--readme <path>", "Relative README path", "README.md")
  .requiredOption("--output <file>")
  .option("--force")
  .option("--json")
  .action(async (raw) => {
    const o = z
      .object({
        root: z.string(),
        readme: z.string(),
        output: z.string(),
        force: z.boolean().optional(),
        json: z.boolean().optional(),
      })
      .parse(raw);
    output(await createPreview({ ...o, root: resolve(o.root) }), o.json);
  });
try {
  await program.parseAsync();
} catch (error) {
  process.stderr.write(`${message(error)}\n`);
  process.exitCode = 2;
}
