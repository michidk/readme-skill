# Header and visual direction

Use the user's original requirements and reference READMEs as design inputs. "Simple" means a clear hierarchy with deliberate visual choices, not automatically removing images or making every project text-only. For this collection, [CodeTend](https://github.com/michidk/codetend) is a preferred reference for the header's composition, not a source of artwork to copy.

## Compose the opening

A useful branded layout is a centered small logo and project name, one concise description, a short row of navigation links, a compact row of useful verified shields, and one project-specific hero. Keep the body left-aligned. A plain heading remains appropriate when branding is unwanted or no useful visual can be made. Honor an explicit visual request rather than treating optional imagery as permission to skip it.

- Use an existing logo when available, around 48–64 displayed pixels. Do not invent a second mark just to fill a slot. Avoid repeating a logo inside both the title and hero.
- Keep the description selectable text. Say what the project does and for whom. Add a supporting sentence only if it adds information.
- Link to the first useful action, usage/demo, and detailed docs. Verify fragment identifiers instead of copying emoji-dependent anchors from another README.
- Place shields between the navigation and hero by default, so the useful facts appear before the illustration. Usually one to three are enough. Every included badge must have a verified value, working image URL, descriptive alt text, and relevant linked destination. Omit badges for unknown licenses, unconfigured CI, or unfinished releases. Never add placeholders or pad the row with technology labels.
- Use one high-quality central image that reflects the repository. A conceptual AI illustration can provide identity; a real screenshot provides evidence of the product. Describe each honestly.
- Start with a hero displayed at roughly 720–800 pixels wide and an aspect ratio near 2:1 or 3:1. These are composition defaults, not universal limits. Keep it responsive and avoid a large vertical gap before installation. Preserve screenshot aspect ratios and text readability instead of cropping them to a hero shape.
- Ask the user before documenting a known issue or adding a warning unless they already explicitly requested it. Omit unfinished status, missing-license notices, and absent-release commentary. Do not invent risks or write an internal checklist into the public README.
- Small decorators are allowed when they aid scanning or match the project's style. Avoid a mandatory emoji on every heading, technology-logo walls, decorative animations, and repeated messages.

For HTML layout, use GitHub-compatible `h1`, `p align="center"`, `a`, and `img` with explicit width and alt text. Avoid custom CSS, script, or layout that depends on the local preview. Preserve useful anchors when changing a Markdown heading to HTML. Use empty alt text only for a decorative logo whose adjacent text already names the project.

## Review the whole visual set

Inspect the finished hero at its display size and at mobile width. Check subject relevance, whitespace, crop, contrast on light/dark surroundings, byte size, and any generated artifacts. Check the logo separately. Record the prompt, original generation, transformation, and final file. Never claim browser or GitHub verification from image inspection alone.

For screenshots, inspect actual UI and redact sensitive data. For video links, prepare a real thumbnail with a visible play indicator, remove confirmed black borders with an explicit crop, and provide a textual link. Dark application content is not automatically a border. If there is no real video, omit the video section rather than inventing one.

Before finishing, account for the full request: header, hero/logo, screenshots, video, badges/callouts, usage/releases, contributing/license, related docs/repos, shared standards, and description/homepage/topics. Mark each implemented, not applicable with a reason, or blocked/unverified. This is an internal coverage review, not a mandate to create sections or files. Omit unfinished items from the README; preserve established licensing and attribution.
