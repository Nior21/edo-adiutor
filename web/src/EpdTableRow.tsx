import { useRef, type MouseEvent } from "react";
import { DocCellView } from "./DocCellView";
import { PartyCellView } from "./PartyCellView";
import { RowContextMenu, type RowContextMenuHandle } from "./RowContextMenu";
import type { FloatingMenuEntry } from "./FloatingMenu";
import type { EpdListItem } from "./types";

type EpdTableRowProps = {
  item: EpdListItem;
  active: boolean;
  selected: boolean;
  enrichingEdo?: boolean;
  getMenuEntries: (item: EpdListItem) => FloatingMenuEntry[];
  onRowClick: (item: EpdListItem, event: MouseEvent<HTMLTableRowElement>) => void;
  onCopied: (value: string) => void;
  onOpenMenu: (x: number, y: number, items: FloatingMenuEntry[]) => void;
};

export function EpdTableRow({
  item,
  active,
  selected,
  enrichingEdo = false,
  getMenuEntries,
  onRowClick,
  onCopied,
  onOpenMenu,
}: EpdTableRowProps) {
  const menuRef = useRef<RowContextMenuHandle>(null);
  const trRef = useRef<HTMLTableRowElement>(null);

  const handleRowContextMenu = (event: MouseEvent<HTMLTableRowElement>) => {
    event.preventDefault();
    event.stopPropagation();
    menuRef.current?.openAt(event.clientX, event.clientY);
  };

  const handleMenuCellClick = (event: MouseEvent<HTMLTableCellElement>) => {
    event.stopPropagation();
  };

  const rowClass = [
    item.deletionMark ? "row-deleted" : "",
    active ? "row-active" : "",
    selected ? "row-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr
      ref={trRef}
      className={rowClass}
      onClick={(event) => onRowClick(item, event)}
      onContextMenu={handleRowContextMenu}
    >
      <td className="col-doc-cell">
        <DocCellView item={item} rowRef={trRef} onCopied={onCopied} onOpenMenu={onOpenMenu} />
      </td>
      <td>
        <PartyCellView
          party={item.shipper}
          organizationRef={item.organizationRef ?? ""}
          enrichingEdo={enrichingEdo}
          onCopied={onCopied}
          onOpenMenu={onOpenMenu}
        />
      </td>
      <td>
        <PartyCellView
          party={item.carrier}
          organizationRef={item.organizationRef ?? ""}
          enrichingEdo={enrichingEdo}
          onCopied={onCopied}
          onOpenMenu={onOpenMenu}
        />
      </td>
      <td>
        <PartyCellView
          party={item.consignee}
          organizationRef={item.organizationRef ?? ""}
          enrichingEdo={enrichingEdo}
          onCopied={onCopied}
          onOpenMenu={onOpenMenu}
        />
      </td>
      <td className="col-row-menu" onClick={handleMenuCellClick}>
        <RowContextMenu
          ref={menuRef}
          getMenuEntries={() => getMenuEntries(item)}
          onOpenMenu={onOpenMenu}
        />
      </td>
    </tr>
  );
}
