# Релиз EDO Adiutor (обязательный финал задачи)

1. SemVer в `ObjectModule.bsl` → `scripts/pack.ps1` → `scripts/build-epf-v8unpack.ps1`.
2. `scripts/prepare-release.ps1 -RepoBaseUrl "https://github.com/Nior21/edo-adiutor" -Notes "…"`.
3. `git commit` + `git push origin master`.
4. `gh release create vX.Y.Z bin/EdoAdiutor.epf --title "vX.Y.Z" --notes "…"`.

Обновления на сервере пользователя — **только** с GitHub Releases. Агент выполняет шаги 1–4 сам, без напоминаний.

EPF в git не коммитится (`.gitignore`); артефакт релиза — вложение GitHub Release.
