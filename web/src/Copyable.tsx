import { useState } from "react";
import type { MouseEvent } from "react";
import { copyToClipboard } from "./copy";

type CopyableProps = {
  value: string;
  label?: string;
  mono?: boolean;
  className?: string;
  children?: React.ReactNode;
  onCopied?: (value: string) => void;
};

export function Copyable({
  value,
  label,
  mono = false,
  className = "",
  children,
  onCopied,
}: CopyableProps) {
  const [copied, setCopied] = useState(false);
  const display = value || "—";

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!value) {
      return;
    }
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      onCopied?.(value);
      window.setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <button
      type="button"
      className={`copyable ${mono ? "copyable-mono" : ""} ${copied ? "copyable-copied" : ""} ${className}`.trim()}
      onClick={handleClick}
      title={value ? "Нажмите, чтобы скопировать" : undefined}
      disabled={!value}
    >
      {label ? <span className="copyable-label">{label}</span> : null}
      <span className="copyable-value">{children ?? display}</span>
      {copied ? <span className="copyable-hint">скопировано</span> : null}
    </button>
  );
}
