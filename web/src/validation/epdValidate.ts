import {
  isBase64SignatureSuspicious,
  isEdoIdSuspicious,
  isInnValid,
  isKppValid,
  isUuidLike,
} from "./checks";
import type { DetailField, EpdListItem, PartyCell, ValidationIssue, ValidationLevel, ValidationSummary } from "../types";
import { mergeValidationIssues, mergeValidationSummary } from "./mergeValidation";

function emptySummary(): ValidationSummary {
  return { errorCount: 0, warnCount: 0, externalCount: 0, ok: true };
}

function bump(summary: ValidationSummary, level: ValidationLevel): void {
  if (level === "error") {
    summary.errorCount += 1;
    summary.ok = false;
  } else if (level === "warn") {
    summary.warnCount += 1;
  } else if (level === "external") {
    summary.externalCount += 1;
  }
}

function issue(
  id: string,
  level: ValidationLevel,
  message: string,
  extra?: Partial<ValidationIssue>,
): ValidationIssue {
  return { id, level, message, ...extra };
}

function validateParty(
  key: string,
  party: PartyCell,
  partyLabel: string,
  issues: ValidationIssue[],
  summary: ValidationSummary,
): void {
  const name = (party.name || "").trim();
  const inn = (party.inn || "").trim();
  const kpp = (party.kpp || "").trim();
  const edoId = (party.edoId || "").trim();

  if (name && !inn) {
    issues.push(issue(`${key}.inn.empty`, "warn", `Не заполнен ИНН (${partyLabel}).`, { fieldLabel: "ИНН" }));
    bump(summary, "warn");
  } else if (inn && !isInnValid(inn)) {
    issues.push(
      issue(`${key}.inn.invalid`, "error", `ИНН ${partyLabel}: неверный формат (10 или 12 цифр).`, { fieldLabel: "ИНН" }),
    );
    bump(summary, "error");
  }

  if (kpp && !isKppValid(kpp)) {
    issues.push(issue(`${key}.kpp.invalid`, "warn", `КПП ${partyLabel}: ожидается 9 цифр.`, { fieldLabel: "КПП" }));
    bump(summary, "warn");
  }

  if (name && !edoId && !party.isOwnOrganization) {
    issues.push(issue(`${key}.edo.empty`, "warn", `Не заполнен ID ЭДО (${partyLabel}).`, { fieldLabel: "ID ЭДО" }));
    bump(summary, "warn");
  } else if (edoId && isEdoIdSuspicious(edoId)) {
    issues.push(issue(`${key}.edo.format`, "warn", `ID ЭДО ${partyLabel}: подозрительная длина.`, { fieldLabel: "ID ЭДО" }));
    bump(summary, "warn");
  }

  if (edoId && party.edoExchangeStatus === "not_accepted" && !party.isOwnOrganization) {
    issues.push(issue(`${key}.edo.notAccepted`, "warn", `Обмен ЭДО не принят для ${partyLabel}: ${edoId}.`));
    bump(summary, "warn");
  }
}

function validateDetailField(field: DetailField, issues: ValidationIssue[], summary: ValidationSummary): void {
  const value = (field.value || "").trim();
  const label = field.label || "";

  if (label.includes("ИНН") && value && !isInnValid(value)) {
    issues.push(
      issue("detail.inn.invalid", "error", `«${label}»: неверный ИНН.`, { fieldId: field.fieldId, fieldLabel: label }),
    );
    bump(summary, "error");
  }
  if (label.includes("КПП") && value && !isKppValid(value)) {
    issues.push(issue("detail.kpp.invalid", "warn", `«${label}»: неверный КПП.`, { fieldId: field.fieldId, fieldLabel: label }));
    bump(summary, "warn");
  }
  if ((label.includes("Подпись") || label.includes("ЭлектроннаяПодпись")) && isBase64SignatureSuspicious(value)) {
    issues.push(
      issue("detail.signature.suspicious", "warn", `«${label}»: подпись слишком короткая или не похожа на base64.`, {
        fieldId: field.fieldId,
        fieldLabel: label,
      }),
    );
    bump(summary, "warn");
  }
}

export function validateEpdItem(
  item: EpdListItem,
  includeDetails = false,
): { issues: ValidationIssue[]; summary: ValidationSummary } {
  const issues: ValidationIssue[] = [];
  const summary = emptySummary();

  if (item.deletionMark) {
    issues.push(issue("doc.deleted", "warn", "Документ помечен на удаление."));
    bump(summary, "warn");
  }

  validateParty("shipper", item.shipper, "грузоотправитель", issues, summary);
  validateParty("consignee", item.consignee, "грузополучатель", issues, summary);
  validateParty("carrier", item.carrier, "перевозчик", issues, summary);

  const uid = (item.uidMintrans || "").trim();
  if (uid && !isUuidLike(uid)) {
    issues.push(issue("doc.uidMintrans", "warn", "УИД Минтранс: не похож на UUID."));
    bump(summary, "warn");
  }

  const docType = (item.docType || "").toUpperCase();
  if (
    (docType.includes("ЭТР") || docType.includes("ETRN")) &&
    item.waybillNumber &&
    item.number &&
    item.waybillNumber !== item.number
  ) {
    issues.push(issue("etrn.waybillNumber", "warn", `Номер ЭПД (${item.number}) ≠ номеру ТН (${item.waybillNumber}).`));
    bump(summary, "warn");
  }

  if (includeDetails && item.detailFields?.length) {
    for (const field of item.detailFields) {
      validateDetailField(field, issues, summary);
    }
  }

  if (issues.length === 0) {
    summary.ok = true;
  }

  return { issues, summary };
}

export function enrichDetailFieldsValidation(fields: DetailField[]): DetailField[] {
  return fields.map((field) => {
    const label = field.label || "";
    const value = (field.value || "").trim();
    if (label.includes("ИНН") && value && !isInnValid(value)) {
      return { ...field, validationLevel: "error" as const };
    }
    if (label.includes("КПП") && value && !isKppValid(value)) {
      return { ...field, validationLevel: "warn" as const };
    }
    if ((label.includes("Подпись") || label.includes("ЭлектроннаяПодпись")) && isBase64SignatureSuspicious(value)) {
      return { ...field, validationLevel: "warn" as const };
    }
    if (/адрес/i.test(label) && value.length > 5) {
      return { ...field, validationLevel: "external" as const, externalCheck: "address" as const };
    }
    if (value) {
      return { ...field, validationLevel: "ok" as const };
    }
    return field;
  });
}

export function withClientValidation(item: EpdListItem): EpdListItem {
  const includeDetails = Boolean(item.detailFields?.length);
  const { issues, summary } = validateEpdItem(item, includeDetails);
  const detailFields = item.detailFields ? enrichDetailFieldsValidation(item.detailFields) : item.detailFields;
  const mergedIssues = mergeValidationIssues(item.validationIssues, issues);
  const mergedSummary = mergeValidationSummary(item.validationSummary, summary);
  return { ...item, validationIssues: mergedIssues, validationSummary: mergedSummary, detailFields };
}
