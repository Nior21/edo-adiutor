export function digitsOnly(s: string): boolean {
  return /^\d+$/.test(s);
}

export function isInnValid(inn: string): boolean {
  const t = inn.trim();
  if (!t) {
    return true;
  }
  if (!digitsOnly(t)) {
    return false;
  }
  return t.length === 10 || t.length === 12;
}

export function isKppValid(kpp: string): boolean {
  const t = kpp.trim();
  if (!t) {
    return true;
  }
  return digitsOnly(t) && t.length === 9;
}

export function isEdoIdSuspicious(edoId: string): boolean {
  const t = edoId.trim();
  if (!t) {
    return false;
  }
  return t.length < 3 || t.length > 46;
}

export function isUuidLike(value: string): boolean {
  const t = value.trim();
  if (!t) {
    return true;
  }
  return /^[0-9a-fA-F-]{32,36}$/.test(t.replace(/[{}]/g, ""));
}

export function isBase64SignatureSuspicious(value: string): boolean {
  const t = value.trim();
  if (!t || t === "—") {
    return false;
  }
  if (t.length < 64) {
    return true;
  }
  return !/^[A-Za-z0-9+/=\r\n]+$/.test(t.slice(0, 200));
}
