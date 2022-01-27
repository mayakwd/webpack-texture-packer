import path from "path";

export function joinAssetPath(...parts: string[]): string {
  return path.posix.join(...parts.map((value) => value.replace(/\\/g, "/")));
}
