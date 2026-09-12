import type { MouseEvent } from "react";
import { copyToClipboard } from "./copy";
import type { FloatingMenuItem } from "./FloatingMenu";

export type CopyableMenuItem = Omit<FloatingMenuItem, "id"> & { id?: string };

type CopyableProps = {
  value: string;
  label?: string;
  mono?: boolean;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  onCopied?: (value: string) => void;
  /** Дополнительные пункты контекстного меню (кроме «Копировать»). */
  extraMenuItems?: CopyableMenuItem[];
  onOpenMenu?: (x: number, y: number, items: FloatingMenuItem[]) => void;
};

export function Copyable({
  value,
  label,
  mono = false,
  inline = false,
  className = "",
  children,
  onCopied,
  extraMenuItems = [],
  onOpenMenu,
}: CopyableProps) {
  const display = value || "—";
  const canCopy = Boolean(value);

  const handleCopy = async (event?: MouseEvent) => {
    event?.stopPropagation();
    if (!value) {
      return;
    }
    const ok = await copyToClipboard(value);
    if (ok) {
      onCopied?.(value);
    }
  };

  const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
    void handleCopy(event);
  };

  const handleContextMenu = (event: MouseEvent<HTMLSpanElement>) => {
    if (!onOpenMenu) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const items: FloatingMenuItem[] = [];
    if (value) {
      items.push({ id: "copy", label: "Копировать", onSelect: () => handleCopy() });
    }
    for (const item of extraMenuItems) {
      items.push({ id: item.id ?? item.label, label: item.label, onSelect: item.onSelect });
    }
    onOpenMenu(event.clientX, event.clientY, items);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      void handleCopy();
    }
  };

  if (!canCopy) {
    return (
      <span className={`copyable-empty ${className}`.trim()}>
        {label ? <span className="copyable-label">{label}</span> : null}
        <span className="copyable-value">{children ?? display}</span>
      </span>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className={`copyable ${mono ? "copyable-mono" : ""} ${inline ? "copyable-inline" : ""} ${className}`.trim()}
      onClick={handleClick}
      onContextMenu={onOpenMenu ? handleContextMenu : undefined}
      onKeyDown={handleKeyDown}
      title="Нажмите, чтобы скопировать"
    >
      {label ? <span className="copyable-label">{label}</span> : null}
      <span className="copyable-value">{children ?? display}</span>
    </span>
  );
}
