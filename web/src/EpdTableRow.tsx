import { useRef, type MouseEvent } from "react";
import { commentTextForDisplay, shouldShowCommentWorkRail } from "./commentDisplay";
import { DocCellView } from "./DocCellView";
import { DocCommentPopover } from "./DocCommentPopover";
import { PartyCellView } from "./PartyCellView";
import { RowContextMenu, type RowContextMenuHandle } from "./RowContextMenu";
import { useDocCommentPopover } from "./useDocCommentPopover";
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

  const showWorkComment = shouldShowCommentWorkRail(item.comment);
  const commentText = commentTextForDisplay(item.comment);
  const { open, openPopover, scheduleClosePopover } = useDocCommentPopover(showWorkComment);

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
    showWorkComment ? "row-has-work-comment" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <tr
        ref={trRef}
        className={rowClass}
        onClick={(event) => onRowClick(item, event)}
        onContextMenu={handleRowContextMenu}
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClosePopover}
      >
        <td className="col-doc-cell">
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
          <RowContextMenu
            ref={menuRef}
            getMenuEntries={() => getMenuEntries(item)}
            onOpenMenu={onOpenMenu}
          />
        </td>
      </tr>
      <DocCommentPopover
        open={open && showWorkComment}
        text={commentText}
        rowRef={trRef}
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClosePopover}
      />
    </>
  );
}

