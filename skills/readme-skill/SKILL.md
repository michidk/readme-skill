---
name: readme-skill
license: MIT
description: Create, audit, or refine GitHub READMEs and set repository descriptions and topics using repository evidence and restrained visuals.
---

# README Skill

Produce a useful project entry point with accurate instructions and deliberate visuals. Use the current agent for repository reasoning and editing; use the bundled tools for repeatable checks and media operations.

## Locate the toolkit

Resolve paths relative to this skill's directory. Run `bun <skill>/scripts/readme-skill.ts --help` from any working directory. The project installer includes a runtime; in a source checkout the launcher uses the enclosing project.

Directory installers such as `skills add` copy the skill folder without the toolkit. If the launcher reports a missing runtime, read [toolkit-setup.md](references/toolkit-setup.md) and install it inside the skill directory. Do not add toolkit dependencies to the target project. Do not overwrite an existing runtime or local edits.

## Select the work

- **Metadata:** prepare or update the repository description, topics, and an established homepage. Read [delivery.md](references/delivery.md); skip README editing and media generation unless also requested.
- **Audit:** report findings without modifying tracked files or repository settings.
- **Refine:** preserve accurate content and existing anchors, improve only what benefits the reader, and repair inaccurate claims and broken references.
- **Create:** write a missing README. An existing README means refine unless the user explicitly requested replacement.

Use the user's target repository or the current project. Infer audience, project type, and existing branding. Ask only about consequential missing facts, honoring answers and authorization already provided. Missing optional artwork or graphics tooling should not stop text work.

## Choose the presentation

For create/refine, use an explicit style in the user's request first, then a preference already established in this conversation, then `presentation` from the merged project/shared policy. If none is known, ask once: "Do you want the README very serious, neutral, or fancy?" Offer neutral as the recommended choice. Continue repository inspection while waiting, but wait for the answer before changing presentation. Do not ask during audit or metadata-only work. If the user explicitly requested unattended work, use neutral when no preference is available and report that assumption.

Read [presentation.md](references/presentation.md) for the three styles and SVG separator templates. Remember the choice for this task; save it in an existing project policy when appropriate. Do not create a configuration file just to remember a style unless requested. Style affects presentation, not factual accuracy, scope, or the rules below.

## Content boundaries

Every sentence must help the reader understand, install, or use the project. Omit unfinished work, missing-license notices, absent releases, internal review history, and speculative best-practice sections. Never choose a license for the owner. Preserve existing legal notices and attribution.

If a known issue needs a decision, ask the user in the conversation before adding it to the README; continue unrelated work. Do not publish a known-issues section, disclaimer, or warning on your own. Existing user instructions may already answer the question.

Create companion files such as CONTRIBUTING.md, SECURITY.md, or a changelog only when the user explicitly requests that file. A generic README request, a template, or a checker finding is not authorization. Link useful existing documents without inventing missing ones. Keep prerequisites to the minimum for the basic workflow; optional integrations belong with their feature instructions.

Include a restrained row of useful shields. Every included badge must have a verified value, working image, and relevant destination. Omit unknown badges instead of placeholders or guessed claims. Follow the user's preferred header order and do not pad the row.

## Investigate and compose

1. Run `inspect --root <repo> --json`, optionally with `--policy <shared.json>`. Read the repository's instructions, existing docs, actual entry points, relevant implementation, and manifest scripts. Inventory is evidence of files, not evidence that features work. Never execute discovered scripts automatically.
2. Read [editorial.md](references/editorial.md). For an existing README, run `review --root <repo> --json` and answer its editorial questions with source locations and observed results before editing. Establish what the project does, maturity, the first useful action, release/download paths, contribution entry points, and licensing. Keep an evidence note linking consequential claims to source paths or release records. Distinguish discovered commands from commands actually verified.
3. Read [header.md](references/header.md) and choose a visual direction using the user's references and original requirements. Account for header/hero, screenshots/video, badges/callouts, navigation, shared standards, and repository metadata. Do not silently omit requested imagery. Edit Markdown directly. Preserve valuable prose, legal notices, meaningful anchors, and useful diagrams. Update existing supporting docs when needed; create new companion documents only when explicitly requested; do not manufacture policy promises, license choices, warnings, or empty companion files. Ask the user before documenting a known issue or critical risk unless they already explicitly requested it; routine publication or maturity status does not justify a warning. Report affected translations rather than rewriting all languages automatically.
4. When media adds useful information, read [media.md](references/media.md). Prefer actual product screenshots and existing logos. Prepare assets with the tools, keep provenance sidecars, and reference only finished assets. Do not regenerate an unchanged good asset.
5. Run `check --root <repo> --json`, with `--network` when remote checks are appropriate. Fix confirmed errors. A missing license is an internal finding, not permission to select one or add a missing-license notice to the README. Omit the unfinished section. Unavailable checks remain unverified.
6. Inspect actual assets at their intended display size. Use `preview --root <repo> --output <cache>/review.html` to prepare a sanitized local review artifact. When browser verification is requested or permitted by the current environment, inspect it at narrow and wide widths and on light/dark backgrounds, then verify GitHub rendering when available. Local preview is not GitHub verification. If visual tooling is unavailable, report that limit rather than claiming visual quality from lint alone.
7. Repeat the editorial assessment. Record whether a newcomer can reach a first useful result, whether each visual earns its space, and what remains unsupported. Recheck changed references and report what changed, what passed, and what remains unverified. A successful refinement can be a small diff or no diff.

Use a temporary/cache directory outside the target repo for reports and previews. Final images and their `.source.json` files belong with repository documentation assets. Source specifications are needed for repeatable edits. Do not delete unrelated or unowned assets.

## Metadata and delivery

For related-repository links and GitHub presentation, read [delivery.md](references/delivery.md). Prepare concrete metadata proposals. Keep local generation and remote publication separate; apply settings or publish only when authorized. Follow the user's existing GitHub identity, signing, branch, and PR conventions.

No independent model/API keys are required by this skill. For optional image generation, use an available image tool or skill and its authorized credentials. Never substitute generated UI for evidence of working software.
