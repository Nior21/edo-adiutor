import type { MouseEvent } from "react";
import type { FloatingMenuItem } from "./FloatingMenu";

type ExternalLinkIconProps = {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  menuItems?: FloatingMenuItem[];
  onOpenMenu?: (x: number, y: number, items: FloatingMenuItem[]) => void;
};

export function ExternalLinkIcon({
  onClick,
  title = "Перейти",
  menuItems = [],
  onOpenMenu,
}: ExternalLinkIconProps) {
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
      className="link-icon-btn"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={title}
      aria-label={title}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M14 5h5v5M10 14 19 5M15 5h4v4M5 10v9a1 1 0 0 0 1 1h9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
