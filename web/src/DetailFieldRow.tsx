import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ClampedCopyable } from "./ClampedCopyable";
import type { FloatingMenuItem } from "./FloatingMenu";
import { isSimpleDetailFieldKind, type DetailField, type DetailFieldValueKind } from "./types";
import { ComplexFieldEditorStub } from "./ComplexFieldEditorStub";

type DetailFieldRowProps = {
  field: DetailField;
  onCopied: (value: string) => void;
  onOpenMenu: (x: number, y: number, items: FloatingMenuItem[]) => void;
  onSaveField: (field: DetailField, nextValue: string) => Promise<{ ok: boolean; error?: string }>;
};

function emptyDisplay(value: string): boolean {
  return !value || value === "—";
}

export function DetailFieldRow({ field, onCopied, onOpenMenu, onSaveField }: DetailFieldRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(field.value);
  const [saving, setSaving] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [complexOpen, setComplexOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(field.value);
      setInlineError("");
    }
  }, [field.value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  const canEdit = Boolean(field.editable && field.fieldId);
  const kind: DetailFieldValueKind = field.valueKind ?? "readonly";
  const simple = isSimpleDetailFieldKind(kind);
  const validationClass = field.validationLevel ? ` field-validation-${field.validationLevel}` : "";

  const startEdit = useCallback(() => {
    if (!canEdit) {
      return;
    }
    if (simple) {
      setDraft(field.value);
      setInlineError("");
      setEditing(true);
      return;
    }
    setComplexOpen(true);
  }, [canEdit, field.value, simple]);

  const runExternalCheck = () => {
    if (field.externalCheck === "address") {
      window.alert("Проверка адреса через ФИАС/ГАР — заглушка. Будет подключена отдельным релизом.");
    }
  };

  const menuExtras = canEdit
    ? [
        {
          id: "edit-field",
          label: "Изменить",
          onSelect: startEdit,
        },
      ]
    : [];

  const commit = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setInlineError("");
    const result = await onSaveField(field, draft);
    setSaving(false);
    if (result.ok) {
      setEditing(false);
      return;
    }
    setInlineError(result.error || "Не удалось сохранить");
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && kind !== "string") {
      event.preventDefault();
      void commit();
    } else if (event.key === "Enter" && !event.shiftKey && kind === "string") {
      event.preventDefault();
      void commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setEditing(false);
      setDraft(field.value);
      setInlineError("");
    }
  };

  const displayValue = field.value;

  if (editing && simple) {
    const inputClass = `detail-field-input ${inlineError ? "detail-field-input-error" : ""}`;
    return (
      <div className="detail-field-edit-wrap">
        {kind === "boolean" ? (
          <label className="detail-field-bool">
            <select
              value={draft === "Да" ? "1" : draft === "Нет" ? "0" : ""}
              onChange={(event) => setDraft(event.target.value === "1" ? "Да" : "Нет")}
              onKeyDown={handleKeyDown}
              disabled={saving}
            >
              <option value="1">Да</option>
              <option value="0">Нет</option>
            </select>
          </label>
        ) : kind === "string" && draft.length > 120 ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className={inputClass}
            rows={4}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className={inputClass}
            type={kind === "number" ? "text" : kind === "date" ? "datetime-local" : "text"}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
          />
        )}
        <div className="detail-field-edit-actions">
          <button type="button" className="btn btn-sm btn-secondary" disabled={saving} onClick={() => void commit()}>
            {saving ? "Сохранение…" : "Принять"}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            disabled={saving}
            onClick={() => {
              setEditing(false);
              setDraft(field.value);
              setInlineError("");
            }}
          >
            Отмена
          </button>
        </div>
        {inlineError ? <div className="detail-field-inline-error">{inlineError}</div> : null}
      </div>
    );
  }

  const copyable = (
    <ClampedCopyable
      value={displayValue}
      mono
      lines={2}
      onCopied={onCopied}
      extraMenuItems={menuExtras}
      onOpenMenu={onOpenMenu}
    />
  );

  return (
    <>
      {field.externalCheck === "address" ? (
        <button type="button" className="field-external-check-btn" onClick={runExternalCheck}>
          Проверить адрес
        </button>
      ) : null}
      {emptyDisplay(displayValue) && canEdit ? (
        <span
          className="copyable-empty detail-field-empty-editable"
          onContextMenu={(event) => {
            if (!onOpenMenu) {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            onOpenMenu(event.clientX, event.clientY, [
              { id: "edit-empty", label: "Изменить", onSelect: startEdit },
            ]);
          }}
          title="ПКМ — изменить"
        >
          <span className="copyable-value">—</span>
        </span>
      ) : (
        copyable
      )}
      <ComplexFieldEditorStub
        open={complexOpen}
        field={field}
        onClose={() => setComplexOpen(false)}
      />
    </>
  );
}
