/** WebKit в тонком клиенте 1С часто без ES2019 String.prototype.trimStart. */
export function trimLeadingWhitespace(value: string): string {
  if (typeof value.trimStart === "function") {
    return value.trimStart();
  }
  return value.replace(/^\s+/u, "");
}
