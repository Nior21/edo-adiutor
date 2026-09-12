export function formatDate(value: string): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU");
}

/** Дата и время без секунд — для таблицы. */
export function formatDateShort(value: string): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncateEdoId(value: string, head = 8, tail = 4): string {
  if (!value) {
    return "—";
  }
  if (value.length <= head + tail + 3) {
    return value;
  }
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function formatInn(inn: string, kpp: string): string {
  if (!inn && !kpp) {
    return "";
  }
  if (inn && kpp) {
    return inn;
  }
  return inn || kpp;
}
