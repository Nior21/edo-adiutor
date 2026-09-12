import { createPortal } from "react-dom";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

type ModalPortalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  cardClassName?: string;
  ariaLabelledBy?: string;
};

export function ModalPortal({
  open,
  onClose,
  children,
  cardClassName = "",
  ariaLabelledBy,
}: ModalPortalProps) {
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!open) {
      return;
    }

    const update = () => {
      setViewport({
        w: window.innerWidth || document.documentElement.clientWidth,
        h: window.innerHeight || document.documentElement.clientHeight,
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  if (!open) {
    return null;
  }

  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const overlayStyle =
    viewport.w > 0
      ? { width: viewport.w, height: viewport.h, minWidth: viewport.w, minHeight: viewport.h }
      : undefined;

  return createPortal(
    <div
      className="modal-overlay modal-overlay-portal"
      style={overlayStyle}
      onClick={handleBackdrop}
      role="presentation"
    >
      <div className="modal-overlay-table">
        <div className="modal-overlay-cell">
          <div
            className={`modal-card ${cardClassName}`.trim()}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
