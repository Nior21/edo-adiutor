import type { Toast } from "./useToast";

type StatusBarProps = {
  toast: Toast | null;
  hint: string;
};

export function StatusBar({ toast, hint }: StatusBarProps) {
  const isError = toast?.kind === "error";

  return (
    <footer className={`status-bar ${toast ? "status-bar-active" : "status-bar-hint"}`} role="status">
      {toast ? (
        <span className={`status-bar-message ${isError ? "status-bar-error" : "status-bar-info"}`}>
          {toast.message}
        </span>
      ) : (
        <span className="status-bar-message status-bar-hint-text">{hint}</span>
      )}
    </footer>
  );
}
