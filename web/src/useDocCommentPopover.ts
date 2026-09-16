import { useCallback, useRef, useState } from "react";

export function useDocCommentPopover(enabled: boolean) {
  const closeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openPopover = useCallback(() => {
    clearCloseTimer();
    if (enabled) {
      setOpen(true);
    }
  }, [clearCloseTimer, enabled]);

  const scheduleClosePopover = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  }, [clearCloseTimer]);

  return { open, openPopover, scheduleClosePopover };
}
