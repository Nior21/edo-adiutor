import type { FloatingMenuEntry } from "./FloatingMenu";
import { pickPrimaryXmlFile, saveXmlFileForDocument, saveXmlToastMessage } from "./saveXmlFile";
import type { EpdListItem, XmlFileItem } from "./types";

export type XmlSaveMenuActions = {
  fetchDocumentDetail: (item: EpdListItem) => Promise<EpdListItem>;
  onSavedMessage: (message: string) => void;
};

function saveOneFile(
  ref: string,
  docType: string,
  file: XmlFileItem,
  onSavedMessage: (message: string) => void,
) {
  return async () => {
    const outcome = await saveXmlFileForDocument(ref, docType, file);
    onSavedMessage(saveXmlToastMessage(outcome));
  };
}

export function buildXmlSaveContextMenuEntries(
  row: EpdListItem,
  actions: XmlSaveMenuActions,
): FloatingMenuEntry[] {
  const entries: FloatingMenuEntry[] = [];

  const addFileItems = (doc: EpdListItem) => {
    const files = doc.xmlFiles ?? [];
    if (!files.length) {
      return;
    }
    if (files.length === 1) {
      entries.push({
        id: "xml-save-as",
        kind: "item",
        label: "Сохранить XML как…",
        onSelect: saveOneFile(doc.ref, doc.docType, files[0], actions.onSavedMessage),
      });
      return;
    }
    entries.push({ id: "xml-head", kind: "heading", label: "Сохранить XML как…" });
    for (const file of files) {
      const short = file.label || file.fileName;
      entries.push({
        id: `xml-save-${file.fileRef}`,
        kind: "item",
        label: short,
        onSelect: saveOneFile(doc.ref, doc.docType, file, actions.onSavedMessage),
      });
    }
  };

  if (row.xmlFiles?.length) {
    addFileItems(row);
    return entries;
  }

  entries.push({
    id: "xml-save-as-load",
    kind: "item",
    label: "Сохранить XML как…",
    onSelect: async () => {
      try {
        const doc = await actions.fetchDocumentDetail(row);
        const file = pickPrimaryXmlFile(doc);
        if (!file) {
          actions.onSavedMessage("У документа нет XML для сохранения");
          return;
        }
        if ((doc.xmlFiles?.length ?? 0) > 1) {
          actions.onSavedMessage(
            "Несколько XML — откройте карточку или ПКМ ещё раз после загрузки списка файлов",
          );
        }
        const outcome = await saveXmlFileForDocument(doc.ref, doc.docType, file);
        actions.onSavedMessage(saveXmlToastMessage(outcome));
      } catch (error) {
        actions.onSavedMessage(error instanceof Error ? error.message : "Не удалось загрузить документ");
      }
    },
  });

  return entries;
}
