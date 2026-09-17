# Релиз EDO Adiutor (обязательный финал задачи)

1. SemVer в `ObjectModule.bsl` → `scripts/pack.ps1` → `scripts/build-epf-v8unpack.ps1`.
2. `scripts/prepare-release.ps1 -RepoBaseUrl "https://github.com/Nior21/edo-adiutor" -Notes "…"`.
3. `git commit` + `git push origin master`.
4. `gh release create vX.Y.Z` с `.epf` из `bin/` или `bin/releases/X.Y.Z/`.

Обновления у пользователей идут с GitHub Releases; без release задача не считается выполненной.
