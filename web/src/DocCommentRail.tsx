import { commentTextForDisplay } from "./commentDisplay";

type DocCommentRailProps = {
  commentText: string;
  expanded: boolean;
  expandWidthPx: number;
};

const WEDGE_PX = 11;

/** «Шкала загрузки» строки: клин всегда виден; при hover — клин и заливка вместе до ~50% ширины tr. */
export function DocCommentRail({ commentText, expanded, expandWidthPx }: DocCommentRailProps) {
  const widthPx = expanded ? Math.max(WEDGE_PX, expandWidthPx) : WEDGE_PX;

  return (
    <div
      className={`doc-comment-track${expanded ? " is-expanded" : ""}`}
      style={{ width: `${widthPx}px` }}
      aria-hidden={!expanded}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <svg className="doc-comment-wedge-svg" viewBox="0 0 11 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon className="doc-comment-wedge-fill" points="0,0 0,100 11,50" />
      </svg>
      <div className="doc-comment-bar-fill">
        <div className="doc-comment-flyout-inner">{commentText}</div>
      </div>
    </div>
  );
}

export const DOC_COMMENT_WEDGE_PX = WEDGE_PX;
