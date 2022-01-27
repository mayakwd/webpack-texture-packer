/**
 * deepEqual
 * (c) atmin (https://stackoverflow.com/posts/32922084/revisions)
 * @param a - object to compare
 * @param b - object to compare with
 * @return {boolean}
 */
export function deepEqual(a: any, b: any): boolean {
  const ok = Object.keys;
  const tx = typeof a;
  const ty = typeof b;
  return a && b && tx === "object" && tx === ty ? (
    ok(a).length === ok(b).length &&
    ok(a).every(key => deepEqual(a[key], b[key]))
  ) : (a === b);
}
