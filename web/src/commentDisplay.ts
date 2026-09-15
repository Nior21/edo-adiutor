/** Служебный префикс: «ошибка / разбор в работе». В UI не показываем, в 1С хранится в начале комментария. */
export const COMMENT_WORK_TAG = "[!]";

/** 1С иногда отдаёт null/число или поле отсутствует — безопасно для WebKit без trimStart на не-строке. */
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
  const trimmed = normalizeCommentRaw(raw).trimStart();
  return trimmed.startsWith(COMMENT_WORK_TAG);
}

/** Текст для выезжающей плашки и отображения (без служебного тега). */
export function commentTextForDisplay(raw: unknown): string {
  let text = normalizeCommentRaw(raw).trimStart();
  if (text.startsWith(COMMENT_WORK_TAG)) {
    text = text.slice(COMMENT_WORK_TAG.length).trimStart();
    if (text.startsWith(":")) {
      text = text.slice(1).trimStart();
    }
  }
  return text.trim();
}

export function hasDisplayableComment(raw: unknown): boolean {
  return commentTextForDisplay(raw).length > 0;
}
