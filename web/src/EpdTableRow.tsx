import { useRef, type MouseEvent } from "react";
import { DocCellView } from "./DocCellView";
import { PartyCellView } from "./PartyCellView";
import { RowContextMenu, type RowContextMenuHandle } from "./RowContextMenu";
import type { FloatingMenuItem } from "./FloatingMenu";
import type { EpdListItem } from "./types";

type EpdTableRowProps = {
  item: EpdListItem;
  active: boolean;
  enrichingEdo?: boolean;
  onOpen: (ref: string) => void;
  onCopied: (value: string) => void;
  onOpenMenu: (x: number, y: number, items: FloatingMenuItem[]) => void;
};

export function EpdTableRow({ item, active, enrichingEdo = false, onOpen, onCopied, onOpenMenu }: EpdTableRowProps) {
  const menuRef = useRef<RowContextMenuHandle>(null);

  const handleRowContextMenu = (event: MouseEvent<HTMLTableRowElement>) => {
    event.preventDefault();
    event.stopPropagation();
    menuRef.current?.openAt(event.clientX, event.clientY);
  };

  const handleMenuCellClick = (event: MouseEvent<HTMLTableCellElement>) => {
    event.stopPropagation();
  };

  return (
    <tr
      className={`${item.deletionMark ? "row-deleted" : ""} ${active ? "row-active" : ""}`}
      onClick={() => onOpen(item.ref)}
      onContextMenu={handleRowContextMenu}
    >
      <td>
        <DocCellView item={item} onCopied={onCopied} onOpenMenu={onOpenMenu} />
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
        <RowContextMenu ref={menuRef} item={item} onCopied={onCopied} onOpenMenu={onOpenMenu} />
      </td>
    </tr>
  );
}
