# -*- coding: utf-8 -*-
"""Extract XSD element inventory from BP EPD templates → docs/fns-epd-validation/rules."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BP_DOCS = ROOT / "БП" / "src" / "Documents"
OUT = Path(__file__).resolve().parents[1] / "docs" / "fns-epd-validation" / "rules"

DOC_MAP = {
    "ЭлектроннаяТранспортнаяНакладная": "ETRN",
    "ЭлектронныйЗаказЗаявка": "EZZ",
    "ЭлектронныйЗаказНаряд": "EZN",
    "ЭлектронныйПутевойЛист": "EPL",
    "ЭлектроннаяСопроводительнаяВедомость": "ESV",
    "ЭлектронныйДоговорФрахтования": "EDF",
}


def parse_xsd_elements(text: str) -> list[dict]:
    items: list[dict] = []
    for m in re.finditer(
        r'<xs:element\s+name="([^"]+)"([^>]*)(?:/\>|>(?:\s*<|\s*$))',
        text,
        re.MULTILINE,
    ):
        name = m.group(1)
        attrs = m.group(2)
        min_occ = "0"
        max_occ = "1"
        mm = re.search(r'minOccurs="(\d+)"', attrs)
        if mm:
            min_occ = mm.group(1)
        mm = re.search(r'maxOccurs="([^"]+)"', attrs)
        if mm:
            max_occ = mm.group(1)
        doc_m = re.search(
            rf'<xs:element\s+name="{re.escape(name)}"[\s\S]*?<xs:documentation>([^<]+)</xs:documentation>',
            text,
        )
        doc = doc_m.group(1).strip() if doc_m else ""
        items.append(
            {
                "name": name,
                "minOccurs": min_occ,
                "required": min_occ not in ("0", ""),
                "maxOccurs": max_occ,
                "documentation": doc,
            }
        )
    return items


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    summary = []
    for folder, code in DOC_MAP.items():
        doc_path = BP_DOCS / folder
        if not doc_path.is_dir():
            continue
        templates = doc_path / "Templates"
        xsd_files = list(templates.glob("Схема*/Template.txt")) if templates.is_dir() else []
        inv = {"docType": code, "doc1c": folder, "schemas": []}
        for xsd in sorted(xsd_files):
            try:
                raw = xsd.read_text(encoding="windows-1251")
            except UnicodeDecodeError:
                raw = xsd.read_text(encoding="utf-8", errors="replace")
            elements = parse_xsd_elements(raw)
            required = [e for e in elements if e["required"]]
            inv["schemas"].append(
                {
                    "schema": xsd.parent.name,
                    "elementCount": len(elements),
                    "requiredCount": len(required),
                    "requiredTop": required[:40],
                }
            )
        out_file = OUT / f"{code.lower()}-xsd-inventory.json"
        out_file.write_text(json.dumps(inv, ensure_ascii=False, indent=2), encoding="utf-8")
        summary.append({"code": code, "schemas": len(inv["schemas"]), "file": out_file.name})
    (OUT / "inventory-index.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
