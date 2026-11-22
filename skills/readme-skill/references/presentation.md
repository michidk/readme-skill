# Presentation styles

Ask for a preference as described in SKILL.md. These choices change visual treatment, not technical claims or which companion files may be created. Do not treat "fancy" as permission for marketing copy, more badges, warnings, or a longer README.

| Choice | Treatment |
| --- | --- |
| Very serious (`serious`) | Direct typography and layout. Keep useful shields, logos, screenshots, and diagrams. Use whitespace or plain Markdown rules when separation helps; omit decorative SVG separators and ornamental heading icons. |
| Neutral (`neutral`) | A polished header, useful shields, one cohesive hero when requested, and restrained color. Use ordinary spacing between sections. Preserve good existing branding. |
| Fancy (`fancy`) | Keep the neutral content, center the whole opening as one composed header, then add one decorative motif taken from the project's own artwork and repeat it at a few major transitions. |

## Optional columns with tables

GitHub Markdown tables can place related content side by side: two video thumbnails, a small screenshot gallery, or a short comparison. This option works in any presentation style; use it when the columns make the content easier to scan, not just to fill horizontal space.

Prefer two columns for media and give each a meaningful heading. For example, replace these illustrative paths with verified project assets and destinations:

```markdown
| Game demo | Editor demo |
| --- | --- |
| [![Play the game demo](docs/images/game-demo.webp)](https://www.youtube.com/watch?v=GAME_VIDEO_ID) | [![Play the editor demo](docs/images/editor-demo.webp)](https://www.youtube.com/watch?v=EDITOR_VIDEO_ID) |
```

Center compact media galleries as a group, including their captions and images, when they are narrower than the README. Markdown `:---:` centers cell contents but does not center the table itself. For group alignment, use a GitHub-compatible HTML table with `align="center"` and explicit centered cells:

```html
<table align="center">
  <tr>
    <th align="center">Game demo</th>
    <th align="center">Editor demo</th>
  </tr>
  <tr>
    <td align="center"><a href="GAME_VIDEO_URL"><img src="docs/images/game-demo.webp" width="320" alt="Play the game demo"></a></td>
    <td align="center"><a href="EDITOR_VIDEO_URL"><img src="docs/images/editor-demo.webp" width="320" alt="Play the editor demo"></a></td>
  </tr>
</table>
```

Replace example URLs and paths with verified destinations. Use HTML links and images inside HTML cells; do not assume Markdown will be parsed there. Keep prose and reference tables left-aligned unless their content benefits from another alignment. Centering is a media-layout option, not a rule for all tables or section headings.

Prepare video thumbnails with the play indicators and cropping described in [media.md](media.md). Keep images similarly sized and preserve their aspect ratios. Keep cell text short; leave setup steps, code blocks and long explanations outside the table. Use tables for related items with useful labels rather than an entire page layout or unrelated prose columns.

GitHub tables do not automatically stack into a single column on mobile and may scroll horizontally. Check narrow-width readability when rendering verification is available. If thumbnails or labels become too small, use vertically stacked content instead. Do not rely on custom CSS or responsive layout attributes that GitHub may strip.

## SVG separators

A separator has to look intentional next to the project's artwork. A generic thin line with one bump, a floating accent, or a stock template in a guessed color reads as a rendering glitch, not as decoration.

### Derive the motif

Start from the strongest existing visual: logo, mod or app icons, hero, screenshots. Take its palette and its texture, not only one color.

- Pixel art or game assets: a pixel strip in the same style, for example the grass-and-dirt ground of block-game icons, drawn with `shape-rendering="crispEdges"` and whole-pixel cells.
- Flat or vector branding: a full-width line or band in the brand colors, solid or as a left-to-right gradient.
- Photographic or minimal branding: prefer serious or neutral spacing over inventing a motif.

The bundled [wave](../assets/separators/wave.svg) and [diamond](../assets/separators/diamond.svg) files are geometry starting points only. Never publish them with only the color changed.

### Give it presence

- Span the content width (about 800 pixels) edge to edge. Fade or roughen the ends instead of leaving a short centered mark.
- Make it 8 to 24 pixels tall with filled shapes or a stroke of at least 3 pixels. Hairlines disappear on GitHub's dark theme.
- Keep every element attached to the motif. Do not add detached dots, bars, or glyphs.
- Use one motif for the whole README.

### Place it with rhythm

Put the first separator after the complete header block, with a `<br>` or a paragraph between it and the navigation row, never pressed against links or badges. After that, either put one before every top-level section group, or put it at two or three major transitions such as before usage, before the reference material, and before the license. Do not add one after every heading, duplicate a Markdown rule, or replace headings and navigation. Preserve headings even if every image fails to load.

### Prior art

- [andreasbm/readme](https://github.com/andreasbm/readme): 900×9 full-width gradient lines, one style per README, placed before every top-level section and linked to that section's anchor.
- [capsule-render](https://github.com/kyechan99/capsule-render): wave and slice banners in project colors framing the header and footer. Commit an equivalent static SVG rather than hotlinking the service.
- [readme-ai](https://github.com/eli64s/readme-ai) header templates: a centered block of logo, title, tagline, badges, and navigation, closed by a rule.

### Build and verify

For fancy mode, copy a template into the target repository's documentation assets or write a small original SVG. Use actual project paths in the README; never link to an installed skill directory. Do not overwrite user-owned artwork. Record the source and any modifications in the delivery note. Editable vector assets do not need provenance sidecars.

Use self-contained SVG with explicit dimensions and viewBox, literal colors, and simple shapes. Avoid scripts, foreignObject, external fonts or images, animation, and CSS that assumes it inherits the GitHub page theme. Keep it under about 10 KB; use a `<pattern>` tile for repeating textures instead of thousands of rectangles. Choose colors visible on both light and dark backgrounds.

Judge it in context, not as an isolated asset. Render the README with `preview`, look at the header and at least one mid-document transition at wide and narrow widths and in light and dark themes, and compare it with the project's icon or hero. If it would not look deliberate to a designer, redesign it or fall back to neutral spacing.

Embed decorative artwork with empty alt text and a bounded width, for example:

```html
<p align="center">
  <img src="docs/assets/separator.svg" width="800" alt="">
</p>
```

Inspect the SVG at wide and narrow widths and on light/dark backgrounds. Run the normal local link and image checks. Visual inspection of the exported asset does not establish GitHub rendering. When switching to serious or neutral, remove decorative references introduced for fancy mode; delete only owned assets that are no longer referenced anywhere. Avoid altering functional diagrams or screenshots.
