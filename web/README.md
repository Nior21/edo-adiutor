# React UI — Помощник ЭДО

## Сборка и загрузка в макет 1С

Из каталога `ПомощникДляЭДО`:

```powershell
.\scripts\pack.ps1
```

Скрипт:

1. выполняет `npm install` и `npm run build` в `web/`;
2. упаковывает `web/dist/*` в zip;
3. записывает zip в `src/ExternalDataProcessors/ПомощникДляЭДО/Templates/ReactПриложение/Template.bin`.

После этого в EDT: **F7** (обновить конфигурацию) и открыть форму обработки.

## Локальная разработка UI

```powershell
cd web
npm install
npm run dev
```

Мост `onec:` работает только внутри поля HTML 1С; в браузере можно править вёрстку, но API ЭТН — только из формы обработки.

## Протокол моста

JS → 1С (клик по скрытой ссылке):

- `onec:bridge?data=<base64(JSON)>`

Команды JSON:

- `{ "action": "getList" }`
- `{ "action": "getDocument", "ref": "<uuid>" }`
- `{ "action": "saveComment", "ref": "<uuid>", "comment": "..." }`

1С → JS (`window.edoApp`):

- `init(json)` — список документов
- `setDocument(json)` — один документ
- `setStatus(text)` / `setError(text)`
