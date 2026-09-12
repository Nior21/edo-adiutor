import { forwardRef, useImperativeHandle, type MouseEvent } from "react";
import { copyToClipboard } from "./copy";
import { buildRowCopyPreview, buildRowCopyText } from "./rowCopyText";
import type { FloatingMenuItem } from "./FloatingMenu";
import type { EpdListItem } from "./types";

export type RowContextMenuHandle = {
  openAt: (x: number, y: number) => void;
};

type RowContextMenuProps = {
  item: EpdListItem;
  onCopied: (value: string) => void;
  onOpenMenu: (x: number, y: number, items: FloatingMenuItem[]) => void;
};

export const RowContextMenu = forwardRef<RowContextMenuHandle, RowContextMenuProps>(function RowContextMenu(
  { item, onCopied, onOpenMenu },
  ref,
) {
  const buildItems = (): FloatingMenuItem[] => [
    {
      id: "copy-all",
      label: "Скопировать всё",
      onSelect: async () => {
        const text = buildRowCopyText(item);
        const ok = await copyToClipboard(text);
        if (ok) {
          onCopied(buildRowCopyPreview(item));
        }
      },
    },
  ];

  const openAt = (x: number, y: number) => {
    onOpenMenu(x, y, buildItems());
  };

  useImperativeHandle(ref, () => ({ openAt }), [item, onCopied, onOpenMenu]);

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
