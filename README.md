# Edo Adiutor

**Edo Adiutor** (*adiutor* — «помощник» по-латыни) — внешняя обработка 1С для просмотра и аудита электронных перевозочных документов (ЭПД): React UI в поле HTML, типовой реестр Бухгалтерии, диагностика ЭДО.

Репозиторий: [github.com/Nior21/edo-adiutor](https://github.com/Nior21/edo-adiutor)

## Обновления

1. В интерфейсе (React) запрашивается [GitHub Releases API](https://docs.github.com/en/rest/releases/releases) для `Nior21/edo-adiutor`.
2. Версия в релизе (тег `vX.Y.Z`) сравнивается с `ВерсияПриложения()` в ObjectModule.
3. Файл `.epf` берётся из **asset** релиза (`EdoAdiutor.epf`).
4. Скачивание и подмена якорного `.epf`, открытие нового окна — на стороне 1С (как раньше). Отдельный JSON-манifest **не обязателен**.

## Сборка

```powershell
cd web
npm install
npm run build
cd ..
.\scripts\pack.ps1
```

Далее F7 в EDT и выгрузка `bin\ПомощникДляЭДО.epf` (или `EdoAdiutor.epf` для GitHub Release).

## Релиз на GitHub

```powershell
.\scripts\pack.ps1
# выгрузить EPF в bin, затем:
Copy-Item bin\ПомощникДляЭДО.epf bin\EdoAdiutor.epf -Force
gh release create v0.7.0 bin\EdoAdiutor.epf --title "v0.7.0" --notes "..."
```

## Лицензия

Коммерческая разработка © Шолохов Иван / ООО «Гранд Проект». Уточняйте условия использования у автора.
