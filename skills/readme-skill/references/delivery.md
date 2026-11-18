# Metadata and publication

`metadata --root <repo> --json` prepares a proposal from explicit policy fields. It leaves unknown fields null. `--github` reads current metadata using managed `gh` authentication and the exact repository origin. `--catalog <file>` adds explicit relationships from a shared catalog. See the runtime's schemas and examples.

The metadata command never writes to GitHub. When the user has authorized metadata changes, use the existing managed GitHub CLI/API to apply the concrete proposal and read it back. Preserve unrelated topics unless replacement was requested. Generate the social-preview asset separately; do not assume a supported automated upload exists.

Publish only when requested. Follow local and user conventions for branches, managed identity, API-signed commits, co-author trailers, and signature/message verification. Do not create a PR when the user's workflow calls for a compare link. The skill adds no standing authorization for external writes.

Deliver the changed files, local checks, command verification results, visual-review status, and unresolved facts. Separate confirmed broken links from network/authentication/rate-limit failures. Report local preview and GitHub rendering as distinct checks. Never turn an unchecked command or visual into a passing assertion.
