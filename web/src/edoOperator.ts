import type { EdoDiagnosticItem } from "./types";

/** Запасной справочник, если в базе нет записи в регистре ОператорыЭДО (префикс ID — первые 3 символа). */
const OPERATOR_NAMES_BY_CODE: Record<string, string> = {
  "2BM": "СКБ Контур",
  "2AE": "Калуга Астрал",
  "2BE": "Такском",
  "2BK": "Тензор (СБИС)",
  "2LT": "Link Service (Линк)",
  "2PS": "Промсвязь-ЗИ",
  "2VO": "Э-КОМ",
  "2AD": "ЭДО Лайт",
  "2IG": "ЭДО.Поток",
  "2JH": "Ростелеком",
  "2AK": "СберКорус",
  "2AL": "ТаксNet",
  "2JD": "ЭТП ГПБ",
  "2LB": "ЭТП РФ",
};

export function operatorCodeFromEdoId(edoId: string): string {
  const trimmed = edoId.trim();
  if (trimmed.length < 3) {
    return "";
  }
  return trimmed.slice(0, 3).toUpperCase();
}

export function resolveOperatorDisplay(item: EdoDiagnosticItem): { code: string; label: string } {
  const fromInvitation = item.invitations.find((inv) => inv.operator.trim())?.operator.trim();
  const code = (item.operatorCode || fromInvitation || operatorCodeFromEdoId(item.edoId)).toUpperCase();
  let label = item.operatorLabel?.trim() ?? "";
  if (!label && code) {
    label = OPERATOR_NAMES_BY_CODE[code] ?? "";
  }
  if (!label && code) {
    label = code;
  }
  if (!label) {
    label = "—";
  }
  return { code, label };
}
