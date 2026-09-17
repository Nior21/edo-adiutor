import { copyToClipboard } from "./copy";
import { hasCommentWorkTag } from "./commentDisplay";
import { setCommentWorkTag } from "./commentWorkTag";
import type { FloatingMenuEntry } from "./FloatingMenu";
import { buildRowCopyPreview, buildRowCopyText, buildRowsCopyPreview, buildRowsCopyText } from "./rowCopyText";
import type { EpdListItem } from "./types";
import { buildXmlSaveContextMenuEntries, type XmlSaveMenuActions } from "./xmlSaveContextMenu";

export type RowMenuActions = {
  onCopied: (value: string) => void;
  onSaveComment: (item: EpdListItem, comment: string) => void;
  xmlSave?: XmlSaveMenuActions;
};

function heading(id: string, label: string): FloatingMenuEntry {
  return { id, kind: "heading", label };
}

function copyItems(items: EpdListItem[], onCopied: (value: string) => void) {
  return async () => {
    const text = items.length === 1 ? buildRowCopyText(items[0]) : buildRowsCopyText(items);
    const ok = await copyToClipboard(text);
    if (ok) {
      onCopied(items.length === 1 ? buildRowCopyPreview(items[0]) : buildRowsCopyPreview(items));
    }
  };
}

function attentionItems(
  items: EpdListItem[],
  enable: boolean,
  onSaveComment: (item: EpdListItem, comment: string) => void,
) {
  return () => {
    for (const item of items) {
      const next = setCommentWorkTag(item.comment, enable);
      if (next !== item.comment) {
        onSaveComment(item, next);
      }
    }
  };
}

/** Контекстное меню: блок для выделения (если >1) и блок для строки под курсором. */
export function buildRowContextMenuEntries(
  row: EpdListItem,
  selection: EpdListItem[],
  actions: RowMenuActions,
): FloatingMenuEntry[] {
  const entries: FloatingMenuEntry[] = [];
  const bulk = selection.length > 1 && selection.some((item) => item.ref === row.ref);
  const bulkAll = bulk ? selection : [row];

  if (bulk) {
    entries.push(heading("bulk-head", `Выделено: ${selection.length}`));
    entries.push({
      id: "bulk-copy",
      kind: "item",
      label: "Скопировать всё (выделение)",
      onSelect: copyItems(selection, actions.onCopied),
    });
    entries.push({
      id: "bulk-flag",
      kind: "item",
      label: "В фокус — метка [!] (выделение)",
      onSelect: attentionItems(selection, true, actions.onSaveComment),
    });
    entries.push({
      id: "bulk-unflag",
      kind: "item",
      label: "Снять метку [!] (выделение)",
      onSelect: attentionItems(selection, false, actions.onSaveComment),
    });
    entries.push(heading("row-head", "Эта строка"));
  }

  entries.push({
    id: "row-copy",
    kind: "item",
    label: bulk ? "Скопировать всё (строка)" : "Скопировать всё",
    onSelect: copyItems([row], actions.onCopied),
  });

  const flagged = hasCommentWorkTag(row.comment);
  entries.push({
    id: flagged ? "row-unflag" : "row-flag",
    kind: "item",
    label: flagged ? "Снять метку [!]" : "В фокус — метка [!]",
    onSelect: attentionItems([row], !flagged, actions.onSaveComment),
  });

  if (actions.xmlSave) {
    entries.push({ id: "xml-sep", kind: "heading", label: "Файлы" });
    entries.push(...buildXmlSaveContextMenuEntries(row, actions.xmlSave));
  }

  return entries;
}

