# ЭЗН

## XSD в конфигурации БП

- `{'schema': 'СхемаТитулФрахтователя', 'elementCount': 57, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулФрахтователяПодача', 'elementCount': 20, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулФрахтовщика', 'elementCount': 41, 'requiredCount': 0, 'requiredTop': []}`
- `{'schema': 'СхемаТитулФрахтовщикаВозврат', 'elementCount': 25, 'requiredCount': 0, 'requiredTop': []}`

## Проверки в EDO Adiutor (v0.8.45+)

| Уровень | Примеры |
|---------|---------|
| error | ИНН 10/12 цифр |
| warn | КПП, пустой ID ЭДО, пометка удаления |
| external | поля с «адрес» — кнопка «Проверить адрес» |
| ok | заполненные поля без замечаний |

Каталог правил: `rules/field-rules.json`, `rules/shared-checks.json`.
