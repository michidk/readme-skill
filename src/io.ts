import { mkdir, realpath, rename, rm } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { randomUUID } from "node:crypto";
export async function run(command: string[], cwd?: string, timeout = 20_000) {
  const p = Bun.spawn(command, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    timeout,
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  return { stdout, stderr, code };
}
export function inside(root: string, path: string) {
  const rel = relative(root, path);
  return rel !== ".." && !rel.startsWith("../") && !isAbsolute(rel);
}
export async function localPath(root: string, path: string) {
  const base = await realpath(root);
  const target = resolve(base, path);
  if (!inside(base, target)) throw new Error("path.outside");
  // Validate existing parents too, including a symlink leading to a missing leaf.
  let ancestor = target;
  while (true) {
    try {
      const actual = await realpath(ancestor);
      if (!inside(base, actual)) throw new Error("path.outside");
      break;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT" &&
        ancestor !== dirname(ancestor)
      )
        ancestor = dirname(ancestor);
      else throw error;
    }
  }
  return target;
}
export async function atomicWrite(path: string, data: string | Uint8Array) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  try {
    await Bun.write(temp, data);
    await rename(temp, path);
  } finally {
    await rm(temp, { force: true });
  }
}
export function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function protectSource(input: string, destinations: string[]) {
  const source = await realpath(input);
  const { stat } = await import("node:fs/promises");
  const sourceInfo = await stat(source);
  for (const destination of destinations) {
    let canonical = resolve(destination);
    try {
      canonical = await realpath(destination);
    } catch (error) {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ))
        throw error;
    }
    if (source === canonical)
      throw new Error(
        "Output and provenance destinations must differ from source",
      );
    try {
      const info = await stat(destination);
      if (info.dev === sourceInfo.dev && info.ino === sourceInfo.ino)
        throw new Error(
          "Output and provenance destinations must differ from source",
        );
    } catch (error) {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ))
        throw error;
    }
  }
}
