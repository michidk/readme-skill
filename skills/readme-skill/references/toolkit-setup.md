# Toolkit setup for directory installations

The skill uses Bun 1.3 or newer. When installed through `skills add` or copied as a standalone folder, its toolkit must be installed once. The project's `bun run install-skill` installer already does this.

Resolve `<skill>` to the absolute directory containing this SKILL.md. If `<skill>/runtime/src/cli.ts` exists, use it and install missing dependencies there with `bun install --cwd <skill>/runtime --frozen-lockfile --production`. Do not clone over an existing directory.

When the runtime is absent, fetch the public toolkit into that directory:

```sh
git clone --depth 1 https://github.com/michidk/readme-skill.git <skill>/runtime
bun install --cwd <skill>/runtime --frozen-lockfile --production
bun <skill>/scripts/readme-skill.ts --help
```

Substitute and quote the actual skill path; `<skill>` is not literal shell syntax. Inspect the downloaded manifest before installing dependencies. This installs the toolkit beside the skill, without touching dependencies in the repository being documented. The checkout includes its own usage guide and schemas. Keep the repository's current default branch; do not assume it is named main.

If GitHub access or dependency installation fails, report the actual error. Continue evidence-based writing only when it is useful, and do not claim CLI checks ran. Do not use another identity to bypass an access boundary.
