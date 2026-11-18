# Contributing

Use Bun 1.3+ and the committed bun.lock. Install dependencies with `bun install --frozen-lockfile` and run `bun run verify` before proposing changes.

Source modules are grouped by responsibility: repository evidence, policy, Markdown extraction and checks, managed assets, media, renderer, preview, and CLI. Add behavior tests through the CLI or a real local fixture. Do not replace tested behavior with mocks merely to avoid using the libraries.

Run `bun scripts/schemas.ts` when policy or graphic schemas change. Format TypeScript with `bunx prettier --write 'src/**/*.ts' 'scripts/**/*.ts' 'tests/**/*.ts'`.

HyperWeave integration tests run when `HYPERWEAVE_BIN` points to version 0.4.7. Other tests do not require network, ffmpeg, or HyperWeave. Visual inspection remains separate from image decoding and schema checks.

Keep skill references concise and synchronized with the CLI. Verify the installed launcher from a different directory. Do not hardcode a developer's workspace path into a shipped skill.

Use feature branches and Conventional Commits. Follow the repository owner's signing, attribution, and publication rules. Do not add a license without an explicit choice by the owner.
