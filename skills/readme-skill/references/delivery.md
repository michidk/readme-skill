# Metadata and publication

## Repository description and topics

Use this workflow on its own when the user asks for a GitHub description, tags, topics, or the repository's About section. GitHub calls repository tags "topics". Do not rewrite the README as a side effect.

1. Resolve the exact owner/repository from the user's URL or the Git origin. Read the README and relevant project facts, then fetch current settings with `gh api repos/OWNER/REPO`. Use the managed identity scoped to that repository.
2. Write one concise description explaining what the project does. Prefer the main use case over a dependency list. Avoid slogans, unsupported claims, unfinished-work notices, and copied introductory filler. GitHub permits up to 350 characters; do not fill the limit unnecessarily.
3. Choose a small set of specific discovery topics supported by the repository, covering its purpose, format/ecosystem, and relevant technology. Use lowercase letters, digits, and hyphens; each topic must start with a letter or digit and be at most 50 characters, with at most 20 topics total. These are limits, not targets. Preserve existing unrelated topics unless the user asks to replace or clean them up. Never invent compatibility or popularity claims.
4. Set a homepage only when a real, relevant URL is established. Do not fabricate a deployment or repeat the repository URL as filler. Leave unspecified settings unchanged.
5. When explicitly asked to add or update metadata, apply it without another confirmation. A README-only request authorizes a proposal, not a settings change. PATCH `repos/OWNER/REPO` with only requested description/homepage fields. PUT `repos/OWNER/REPO/topics` with the final merged `names` array. Use structured JSON payloads so punctuation cannot be interpreted by the shell. Re-read current topics before replacement if other work intervened.
6. Read the settings back and compare with the intended values. Report the repository link, description, and topics. If one write fails, identify which part succeeded and report the actual permission error; do not switch identities or claim completion. Skip writes when the desired values already match.

When an existing `readme-skill.json` maintains project metadata, keep its description/topics synchronized with the approved values. Do not create a configuration file solely for a one-off metadata change.

## Toolkit and publication

`metadata --root <repo> --json` prepares a proposal from explicit policy fields. It leaves unknown fields null. `--github` reads current metadata using managed `gh` authentication and the exact repository origin. `--catalog <file>` adds explicit relationships from a shared catalog. See the runtime's schemas and examples.

The metadata command never writes to GitHub. When the user has authorized metadata changes, use the existing managed GitHub CLI/API to apply the concrete proposal and read it back. Preserve unrelated topics unless replacement was requested. Generate the social-preview asset separately; do not assume a supported automated upload exists.

Publish only when requested. Follow local and user conventions for branches, managed identity, API-signed commits, co-author trailers, and signature/message verification. Do not create a PR when the user's workflow calls for a compare link. The skill adds no standing authorization for external writes.

Deliver the changed files, local checks, command verification results, visual-review status, and unresolved facts. Separate confirmed broken links from network/authentication/rate-limit failures. Report local preview and GitHub rendering as distinct checks. Never turn an unchecked command or visual into a passing assertion.
