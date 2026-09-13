import { useCallback, useEffect, useRef, useState } from "react";

export type ToastKind = "info" | "error";

export type Toast = {
  message: string;
  kind: ToastKind;
};

const DEFAULT_DURATION_MS = 3500;

export function useToast(durationMs = DEFAULT_DURATION_MS) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearToast = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "info", customDurationMs?: number) => {
      if (!message) {
        return;
      }
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      setToast({ message, kind });
      const ms = customDurationMs ?? (kind === "error" ? Math.max(durationMs, 12000) : durationMs);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        setToast(null);
      }, ms);
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return { toast, showToast, clearToast };
}
