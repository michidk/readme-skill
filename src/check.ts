import { stat } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import sharp from "sharp";
import { lint } from "markdownlint/promise";
import { markdownFacts } from "./markdown";
import { inspectRepository } from "./repository";
import { localPath, message } from "./io";
import type { Policy } from "./policy";
export type Finding = {
  severity: "error" | "warning" | "unverified";
  code: string;
  message: string;
  file: string;
  line?: number;
};
export async function checkRepository(options: {
  root: string;
  policy: Policy;
  readme?: string;
  network?: boolean;
}) {
  const repo = await inspectRepository(options.root, options.policy);
  const root = repo.root;
  const path = options.readme ?? repo.readme ?? "README.md";
  const findings: Finding[] = [];
  function add(
    severity: Finding["severity"],
    code: string,
    message: string,
    line?: number,
  ) {
    findings.push({
      severity,
      code,
      message,
      file: path,
      ...(line ? { line } : {}),
    });
  }
  const full = await localPath(root, path);
  if (!(await Bun.file(full).exists())) {
    add("error", "readme.missing", "No README found");
    return { schemaVersion: 1, ok: false, findings };
  }
  if (Bun.file(full).size > 1_000_000)
    throw new Error("README exceeds 1 MB inspection limit");
  const text = await Bun.file(full).text();
  const facts = markdownFacts(text);
  if (!repo.license)
    add(
      "error",
      "license.missing",
      "No repository license file found. Do not infer or invent a license.",
    );
  for (const warning of repo.warnings)
    add("warning", "inventory.warning", warning);
  for (const section of options.policy.requiredSections)
    if (
      !facts.headings.some((h) =>
        h.toLowerCase().includes(section.toLowerCase()),
      )
    )
      add(
        "warning",
        "section.missing",
        `No ${section} heading; verify an equivalent entry point exists.`,
      );
  if (!facts.headings.length)
    add("warning", "title.missing", "No Markdown heading found");
  if (/\b(TODO|YOUR[_ -](PROJECT|NAME)|example\.com)\b/i.test(text))
    add("warning", "placeholder", "Possible unfinished placeholder");
  for (const ref of facts.unresolved)
    add(
      "error",
      "reference.undefined",
      `Undefined reference: ${ref.id}`,
      ref.line,
    );
  const badges = facts.references.filter(
    (r) =>
      r.kind === "image" &&
      /shields\.io|badge\.svg|badge\.fury|badgen\.net/.test(r.url),
  );
  if (badges.length > options.policy.maxBadges)
    add(
      "warning",
      "badge.count",
      `${badges.length} badges exceed policy maximum ${options.policy.maxBadges}`,
    );
  const networkCache = new Map<
    string,
    Promise<{
      severity: Finding["severity"];
      code: string;
      message: string;
    } | null>
  >();
  for (const ref of facts.references) {
    if (ref.kind === "image" && ref.alt === undefined)
      add("warning", "image.alt", "HTML image has no alt attribute", ref.line);
    if (/^https?:\/\//i.test(ref.url)) {
      if (!options.network) {
        add("unverified", "link.remote", `Not requested: ${ref.url}`, ref.line);
        continue;
      }
      let check = networkCache.get(ref.url);
      if (!check) {
        check = checkRemote(ref.url);
        networkCache.set(ref.url, check);
      }
      const result = await check;
      if (result) add(result.severity, result.code, result.message, ref.line);
      continue;
    }
    if (/^(mailto:|tel:)/i.test(ref.url)) continue;
    if (/^[a-z][a-z\d+.-]*:|^\/\//i.test(ref.url)) {
      add(
        "warning",
        "link.scheme",
        `Unsupported URL scheme: ${ref.url}`,
        ref.line,
      );
      continue;
    }
    try {
      const [rawPath = "", rawAnchor] = ref.url.split("#", 2);
      const decoded = decodeURIComponent(rawPath.split("?")[0] ?? "");
      const dest = decoded.startsWith("/")
        ? decoded.slice(1)
        : decoded
          ? relative(root, resolve(dirname(full), decoded))
          : path;
      const target = await localPath(root, dest);
      const file = Bun.file(target);
      const info = await stat(target).catch(() => null);
      if (!info || (ref.kind === "image" && !info.isFile())) {
        add(
          "error",
          ref.kind === "image" ? "asset.missing" : "link.missing",
          `Missing: ${ref.url}`,
          ref.line,
        );
        continue;
      }
      if (info.isDirectory()) continue;
      if (
        (rawAnchor && /\.md$/i.test(target) && info.size > 1_000_000) ||
        (ref.kind === "image" && info.size > 20_000_000) ||
        (ref.kind === "image" &&
          /\.svg$/i.test(target) &&
          info.size > 2_000_000)
      ) {
        add(
          "unverified",
          "reference.too-large",
          `Reference exceeds inspection limit: ${ref.url}`,
          ref.line,
        );
        continue;
      }
      if (rawAnchor && /\.md$/i.test(target)) {
        const anchor = decodeURIComponent(rawAnchor);
        const targetFacts =
          target === full ? facts : markdownFacts(await file.text());
        if (!targetFacts.anchors.has(anchor))
          add(
            "error",
            "anchor.missing",
            `Missing anchor: ${ref.url}`,
            ref.line,
          );
      }
      if (ref.kind === "image") {
        const budget = /hero/i.test(dest)
          ? options.policy.heroBudgetBytes
          : options.policy.imageBudgetBytes;
        if (file.size > budget)
          add(
            "warning",
            "image.budget",
            `${dest}: ${file.size} bytes exceeds ${budget}`,
            ref.line,
          );
        if (extname(dest).toLowerCase() === ".svg") {
          const svg = await file.text();
          if (
            /<(?:script|foreignObject)\b|(?:href|src)\s*=\s*["'](?!#|data:)[^"']+|url\(\s*["']?(?!#)[^)]+\)/i.test(
              svg,
            )
          )
            add(
              "warning",
              "svg.dependencies",
              `${dest}: SVG contains active content or external dependencies; verify portability`,
              ref.line,
            );
        }
        try {
          const meta = await sharp(await file.arrayBuffer()).metadata();
          if (!meta.width || !meta.height)
            add(
              "warning",
              "image.dimensions",
              `Unknown dimensions: ${dest}`,
              ref.line,
            );
        } catch {
          add(
            "error",
            "image.invalid",
            `Cannot decode image: ${dest}`,
            ref.line,
          );
        }
      }
    } catch (error) {
      add(
        "error",
        message(error) === "path.outside"
          ? "path.outside"
          : "reference.invalid",
        `${ref.url}: ${message(error)}`,
        ref.line,
      );
    }
  }
  const linted = await lint({
    strings: { [path]: text },
    config: {
      default: true,
      MD013: false,
      MD033: false,
      MD041: false,
      MD024: false,
    },
  });
  for (const item of linted[path] ?? [])
    add(
      "warning",
      "markdown.style",
      `${item.ruleNames[0]}: ${item.ruleDescription}`,
      item.lineNumber,
    );
  add(
    "unverified",
    "commands.execution",
    "Commands have not been executed by this checker",
  );
  add(
    "unverified",
    "visual.review",
    "Actual rendering and editorial quality require agent inspection",
  );
  return {
    schemaVersion: 1,
    ok: !findings.some((f) => f.severity === "error"),
    findings,
  };
}
export async function checkRemote(url: string) {
  try {
    let response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 405) {
      response = await fetch(url, {
        headers: { Range: "bytes=0-0" },
        signal: AbortSignal.timeout(8000),
      });
      await response.body?.cancel();
    }
    if (response.ok) return null;
    if (response.status === 404 || response.status === 410)
      return {
        severity: "error" as const,
        code: "link.broken",
        message: `${response.status}: ${url}`,
      };
    return {
      severity: "unverified" as const,
      code: "link.unverified",
      message: `HTTP ${response.status}: ${url}`,
    };
  } catch (error) {
    return {
      severity: "unverified" as const,
      code: "link.unverified",
      message: `${url}: ${message(error)}`,
    };
  }
}
