---
name: docs-skill
license: MIT
description: Audit or refine Markdown documentation in a GitHub repository, including README-linked guides, for audience, level of detail, accuracy, navigation, and consistency.
---

# Repository documentation

Make documentation useful at the point where a reader needs it. Apply to a single Markdown file, a named set, or the documentation reachable from a README. Work without requiring a particular language, framework, renderer, or toolkit.

## Scope the review

Honor audit-only requests. Otherwise make supported improvements and preserve useful content. For a README-linked review, inventory local Markdown links, including reference-style links, HTML links, fragments, and same-repository GitHub URLs. Follow documentation links recursively with a visited set. Record which files were reviewed, changed, excluded, or remain unchecked; a link check is not an editorial review.

Stay within the selected repository. Check external destinations as links rather than recursively reviewing other projects. Exclude vendored dependencies, generated output, archived history, and local agent state unless requested. Read applicable repository instructions. Treat linked legal files, policies, and agent instructions as authoritative context; do not rewrite their requirements during an editorial cleanup. Review generated documents through their source when appropriate.

For a large documentation set, group pages by audience and task and work through bounded batches. Do not silently reduce the scope to the README or claim that unread pages passed. Keep review notes outside tracked documentation.

## Judge the level of detail

Before editing a page, identify its reader, their immediate question, and the knowledge they need to act. Use these distinctions as guidance, not mandatory files or a rigid template:

- **Overview:** what the project does, what users need, and where to start. Keep implementation mechanics and exhaustive options behind links.
- **Task guide:** prerequisites, ordered actions, and the expected result. Lead with the normal product workflow; put optional CLI or source-build routes after it or under advanced use.
- **Reference:** precise options, defaults, supported values, errors, and lookup structure. Keep necessary detail, even when the page is long.
- **Explanation:** concepts, relationships, constraints, and reasons for design decisions. Explain terms before relying on them.
- **Contributor guide:** the development workflow and relevant verification. Separate it from end-user setup and agent-specific operations.

Mixed pages are allowed when their sections serve one reader's task. Long does not automatically mean bad. Move or condense detail only when it helps readers, retaining a discoverable destination. Prefer existing destinations and section headings over splitting files. Create new companion documents only when explicitly requested.

## Refine with evidence

Check consequential claims against actual entry points, configuration, source, tests, and published artifacts. Distinguish source behavior from released behavior. Use consistent names across pages and state the working directory and required inputs for commands. Never infer that a command succeeds merely because it is documented.

Preserve technical meaning, legal notices, attribution, useful examples, and stable anchors. Find incoming links before renaming a heading or moving content; update relative paths from their new location and retain compatibility anchors when useful. Keep one authoritative explanation for shared facts and link to it, allowing brief repetition where readers need context.

Use direct prose, descriptive headings and links, numbered steps for sequences, and tables for genuine comparisons. Center compact media galleries when useful; keep instructions readable and avoid applying README branding to every document. Code fences, callouts, Mermaid, HTML, and relative assets must remain compatible with their intended GitHub renderer. Do not change executable examples for style alone.

Do not invent best practices, feature support, warnings, known issues, release promises, or missing-license notices. Ask the owner before adding a known issue or critical warning unless already requested. Preserve established notices unless their removal or correction is authorized. Omit speculative sections; do not choose a license, add dependencies, or create CONTRIBUTING/SECURITY/changelog files merely to complete a checklist. If evidence conflicts and cannot resolve a claim, report the question in the conversation rather than publishing a guess.

## Verify and deliver

Check local paths and heading fragments in every reviewed file, including links into changed pages. Treat example URLs and paths in code blocks as examples, not live navigation. Separate confirmed broken links from authentication, rate-limit, and network failures. Run bounded, relevant command examples only when safe and useful; never deploy or modify user data just to test prose.

Use the repository's documentation checks. If README Skill's toolkit is available, `check --root <repo> --readme <file> --json` can check one document at a time; its README-specific missing-section warnings do not require adding those sections to other pages. It does not recursively audit documentation or establish factual correctness. No toolkit is required for this skill.

Re-read each changed page as its intended reader: can they find the next action, understand prerequisites, distinguish normal from advanced use, and locate the detailed reference? Verify that moving material did not lose information or break links. Inspect rendered output only when allowed or requested, and distinguish source checks from visual verification.

Report coverage, material improvements, checks performed, and unresolved facts or excluded documents. A successful review can leave a page unchanged. Publication and PR creation follow the user's authorization and repository conventions; a documentation review does not itself authorize repository settings changes.
