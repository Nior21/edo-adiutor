import { trimLeadingWhitespace } from "./stringCompat";

/** Служебный префикс: «ошибка / разбор в работе». В UI не показываем, в 1С хранится в начале комментария. */
export const COMMENT_WORK_TAG = "[!]";

/** 1С иногда отдаёт null/число или поле отсутствует. */
export function normalizeCommentRaw(raw: unknown): string {
  if (raw === null || raw === undefined) {
    return "";
  }
  if (typeof raw === "string") {
    return raw;
  }
  return String(raw);
}

export function hasCommentWorkTag(raw: unknown): boolean {
  const trimmed = trimLeadingWhitespace(normalizeCommentRaw(raw));
  return trimmed.startsWith(COMMENT_WORK_TAG);
}

/** Текст для выезжающей плашки и отображения (без служебного тега). */
export function commentTextForDisplay(raw: unknown): string {
  let text = trimLeadingWhitespace(normalizeCommentRaw(raw));
  if (text.startsWith(COMMENT_WORK_TAG)) {
    text = trimLeadingWhitespace(text.slice(COMMENT_WORK_TAG.length));
    if (text.startsWith(":")) {
      text = trimLeadingWhitespace(text.slice(1));
    }
  }
  return text.trim();
}

export function hasDisplayableComment(raw: unknown): boolean {
  return commentTextForDisplay(raw).length > 0;
}
