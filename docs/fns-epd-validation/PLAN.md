# План: валидация ЭПД (ФНС + UI)

**Единый трекер.** Cursor-todo дублирует этот файл; при расхождении правим оба.

## Фазы

| ID | Задача | Артеfact | Критерий готовности |
|----|--------|----------|---------------------|
| P0 | План и todo | `PLAN.md`, Cursor todos | ✅ |
| P1 | Инвентарь типов 1С + XSD | `document-types.md`, `rules/*-inventory.json` | 6 типов документов, ссылки на XSD в БП |
| P2 | Нормативные таблицы (человек) | `etrn.md`, `ezz.md`, … | Таблицы полей + уровень error/warn/external |
| P3 | Машиночитаемые правила | `rules/field-rules.json`, `shared-checks.json` | id, match, check, message |
| P4 | Движок BSL | `Module.bsl` область `ВалидацияЭПД` | `validationIssues`, `validationSummary` в JSON документа/строки |
| P5 | UI список | `DocCellView`, `PartyCellView` | Бейджи ошибка/спорно; tooltip |
| P6 | UI карточка | `DetailFieldRow` | Классы поля, кнопка external-check |
| P7 | Синхрон TS (опционально) | `web/src/validation/*` | Те же правила для мгновенного UI после enrich |
| P8 | Релиз | v0.8.45+ EPF | GitHub Release |

## Порядок выполнения (текущий прогон)

1. [x] P0  
2. [ ] P1 — скрипт `scripts/extract_epd_rules.py`  
3. [ ] P2 — расширить etrn/ezz (остальные — каркас + inventory)  
4. [ ] P3 — `field-rules.json` v1  
5. [ ] P4 — BSL  
6. [ ] P5–P6 — React  
7. [ ] P7 — импорт JSON в Vite  
8. [ ] P8 — релиз  

## Модель данных (JSON)

```json
{
  "validationIssues": [
    {
      "id": "shipper.inn.invalid",
      "level": "error",
      "message": "ИНН грузоотправителя: неверная длина или символы",
      "fieldId": "",
      "fieldLabel": "ИНН",
      "externalCheck": ""
    }
  ],
  "validationSummary": { "errorCount": 1, "warnCount": 0, "externalCount": 0, "ok": false }
}
```

Поле карточки: `validationLevel`: `error` | `warn` | `ok` | `external`.

## Источники XSD (БП 3.0 в монорепо)

- `БП/src/Documents/ЭлектроннаяТранспортнаяНакладная/Templates/СхемаТитул*/Template.txt`
- Аналоги для ЭЗЗ, ЭЗН, ЭПЛ, ЭСВ, ЭДФ

Полный schematron из XSD в код **не** переносим — только выбранные проверки v1 + inventory для P2.
