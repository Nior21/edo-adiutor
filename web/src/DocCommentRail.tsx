import { commentTextForDisplay, hasCommentWorkTag } from "./commentDisplay";

type DocCommentRailProps = {
  comment: string;
};

export function DocCommentRail({ comment }: DocCommentRailProps) {
  const displayText = commentTextForDisplay(comment);
  if (!displayText) {
    return null;
  }

  const workTag = hasCommentWorkTag(comment);

  return (
    <div
      className={`doc-comment-hover-zone${workTag ? " doc-comment-hover-zone-alert" : ""}`}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <span className="doc-comment-wedge" aria-hidden="true" />
      <div className="doc-comment-flyout" role="note">
        <div className="doc-comment-flyout-inner">{displayText}</div>
      </div>
    </div>
  );
}
