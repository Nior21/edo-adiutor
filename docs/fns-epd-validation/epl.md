# ЭПЛ

## XSD в конфигурации БП

- `{'schema': 'СхемаТитулВыезд', 'elementCount': 15, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулВыпуск', 'elementCount': 15, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулЗаезд', 'elementCount': 14, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулМедосмотр', 'elementCount': 19, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулМедосмотрПосле', 'elementCount': 19, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулОформление', 'elementCount': 58, 'requiredCount': 0, 'requiredTop': []}`

## Проверки в EDO Adiutor (v0.8.45+)

| Уровень | Примеры |
|---------|---------|
| error | ИНН 10/12 цифр |
| warn | КПП, пустой ID ЭДО, пометка удаления |
| external | поля с «адрес» — кнопка «Проверить адрес» |
| ok | заполненные поля без замечаний |

Каталог правил: `rules/field-rules.json`, `rules/shared-checks.json`.
