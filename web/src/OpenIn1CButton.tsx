import type { MouseEvent } from "react";
import { openDocument } from "./bridge";

type OpenIn1CButtonProps = {
  refId: string;
  docType: string;
};

export function OpenIn1CButton({ refId, docType }: OpenIn1CButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    openDocument(refId, docType);
  };

  return (
    <button type="button" className="btn-open-1c" onClick={handleClick} title="Открыть документ в 1С">
      1С
    </button>
  );
}
