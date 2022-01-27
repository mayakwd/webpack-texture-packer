import {BinaryLike, createHash} from "crypto";

export function getHash(...request: (BinaryLike | string)[]): string {
  let hash = createHash("sha1");
  for (const item of request) {
    hash = hash.update(item);
  }
  return hash.digest("hex");
}
