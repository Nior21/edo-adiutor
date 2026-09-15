import { commentTextForDisplay } from "./commentDisplay";

type DocCommentRailProps = {
  comment: unknown;
};

/** Слева клин на всю высоту ячейки; при hover — «конверт»: клин + прямоугольник (~половина колонки). */
export function DocCommentRail({ comment }: DocCommentRailProps) {
  const displayText = commentTextForDisplay(comment);

  return (
    <div
      className="doc-comment-hover-zone"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="doc-comment-envelope">
        <svg className="doc-comment-wedge-svg" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon className="doc-comment-wedge-fill" points="0,0 0,100 10,50" />
        </svg>
        <div className="doc-comment-panel">
          <div className="doc-comment-flyout-inner">{displayText}</div>
        </div>
      </div>
    </div>
  );
}
