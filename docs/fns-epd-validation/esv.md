# ЭСВ

## XSD в конфигурации БП

- `{'schema': 'СхемаТитулГрузоотправителя', 'elementCount': 25, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулГрузополучателя', 'elementCount': 22, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулПеревозчика', 'elementCount': 75, 'requiredCount': 0, 'requiredTop': []}`

## Проверки в EDO Adiutor (v0.8.45+)

| Уровень | Примеры |
|---------|---------|
| error | ИНН 10/12 цифр |
| warn | КПП, пустой ID ЭДО, пометка удаления |
| external | поля с «адрес» — кнопка «Проверить адрес» |
| ok | заполненные поля без замечаний |

Каталог правил: `rules/field-rules.json`, `rules/shared-checks.json`.
