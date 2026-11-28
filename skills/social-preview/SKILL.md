---
name: social-preview
license: MIT
description: Design, generate, and set a GitHub repository's social preview image (the Open Graph card shown when the repository link is shared), or report which repositories still lack one.
---

# Social preview

GitHub shows a generated card when a repository link is shared on chat apps and social sites. A custom social preview replaces it with project artwork. Produce one deliberate 1280×640 image per repository, set it, and verify it.

## Check the current state

Query GitHub instead of guessing:

```sh
gh api graphql -f query='{repository(owner:"OWNER",name:"REPO"){usesCustomOpenGraphImage openGraphImageUrl}}'
```

`usesCustomOpenGraphImage: false` means the generated default card is in use. For an audit across repositories, report each repository with this value and skip archived ones unless asked. An audit changes nothing.

## Design the image

- Size 1280×640 PNG or JPEG, under 1 MB. GitHub accepts 640×320 at minimum. Use an opaque background: transparent PNGs render on unpredictable colors.
- Reuse the project's identity: its logo, established palette and fonts, and real imagery. Never show fake product UI.
- Pick one image, in this order: a README hero that is mostly picture; a real screenshot or product photo; real output the project produces (renders, plots, generated files); a terminal card with one real command from the README and its real output; the logo alone.
- Do not reuse a README hero as the whole card when it carries its own headline, feature list, diagram labels or footer text. Banners like that are unreadable at thumbnail size. Take its motif or palette instead, or use the next option.
- Choose the most recognizable subject the project has, such as a signature creature, device or screen, not an incidental default asset such as a T-posed test model, placeholder character or empty viewer. When the obvious image shows an undressed or placeholder figure, look for a better one in related repositories, banners or release assets.
- Show the project name large (at least 72 px cap height) and at most one short tagline. The card is read at thumbnail size, often around 400 px wide: no badges, URLs, version numbers, feature lists, or small print.
- Keep text and logos inside a 64 px safe margin; some sites crop the edges or round the corners. Check that the name stays legible when the image is scaled to 400×200.
- Compose exact typography yourself: write an SVG at 1280×640 with the artwork embedded or referenced, then rasterize it with Sharp (`sharp(svg).png().toFile(...)`) or the README toolkit's media tooling. Quote font families with spaces (`font-family="'Press Start 2P'"`) and confirm the font actually rendered instead of falling back. Use generated imagery only under the same rules as README hero art.
- Inspect the result at full size and at thumbnail size before setting it.

Store the final image beside the README assets, for example `.github/images/social-preview.png`, with a `.source.json` or generator script when it was composed, so the card can be regenerated when the branding changes. Commit it through the user's normal branch and signing workflow. Committing is optional when the user only wants the setting changed.

## Set the image

GitHub offers no REST or GraphQL endpoint for uploading a social preview, and the GitHub App cannot set it. The upload happens in the repository's web settings: **Settings → General → Social preview → Edit → Upload an image**, at `https://github.com/OWNER/REPO/settings`. Use one of these, in order:

1. When a browser automation tool attached to the user's logged-in browser is available and the user authorized the change, open the settings page, upload the file through the file input, and confirm the preview updated.
2. Otherwise give the user the absolute path to the image and the settings link, one line per repository.

Do not try other credentials, cookies, or scraping to get around the missing API.

## Verify

Re-run the GraphQL query. Report done only when `usesCustomOpenGraphImage` is `true`; `openGraphImageUrl` then points at `repository-images.githubusercontent.com`. Chat apps cache link previews, so an old card can remain visible there for a while; that does not mean the upload failed.
