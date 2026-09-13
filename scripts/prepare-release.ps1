# Сборка React, подготовка bin/update-manifest.json и каталога releases/{version}.
# EPF выгружайте из EDT в bin (или укажите -EpfPath).
param(
    [string]$Version = "",
    [string]$EpfPath = "",
    [string]$RepoBaseUrl = "",
    [string]$Notes = "",
    [switch]$SkipPack
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BinDir = Join-Path $ProjectRoot "bin"
$ObjectModule = Join-Path $ProjectRoot "src\ExternalDataProcessors\ПомощникДляЭДО\ObjectModule.bsl"

if (-not $SkipPack) {
    & (Join-Path $PSScriptRoot "pack.ps1")
}

if (-not (Test-Path $ObjectModule)) {
    throw "ObjectModule not found: $ObjectModule"
}

$omText = Get-Content -LiteralPath $ObjectModule -Raw -Encoding UTF8
if ($Version -match '^\d+\.\d+\.\d+$') {
    # ok
} elseif ($omText -match 'Возврат\s+"(\d+\.\d+\.\d+)"') {
    $Version = $Matches[1]
} else {
    throw "Укажите -Version x.y.z или задайте ВерсияПриложения() в ObjectModule.bsl"
}

$EpfName = "ПомощникДляЭДО.epf"
if ($omText -match 'ИмяФайлаEPF\(\)[\s\S]*?Возврат\s+"([^"]+)"') {
    $EpfName = $Matches[1]
}

if (-not $EpfPath) {
    $EpfPath = Join-Path $BinDir $EpfName
}

if (-not (Test-Path -LiteralPath $EpfPath)) {
    Write-Warning "EPF не найден: $EpfPath — выгрузите из EDT в bin и повторите с -EpfPath."
}

$ReleaseDir = Join-Path $BinDir "releases\$Version"
New-Item -ItemType Directory -Force -Path $ReleaseDir | Out-Null

if (Test-Path -LiteralPath $EpfPath) {
    Copy-Item -LiteralPath $EpfPath -Destination (Join-Path $ReleaseDir $EpfName) -Force
    Copy-Item -LiteralPath $EpfPath -Destination (Join-Path $BinDir $EpfName) -Force
}

if (-not $Notes) {
    $Notes = "Релиз v$Version"
}

$epfUrl = ""
if ($RepoBaseUrl) {
    $base = $RepoBaseUrl.TrimEnd("/")
    $epfUrl = "$base/releases/$Version/$EpfName"
    $manifestUrl = "$base/update-manifest.json"
} else {
    Write-Host "RepoBaseUrl не задан — epfUrl в манифесте оставьте пустым или заполните вручную для GitHub raw."
    $manifestUrl = "(raw.githubusercontent.com/.../bin/update-manifest.json)"
}

if ($epfUrl) {
    $manifest = [ordered]@{
        version = $Version
        epfUrl  = $epfUrl
        notes   = $Notes
    }
} else {
    $manifest = [ordered]@{
        version = $Version
        epfUrl  = "https://example.com/dist/$EpfName"
        notes   = $Notes
    }
}

$manifestPath = Join-Path $BinDir "update-manifest.json"
$manifest | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding UTF8

$releaseManifestPath = Join-Path $ReleaseDir "manifest.json"
$manifest | ConvertTo-Json | Set-Content -LiteralPath $releaseManifestPath -Encoding UTF8

Write-Host "Version: $Version"
Write-Host "Manifest: $manifestPath"
Write-Host "Release:  $ReleaseDir"
if ($manifestUrl) {
    Write-Host "URL для ObjectModule.URLМанифестаОбновлений(): $manifestUrl"
}
