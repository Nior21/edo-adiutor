import { fetchDocumentXml, saveDocumentXmlFile } from "./bridgeAsync";
import { downloadBase64File } from "./downloadBase64";
import type { EpdListItem, XmlFileItem } from "./types";

export type SaveXmlOutcome =
  | { kind: "1c-dialog"; fileName: string; savedPath?: string }
  | { kind: "browser-download"; fileName: string }
  | { kind: "error"; message: string };

/** Сохранить один XML: сначала диалог 1С, иначе загрузка в папку «Загрузки» браузера. */
export async function saveXmlFileForDocument(
  ref: string,
  docType: string,
  file: XmlFileItem,
): Promise<SaveXmlOutcome> {
  try {
    const savePayload = await saveDocumentXmlFile(ref, docType, file.fileRef);
    if (savePayload.cancelled) {
      return { kind: "error", message: "Сохранение отменено" };
    }
    if (savePayload.success && savePayload.savedOnClient) {
      return {
        kind: "1c-dialog",
        fileName: savePayload.fileName || file.fileName,
        savedPath: savePayload.savedPath,
      };
    }
    const payload =
      savePayload.success && savePayload.dataBase64
        ? savePayload
        : await fetchDocumentXml(ref, docType, file.fileRef);
    if (!payload.success || !payload.dataBase64) {
      return {
        kind: "error",
        message: payload.error || savePayload.error || "Не удалось получить XML",
      };
    }
    downloadBase64File(payload.dataBase64, payload.fileName || file.fileName);
    return { kind: "browser-download", fileName: payload.fileName || file.fileName };
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Ошибка сохранения XML",
    };
  }
}

export function saveXmlToastMessage(outcome: SaveXmlOutcome): string {
  if (outcome.kind === "error") {
    return outcome.message;
  }
  if (outcome.kind === "1c-dialog") {
    if (outcome.savedPath) {
      return `Файл сохранён: ${outcome.savedPath}`;
    }
    return `Файл «${outcome.fileName}» сохранён через диалог 1С «Сохранить как» — путь вы выбирали в окне 1С`;
  }
  return `Загрузки: «${outcome.fileName}» — обычно папка «Загрузки» браузера (полный путь в настройках Chrome/Edge; в веб-клиенте без диалога 1С указать каталог нельзя)`;
}

export function pickPrimaryXmlFile(item: EpdListItem): XmlFileItem | null {
  if (!item.xmlFiles?.length) {
    return null;
  }
  if (item.xmlFiles.length === 1) {
    return item.xmlFiles[0];
  }
  const byTitul = item.xmlFiles.find((f) => /titul|титул|t1|on_trnacl/i.test(f.label + f.fileName));
  return byTitul ?? item.xmlFiles[0];
}
