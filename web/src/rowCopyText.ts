import { formatDate, formatDateShort, formatInn } from "./format";
import type { EpdListItem, PartyCell } from "./types";

function partyBlock(label: string, party: PartyCell): string[] {
  const lines: string[] = [label];
  if (party.name) {
    lines.push(`  Наименование: ${party.name}`);
  }
  const inn = formatInn(party.inn, party.kpp);
  if (inn) {
    lines.push(`  ИНН: ${inn}${party.kpp ? ` / КПП: ${party.kpp}` : ""}`);
  }
  if (party.edoId) {
    lines.push(`  ID ЭДО: ${party.edoId}`);
  }
  if (lines.length === 1) {
    lines.push("  —");
  }
  return lines;
}

export function buildRowCopyText(item: EpdListItem): string {
  const lines: string[] = [
    `${item.docTypeName || item.docType} № ${item.number || "—"}`,
    `Дата: ${formatDate(item.date)}`,
    `Шаг: ${item.currentStep || "—"} (${item.currentStepDone ? "выполнен" : "не выполнен"})`,
  ];

  if (item.deletionMark) {
    lines.push("Статус: помечен на удаление");
  }
  if (item.organization) {
    lines.push(`Организация: ${item.organization}`);
  }
  if (item.ibNumber) {
    lines.push(`Номер в ИБ: ${item.ibNumber}`);
  }
  if (item.uidMintrans) {
    lines.push(`УИД Минтранс: ${item.uidMintrans}`);
  }
  if (item.comment) {
    lines.push(`Комментарий: ${item.comment}`);
  }

  lines.push("");
  lines.push(...partyBlock("Грузоотправитель:", item.shipper));
  lines.push("");
  lines.push(...partyBlock("Перевозчик:", item.carrier));
  lines.push("");
  lines.push(...partyBlock("Грузополучатель:", item.consignee));

  return lines.join("\n");
}

export function buildRowCopyPreview(item: EpdListItem): string {
  const head = `${item.docType} № ${item.number || "—"}`;
  const date = item.date ? formatDateShort(item.date) : "";
  return date ? `${head} · ${date}` : head;
}
