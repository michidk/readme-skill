# Usage guide

Run the examples from the README Skill checkout unless a command uses the installed launcher. See the [README](../README.md) for the quickstart.

## Installation options

Requires Bun 1.3 or newer. The agent supplies the LLM; the toolkit does not need a separate model API key.

```sh
bun install --frozen-lockfile
bun run install-skill
```

The installer copies the skill and its runtime into `~/.codex/skills/readme-skill`, or `$CODEX_HOME/skills/readme-skill` when configured. It installs runtime dependencies in that directory. Refresh your agent's skill discovery afterward.

On an ordinary machine, install for Claude Code with:

```sh
bun run install-skill --destination ~/.claude/skills/readme-skill
```

In VibePod, use the canonical Codex skill directory and let managed links handle discovery. The installer never replaces a managed symlink. To update an existing installation, inspect any local changes first, then explicitly replace it:

```sh
bun run install-skill --force
```

The default installed launcher works from any directory:

```sh
bun ~/.codex/skills/readme-skill/scripts/readme-skill.ts inspect --root . --json
```

Use the actual installation path when `CODEX_HOME` or a custom destination changes it.

## Presentation styles

When creating or refining a README without an established preference, the skill asks: "Do you want the README very serious, neutral, or fancy?"

- **Very serious:** direct layout, useful shields, and functional images; no decorative separators.
- **Neutral:** a polished header, restrained color, and useful imagery.
- **Fancy:** coordinated accents and small SVG separators at major section boundaries.

You can specify the style in your request:

> Use $readme-skill to refine this README in fancy mode, with subtle SVG separators.

An existing `readme-skill.json` or shared policy can store `"presentation": "fancy"`. Valid values are `serious`, `neutral`, and `fancy`. The skill honors the current request before saved preferences. Missing presentation is left unset so the agent can ask; unattended work defaults to neutral. Audit and metadata-only requests do not prompt for a style.

Fancy mode includes editable [wave](../skills/readme-skill/assets/separators/wave.svg) and [diamond](../skills/readme-skill/assets/separators/diamond.svg) SVG templates. The agent can adapt these or create a small original separator without an image-generation service or HyperWeave.

## Inspection and checks

```sh
bun run cli inspect --root /path/to/project --json
bun run cli review --root /path/to/project --json
bun run cli check --root /path/to/project --json
bun run cli check --root /path/to/project --network --json
```

Inspection reports documentation, assets, manifests, repository identity, and source paths. Package commands are marked as discovered, not executed. Generic non-JavaScript manifests are located but not interpreted. Inspection and checks do not edit the target repository.

`review` emits a JSON editorial brief with line-numbered headings, code blocks, images, links, and unanswered questions. Use `--readme <relative-path>` to select another document. Both Markdown and HTML examples are included. `imageLayout` records explicit HTML width/height hints separately from intrinsic image dimensions; missing hints are null. Header composition, screenshot/video treatment, and shared standards have dedicated review questions. These require actual inspection, not just counts. The agent must supply judgments and source evidence; a successful command means the brief was produced, not that the README passed a quality review. It does not execute examples or edit files.

Checks distinguish confirmed errors, warnings, and unverified items. External links are checked only with `--network`; authentication, rate limits, and server failures remain unverified. Commands and visual quality need separate agent verification even when mechanical checks pass.

| Exit code | Meaning |
| --- | --- |
| `0` | Command completed with no confirmed check errors |
| `1` | Confirmed check errors, such as a broken local link or missing license |
| `2` | Invalid input or an operational failure |

A zero exit code does not mean that every claim, command, or visual was verified.

## Screenshots and video thumbnails

```sh
bun run cli media screenshot.png --json
bun run cli media screenshot.png --output docs/assets/screenshot.webp --width 800
bun run cli media thumbnail.jpg --output docs/assets/demo.webp --play
bun run cli media demo.mp4 --frame 3 --output docs/assets/demo.webp --play
```

