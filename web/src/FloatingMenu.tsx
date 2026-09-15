import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type MouseEvent } from "react";

const MENU_IDLE_CLOSE_MS = 12_000;

export type FloatingMenuItem = {
  id?: string;
  kind?: "item";
  label: string;
  onSelect: () => void | Promise<void>;
};

export type FloatingMenuHeading = {
  id?: string;
  kind: "heading";
  label: string;
};

export type FloatingMenuEntry = FloatingMenuItem | FloatingMenuHeading;

type FloatingMenuState = {
  x: number;
  y: number;
  items: FloatingMenuEntry[];
};

export function useFloatingMenu() {
  const [menu, setMenu] = useState<FloatingMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = () => setMenu(null);

  const openAt = (x: number, y: number, items: FloatingMenuEntry[]) => {
    const actionable = items.filter((entry) => entry.kind !== "heading");
    if (actionable.length === 0) {
      return;
    }
    setMenu({ x, y, items });
  };

  useEffect(() => {
    if (!menu) {
      return;
    }

    const handleClose = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      close();
    };

    const attachTimer = window.setTimeout(() => {
      document.addEventListener("click", handleClose);
      document.addEventListener("contextmenu", handleClose);
    }, 0);

    const idleTimer = window.setTimeout(() => {
      close();
    }, MENU_IDLE_CLOSE_MS);

    return () => {
      window.clearTimeout(attachTimer);
      window.clearTimeout(idleTimer);
      document.removeEventListener("click", handleClose);
      document.removeEventListener("contextmenu", handleClose);
    };
  }, [menu]);

  const handleItemClick = async (event: MouseEvent<HTMLButtonElement>, item: FloatingMenuItem) => {
    event.stopPropagation();
    await item.onSelect();
    close();
  };

  const portal =
    menu &&
    createPortal(
      <div
        ref={menuRef}
        className="floating-menu"
        style={{ top: menu.y, left: menu.x }}
        onClick={(event) => event.stopPropagation()}
        role="menu"
      >
        {menu.items.map((entry) =>
          entry.kind === "heading" ? (
            <div key={entry.id ?? entry.label} className="floating-menu-heading" role="presentation">
              {entry.label}
            </div>
          ) : (
            <button
              key={entry.id ?? entry.label}
              type="button"
              className="floating-menu-item"
              onClick={(event) => void handleItemClick(event, entry)}
              role="menuitem"
            >
              {entry.label}
            </button>
          ),
        )}
      </div>,
      document.body,
    );

  return { openAt, close, portal };
}
