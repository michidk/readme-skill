# Presentation styles

Ask for a preference as described in SKILL.md. These choices change visual treatment, not technical claims or which companion files may be created. Do not treat "fancy" as permission for marketing copy, more badges, warnings, or a longer README.

| Choice | Treatment |
| --- | --- |
| Very serious (`serious`) | Direct typography and layout. Keep useful shields, logos, screenshots, and diagrams. Use whitespace or plain Markdown rules when separation helps; omit decorative SVG separators and ornamental heading icons. |
| Neutral (`neutral`) | A polished header, useful shields, one cohesive hero when requested, and restrained color. Use ordinary spacing between sections. Preserve good existing branding. |
| Fancy (`fancy`) | Keep the neutral structure, then add coordinated accents and small static SVG separators at a few major transitions. Prefer one repeated motif over a different design for every section. |

## Optional columns with tables

GitHub Markdown tables can place related content side by side: two video thumbnails, a small screenshot gallery, or a short comparison. This option works in any presentation style; use it when the columns make the content easier to scan, not just to fill horizontal space.

Prefer two columns for media and give each a meaningful heading. For example, replace these illustrative paths with verified project assets and destinations:

```markdown
| Game demo | Editor demo |
| --- | --- |
| [![Play the game demo](docs/images/game-demo.webp)](https://www.youtube.com/watch?v=GAME_VIDEO_ID) | [![Play the editor demo](docs/images/editor-demo.webp)](https://www.youtube.com/watch?v=EDITOR_VIDEO_ID) |
```

Prepare video thumbnails with the play indicators and cropping described in [media.md](media.md). Keep images similarly sized and preserve their aspect ratios. Keep cell text short; leave setup steps, code blocks and long explanations outside the table. Use tables for related items with useful labels rather than an entire page layout or unrelated prose columns.

GitHub tables do not automatically stack into a single column on mobile and may scroll horizontally. Check narrow-width readability when rendering verification is available. If thumbnails or labels become too small, use vertically stacked content instead. Do not rely on custom CSS or responsive layout attributes that GitHub may strip.

## SVG separators

The skill bundles two editable starting points:

- [Wave](../assets/separators/wave.svg): a shallow line with one central wave.
- [Diamond](../assets/separators/diamond.svg): thin rules around a small geometric mark.

For fancy mode, copy a suitable template into the target repository's documentation assets or write a similarly small original SVG. Adapt its color and geometry to the existing branding. Use actual project paths in the README; never link to an installed skill directory. Keep the editable SVG and reuse it where possible. Do not overwrite user-owned artwork. Record the source template and any modifications in the delivery note; these editable vector assets are not CLI-managed raster outputs and do not require fabricated provenance sidecars.

Use self-contained SVG with explicit dimensions and viewBox, literal colors, and simple paths. Avoid scripts, foreignObject, external fonts/images, animation, or CSS that assumes it inherits the GitHub page theme. Keep a separator around 16–40 pixels tall at its intended desktop width, usually under 5 KB. Use a color visible against both light and dark backgrounds; test both rather than assuming transparent means theme-aware.

Place separators between major groups, such as the header and getting started or usage and contribution details. Usually one or two suffice. Do not add one after every heading, duplicate a Markdown rule, or replace actual headings and navigation. Preserve headings even if every image fails to load.

Embed decorative artwork with empty alt text and a bounded width, for example:

```html
<p align="center">
  <img src="docs/assets/separator.svg" width="800" alt="">
</p>
```

Inspect the SVG at wide and narrow widths and on light/dark backgrounds. Run the normal local link and image checks. Visual inspection of the exported asset does not establish GitHub rendering. When switching to serious or neutral, remove decorative references introduced for fancy mode; delete only owned assets that are no longer referenced anywhere. Avoid altering functional diagrams or screenshots.
