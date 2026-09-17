# ЭТрН (ETRN)

## XSD в конфигурации БП

- `{'schema': 'СхемаТитулГрузоотправителя', 'elementCount': 108, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулГрузоотправителяФХЖ', 'elementCount': 20, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулГрузополучателя', 'elementCount': 34, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулПереадресовка', 'elementCount': 44, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулПеревозчикаВыдача', 'elementCount': 22, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулПеревозчикаЗамены', 'elementCount': 36, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулПеревозчикаПриемка', 'elementCount': 22, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулПеревозчикаФХЖ', 'elementCount': 23, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулУказаниеПереадрес', 'elementCount': 70, 'requiredCount': 0, 'requiredTop': []}`

## Проверки в EDO Adiutor (v0.8.45+)

| Уровень | Примеры |
|---------|---------|
| error | ИНН 10/12 цифр |
| warn | КПП, пустой ID ЭДО, пометка удаления |
| external | поля с «адрес» — кнопка «Проверить адрес» |
| ok | заполненные поля без замечаний |

Каталог правил: `rules/field-rules.json`, `rules/shared-checks.json`.
