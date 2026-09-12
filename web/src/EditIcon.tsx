import type { MouseEvent } from "react";
import type { FloatingMenuItem } from "./FloatingMenu";

type EditIconProps = {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  menuItems?: FloatingMenuItem[];
  onOpenMenu?: (x: number, y: number, items: FloatingMenuItem[]) => void;
};

export function EditIcon({
  onClick,
  title = "Изменить",
  menuItems = [],
  onOpenMenu,
}: EditIconProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick(event);
  };

  const handleContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    if (!onOpenMenu || menuItems.length === 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onOpenMenu(event.clientX, event.clientY, menuItems);
  };

  return (
    <button
      type="button"
      className="link-icon-btn edit-icon-btn"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={title}
      aria-label={title}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3zM13.5 6.5l3 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
