import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type MouseEvent } from "react";

export type FloatingMenuItem = {
  id: string;
  label: string;
  onSelect: () => void | Promise<void>;
};

type FloatingMenuState = {
  x: number;
  y: number;
  items: FloatingMenuItem[];
};

export function useFloatingMenu() {
  const [menu, setMenu] = useState<FloatingMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = () => setMenu(null);

  const openAt = (x: number, y: number, items: FloatingMenuItem[]) => {
    if (items.length === 0) {
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

    const timer = window.setTimeout(() => {
      document.addEventListener("click", handleClose);
      document.addEventListener("contextmenu", handleClose);
    }, 0);

    return () => {
      window.clearTimeout(timer);
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
        {menu.items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="floating-menu-item"
            onClick={(event) => void handleItemClick(event, item)}
            role="menuitem"
          >
            {item.label}
          </button>
        ))}
      </div>,
      document.body,
    );

  return { openAt, close, portal };
}