Use a real YouTube video URL in place of the local image to retrieve its thumbnail. Local video extraction requires ffmpeg. PNG, JPEG, and WebP outputs are supported. Images retain their aspect ratio and are not upscaled.

Inspect a thumbnail before cropping it. `--crop left,top,width,height` uses oriented source pixels. Dark-row detection only reports possible padding, because dark application UI can look like letterboxing. For example, after confirming the correct crop for a 1280 × 900 source:

```sh
bun run cli media thumbnail.jpg --output docs/assets/demo.webp --crop 0,90,1280,720 --play
```

Link the finished image to the video and include a textual video link. The play indicator is part of the image, so it does not depend on CSS overlays in GitHub Markdown.

Every generated asset has a `.source.json` record. Keep it with the image and retain the original input or its retrievable source. Identical inputs reuse existing output. Modified or unmanaged outputs are protected unless `--force` is supplied; source images are never overwritten.

## Structured graphics

Install Python 3.10 or newer and provision the optional renderer in an isolated environment outside your target repositories:

```sh
python3 -m venv ~/.cache/readme-skill/hyperweave
~/.cache/readme-skill/hyperweave/bin/pip install 'hyperweave==0.4.7'
bun run cli render examples/workflow.json --output docs/assets/workflow.svg
```

The adapter finds that isolated installation automatically. `HYPERWEAVE_BIN` or `--executable` can select another installation of the pinned version.

Supported graphics are static badges and small pipeline diagrams using HyperWeave's Primer porcelain theme. Diagrams default to a vertical layout for narrow displays. Graphics use an opaque light theme on either host background. Dark variants are excluded after visual evaluation found renderer inconsistencies. SVG, PNG, and WebP outputs are supported; Sharp handles raster export.

See the [input examples](../examples/), [rendered workflow](assets/workflow.svg), [status badge](assets/status.svg), and [graphic schema](../schemas/graphic.schema.json). Keep editable specifications and generated provenance records. Inspect labels at their intended display size; a valid specification does not prove readability.

## Review and configuration

```sh
bun run cli preview --root /path/to/project --output /tmp/readme-review.html
```

The standalone HTML contains narrow/wide and light/dark review layouts. Local images are embedded; remote images are omitted. It is a sanitized approximation, not proof of GitHub rendering. Alerts, Mermaid, and GitHub-specific behavior need separate inspection. Existing preview files require explicit `--force` to replace.

An optional `readme-skill.json` stores project facts and exceptions. `--policy shared.json` applies shared defaults first, followed by project overrides. See the [configuration example](../examples/readme-skill.json) and [policy schema](../schemas/policy.schema.json). Unknown configuration keys are rejected.

Prepare metadata proposals with:

```sh
bun run cli metadata --root /path/to/project --json
bun run cli metadata --root /path/to/project --catalog examples/catalog.json --json
bun run cli metadata --root /path/to/project --github --json
```

The [catalog](../examples/catalog.json) records explicit relationships between repositories. `--github` reads current metadata using `gh` and the target repository's origin; it needs access through the configured GitHub identity. Missing proposed fields remain unknown instead of being invented.

Metadata commands never change settings or publish commits. The skill uses existing authorized GitHub tools for publication. Social-preview preparation and upload are separate steps. The CLI does not create GitHub repositories, releases, or PRs.

You can also ask the agent to update metadata without editing the README:

> Use $readme-skill to update this repository's GitHub description and topics from its existing content.

The skill reads current settings, preserves unrelated topics, applies the requested updates, and reads them back to verify the result.

## Further reading

- [Skill entrypoint](../skills/readme-skill/SKILL.md)
- [Editorial standard](../skills/readme-skill/references/editorial.md)
- [Media workflow](../skills/readme-skill/references/media.md)
- [Metadata and publication](../skills/readme-skill/references/delivery.md)
