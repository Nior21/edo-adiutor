import { forwardRef, useImperativeHandle, type MouseEvent } from "react";
import type { FloatingMenuEntry } from "./FloatingMenu";

export type RowContextMenuHandle = {
  openAt: (x: number, y: number) => void;
};

type RowContextMenuProps = {
  getMenuEntries: () => FloatingMenuEntry[];
  onOpenMenu: (x: number, y: number, items: FloatingMenuEntry[]) => void;
};

export const RowContextMenu = forwardRef<RowContextMenuHandle, RowContextMenuProps>(function RowContextMenu(
  { getMenuEntries, onOpenMenu },
  ref,
) {
  const openAt = (x: number, y: number) => {
    onOpenMenu(x, y, getMenuEntries());
  };

  useImperativeHandle(ref, () => ({ openAt }), [getMenuEntries, onOpenMenu]);

  const handleMenuButton = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    openAt(rect.left, rect.bottom + 4);
  };

  return (
    <button
      type="button"
      className="row-menu-btn"
      onClick={handleMenuButton}
      title="Дополнительные действия"
      aria-label="Меню строки"
    >
      ⋮
    </button>
  );
});
