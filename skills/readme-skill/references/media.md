# Media production

The examples below use `readme-skill` as shorthand for `bun <skill>/scripts/readme-skill.ts`.

## Screenshots and video

Inspect before transforming:

```sh
readme-skill media screenshot.png --json
readme-skill media screenshot.png --output docs/assets/screenshot.webp --width 800
readme-skill media thumbnail.jpg --output docs/assets/demo.webp --crop 0,90,1280,720 --play
readme-skill media 'https://www.youtube.com/watch?v=VIDEO_ID_HERE' --output docs/assets/demo.webp --play
readme-skill media demo.mp4 --frame 3 --output docs/assets/demo.webp --play
```

Crop numbers are left, top, width, height in oriented source pixels. The example numbers are illustrative, not a crop to apply blindly. Dark-row detection reports candidates only: dark app UI can resemble black padding. Inspect and select an explicit crop. No automatic border removal or upscaling occurs. Local video frames require ffmpeg; YouTube uses thumbnail variants and does not download video.

Images can be PNG, JPEG, or WebP outputs. Default maximum width is 800 pixels, with original aspect ratio preserved. Use portrait dimensions for mobile captures. Target approximately 300 KB for a hero and 500 KB for a screenshot, but preserve text legibility. Use a linked image plus a textual video link; the play symbol is part of the exported image, not CSS.

Each output has a `.source.json` record with source identity, hashes, transformations, and tool version. Keep both in version control. Unchanged inputs reuse the output. Modified or unmanaged outputs require explicit `--force`; do not use force to bypass an unexplained user edit.

## Structured graphics

The adapter uses HyperWeave 0.4.7 through `HYPERWEAVE_BIN` or `--executable`. It supports static badges and diagrams with two to seven nodes. See the toolkit's examples and `schemas/graphic.schema.json`.

```sh
readme-skill render workflow.json --output docs/assets/workflow.svg
```

Use a diagram only when it makes a real relationship clearer. Keep ordinary tables and text in Markdown. Keep useful existing Mermaid. The supported theme is deliberately restrained and the image draws its own background. Use the fixed light plate on either host background. Dark-face specifications are rejected because the evaluated renderer produced inconsistent results. PNG and WebP exports use Sharp to preserve labels, avoiding a font issue observed in HyperWeave's native raster export.

Validate the exported result visually. Neither schema validation nor image decoding proves labels fit at mobile widths. Simplify the graphic or move details to Markdown when labels become too small. If HyperWeave is unavailable, preserve a useful existing diagram or use Markdown/Mermaid and report the omitted rendering.

## Hero imagery and social preview

Read [header.md](header.md) for composition and the full visual checklist. First consider the existing logo, actual screenshot, output, or a project-specific illustration. Optional AI imagery should communicate the repository's actual purpose. Use the current environment's image-generation tools, honor standing authorization, and record the nonsecret prompt and original asset separately. Compose exact typography and existing logos after generation. Do not generate fake product UI.

The CLI handles general raster resizing, explicit cropping, and play overlays. Exact hero typography, AI generation, and 1280×640 social-card composition use the agent's available graphics tools; there is no dedicated hero compositor. Prepare a PNG/JPEG social preview under 1 MB and inspect its crop separately from the README hero. Upload is a distinct authorized action.

Capture and inspect assets using the environment's supported tools. If no supported capture is available, use an existing verified screenshot or report the gap. Keep sensitive data out of captures.

If requested image generation fails, record the provider error without credentials. Continue with the rest of the README. An original vector illustration can be appropriate when the user allows that medium; disclose the substitution and keep the unfulfilled generation request explicit. Never present a placeholder or a copied reference image as the completed AI artwork.
