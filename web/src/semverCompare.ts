export function normalizeSemver(version: string): string {
  const trimmed = version.trim().replace(/^v/i, "");
  const parts = trimmed.split(".").map((p) => parseInt(p, 10) || 0);
  while (parts.length < 3) {
    parts.push(0);
  }
  return parts.slice(0, 3).join(".");
}

/** -1 if a < b, 0 if equal, 1 if a > b */
export function compareSemver(a: string, b: string): number {
  const pa = normalizeSemver(a).split(".").map((n) => parseInt(n, 10) || 0);
  const pb = normalizeSemver(b).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) {
      return d > 0 ? 1 : -1;
    }
  }
  return 0;
}
