import { COMMENT_WORK_TAG, hasCommentWorkTag, normalizeCommentRaw } from "./commentDisplay";
import { trimLeadingWhitespace } from "./stringCompat";

/** Добавить или снять метку внимания [!] в начале комментария. */
export function setCommentWorkTag(raw: unknown, enabled: boolean): string {
  const normalized = normalizeCommentRaw(raw);
  const hasTag = hasCommentWorkTag(normalized);

  if (enabled) {
    if (hasTag) {
      return normalized;
    }
    const body = trimLeadingWhitespace(normalized);
    if (!body) {
      return COMMENT_WORK_TAG;
    }
    return `${COMMENT_WORK_TAG} ${body}`;
  }

  if (!hasTag) {
    return normalized;
  }

  let rest = trimLeadingWhitespace(normalized.slice(COMMENT_WORK_TAG.length));
  if (rest.startsWith(":")) {
    rest = trimLeadingWhitespace(rest.slice(1));
  }
  return rest;
}

export function toggleCommentWorkTag(raw: unknown): string {
  return setCommentWorkTag(raw, !hasCommentWorkTag(raw));
}
