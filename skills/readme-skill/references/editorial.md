# Editorial standard

Use readme-md-generator's compact structure as inspiration: an identifiable title, a short description, a few useful links and badges, direct installation and usage, contribution information, and license. Adapt the structure rather than filling every possible section.

Start with what the project does and who it is for. Do not invent warnings or infer that a project is unsafe or not ready from its age, unpublished status, missing release, or experimental metadata. Ask the user before adding a known issue or critical warning unless already explicitly requested. Ground warning claims in evidence; a request for a warning does not authorize invented risks. Omit unfinished work and missing-license or missing-release notices. Preserve actual license notices when present. Include only installation requirements needed for the basic workflow; place optional dependencies beside their feature instructions. Keep the first useful action early. Show expected output or a real outcome. Link releases/downloads where they exist; omit an unfinished release section. Never infer stability from stars, a repository's age, or the existence of CI configuration.

Applications prioritize access and product screenshots. Libraries and CLIs prioritize working examples. Infrastructure projects distinguish developer setup from operator actions. Resource repositories can explain copying or consuming an artifact instead of inventing an installation command.

Link CONTRIBUTING, SECURITY, LICENSE, changelogs, and detailed docs when they exist and help the reader. Create these companion files only when explicitly requested, never to satisfy a template or a best-practice checklist. Use relative links within a repository and canonical links across repositories. Explain each related repository's relationship. Keep long API references, setup detail, and architecture narratives in supporting files.

Use the selected presentation style. Fancy mode may add coordinated SVG separators, but does not relax factual or content requirements.

Use restrained presentation:

- Include useful shields in one compact row, usually one to three. Every included badge must have a verified value and working links. Select relevant runtime, CI, release, or license badges; omit unknown ones and avoid decorative filler.
- A small decorator can help scanning; repeating emojis on every heading usually does not.
- One main image when useful. A hero is optional by default; when the user requests one or selects an illustrated reference, create or improve it. Follow [header.md](header.md).
- No automatic star requests, popularity charts, animation, technology-logo collections, or marketing slogans.
- Keep important information in selectable Markdown and provide meaningful image alternatives.

Read actual code before claiming a feature, platform, command, or configuration default. Record unknowns and omit unsupported claims. For command verification, inspect the command and run only an appropriate bounded example in an isolated environment. Never execute migrations or deployments just to validate README prose.

Configuration is optional. `readme-skill.json` supports presentation (`serious`, `neutral`, or `fancy`), profile, maturity, description, homepage, topics, related repositories, requiredSections, maxBadges, and image budgets. Use `schemas/policy.schema.json` in the toolkit for exact fields. Explicit shared policy is merged before project overrides. CLI configuration does not override user or environment instructions.

## Judge before and after editing

Run `review --root <repo> --json` for an existing README. The brief locates headings, code blocks, images, and links, including raw HTML. It does not distinguish setup from usage or verify anything. Answer its questions using source locations and observed results; use supported, needs-work, unverified, or not-applicable judgments. Do not turn a count, lint pass, or unchanged second pass into a quality score.

Require each sentence to help a reader understand, install, or use the project. Remove internal audit notes and generic advice. Read as a newcomer. Can you explain what this project does, why you would use it, what adoption requires, and the first useful action? Adapt the answers to the audience. A resource collection may demonstrate copying a template instead of running a program.

For a CLI or library, prefer one complete, bounded example using an included fixture or available input. State the working directory, prerequisites, command, and observable result. Installation alone is not usage. Inspect and execute the example when appropriate, preserving exact output or identifying excerpts. If execution is unavailable, label it unverified. Never manufacture successful output.

Judge visuals by information gained. A relevant screenshot can prove a result; an optional illustration can explain a concept but cannot prove software behavior. Do not impose a hero on every project, repeat a warning as a badge, or replace readable instructions with an image. A requested conceptual illustration can establish identity without pretending to be product evidence. Merge link-only subsections when they interrupt the first useful action.

After editing, repeat the cold-reader review and record what improved with evidence. Omit unfinished licensing and distribution sections rather than narrating missing decisions. Ask the user about known issues in the conversation, not in the README. Explain useful content removed or moved. Preserve existing anchors where practical.

Sources: [GitHub README guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes), [Make a README](https://www.makeareadme.com/), [readmeX review scorecard](https://github.com/aibox22/readmeX/blob/main/skills/readmex/references/review-scorecard.md), and [crafting-effective-readmes](https://github.com/softaworks/agent-toolkit/tree/main/skills/crafting-effective-readmes). Adapt their audience and first-success guidance; do not import mandatory interviews, rigid layouts, or numerical quality scores.
