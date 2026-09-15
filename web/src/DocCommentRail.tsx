import { commentTextForDisplay } from "./commentDisplay";

type DocCommentRailProps = {
  comment: unknown;
};

/** Клин слева + выезжающая плашка (SVG — без clip-path для WebKit 1С). */
export function DocCommentRail({ comment }: DocCommentRailProps) {
  const displayText = commentTextForDisplay(comment);

  return (
    <div
      className="doc-comment-hover-zone"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <svg className="doc-comment-shape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon className="doc-comment-shape-fill" points="0,0 0,100 16,50 84,100 100,50 84,0 16,50" />
      </svg>
      <div className="doc-comment-flyout" role="note">
        <div className="doc-comment-flyout-inner">{displayText}</div>
      </div>
    </div>
  );
}
