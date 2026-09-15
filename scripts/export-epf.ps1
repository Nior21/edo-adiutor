# Выгрузка EdoAdiutor.epf после pack.ps1 (нужна платформа 1С + доступ к ИБ).
$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Bin = Join-Path $ProjectRoot "bin"
$Out = Join-Path $Bin "EdoAdiutor.epf"
Write-Host "1) .\scripts\pack.ps1"
Write-Host "2) EDT: F7 — обновить конфигурацию из проекта в вашей ИБ"
Write-Host "3) Конфигуратор: Внешние обработки -> ПомощникДляЭДО -> Сохранить как -> $Out"
Write-Host "4) gh release create vX.Y.Z `"$Out`" ..."
