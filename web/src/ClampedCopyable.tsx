import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { Copyable, type CopyableMenuItem } from "./Copyable";
import type { FloatingMenuItem } from "./FloatingMenu";

const DEFAULT_LINES = 2;

type ClampedCopyableProps = {
  value: string;
  mono?: boolean;
  lines?: number;
  onCopied?: (value: string) => void;
  extraMenuItems?: CopyableMenuItem[];
  onOpenMenu?: (x: number, y: number, items: FloatingMenuItem[]) => void;
};

/** Длинные значения: line-clamp; «…» разворачивает, клик по тексту — копирование. */
export function ClampedCopyable({
  value,
  mono = false,
  lines = DEFAULT_LINES,
  onCopied,
  extraMenuItems,
  onOpenMenu,
}: ClampedCopyableProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    if (expanded || !value) {
      setOverflows(false);
      return;
    }
    const el = valueRef.current;
    if (!el) {
      return;
    }
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [value, expanded, lines]);

  const handleExpand = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setExpanded(true);
  };

  if (!value) {
    return (
      <Copyable
        value=""
        mono={mono}
        onCopied={onCopied}
        extraMenuItems={extraMenuItems}
        onOpenMenu={onOpenMenu}
      />
    );
  }

  return (
    <span className={`clamped-copyable ${expanded ? "clamped-copyable-expanded" : ""}`.trim()}>
      <Copyable
        value={value}
        mono={mono}
        onCopied={onCopied}
        extraMenuItems={extraMenuItems}
        onOpenMenu={onOpenMenu}
        className="clamped-copyable-inner"
      >
        <span
          ref={valueRef}
          className="copyable-value clamped-copyable-value"
          style={
            expanded
              ? undefined
              : {
                  WebkitLineClamp: lines,
                }
          }
        >
          {value}
        </span>
      </Copyable>
      {!expanded && overflows ? (
        <button type="button" className="clamped-copyable-more" onClick={handleExpand} title="Показать полностью">
          …
        </button>
      ) : null}
      {expanded ? (
        <button
          type="button"
          className="clamped-copyable-collapse"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setExpanded(false);
          }}
        >
          свернуть
        </button>
      ) : null}
    </span>
  );
}
