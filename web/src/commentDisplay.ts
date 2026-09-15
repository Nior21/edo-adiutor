/** Служебный префикс: «ошибка / разбор в работе». В UI не показываем, в 1С хранится в начале комментария. */
export const COMMENT_WORK_TAG = "[!]";

export function hasCommentWorkTag(raw: string): boolean {
  const trimmed = raw.trimStart();
  return trimmed.startsWith(COMMENT_WORK_TAG);
}

/** Текст для выезжающей плашки и отображения (без служебного тега). */
export function commentTextForDisplay(raw: string): string {
  let text = raw.trimStart();
  if (text.startsWith(COMMENT_WORK_TAG)) {
    text = text.slice(COMMENT_WORK_TAG.length).trimStart();
    if (text.startsWith(":")) {
      text = text.slice(1).trimStart();
    }
  }
  return text.trim();
}

export function hasDisplayableComment(raw: string): boolean {
  return commentTextForDisplay(raw).length > 0;
}
