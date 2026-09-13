# Build React IIFE and pack inline HTML for 1C template (Infostart 2411240).
$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ObjectModule = Join-Path $ProjectRoot "src\ExternalDataProcessors\ПомощникДляЭДО\ObjectModule.bsl"
$UiVersion = "0.0.0-dev"
if (Test-Path -LiteralPath $ObjectModule) {
    $omText = Get-Content -LiteralPath $ObjectModule -Raw -Encoding UTF8
    if ($omText -match '(?s)Функция\s+ВерсияПриложения\(\)[\s\S]*?Возврат\s+"(\d+\.\d+\.\d+)"') {
        $UiVersion = $Matches[1]
    }
}
Write-Host "==> UI bundle version (from ObjectModule): $UiVersion"
$WebDir = Join-Path $ProjectRoot "web"
$DistDir = Join-Path $WebDir "dist"
$ShellPath = Join-Path $WebDir "shell.html"

$TemplateDir = Get-ChildItem -Path $ProjectRoot -Recurse -Directory -Filter "React*" |
    Where-Object { $_.Name -like "React*" } |
    Select-Object -First 1

if (-not $TemplateDir) {
    throw "Template folder React* not found under $ProjectRoot"
}

$TemplateBin = Join-Path $TemplateDir.FullName "Template.bin"

Write-Host "==> npm install ($WebDir)"
Push-Location $WebDir
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

Write-Host "==> npm run build (IIFE inline)"
$env:EDO_UI_VERSION = $UiVersion
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
Pop-Location

$AppJs = Join-Path $DistDir "app.js"
if (-not (Test-Path $AppJs)) {
    throw "Build output not found: $AppJs"
}

$CssFile = Get-ChildItem -Path $DistDir -Filter "app*.css" | Select-Object -First 1
if (-not $CssFile) {
    throw "CSS bundle not found in dist"
}

if (-not (Test-Path $ShellPath)) {
    throw "shell.html not found: $ShellPath"
}

$JsText = [System.IO.File]::ReadAllText($AppJs, [System.Text.Encoding]::UTF8)
$CssText = [System.IO.File]::ReadAllText($CssFile.FullName, [System.Text.Encoding]::UTF8)
$HtmlTemplate = [System.IO.File]::ReadAllText($ShellPath, [System.Text.Encoding]::UTF8)

$JsText = $JsText -replace '(?i)</script>', '<\/script>'

$Html = $HtmlTemplate.Replace("{{INLINE_CSS}}", $CssText).Replace("{{INLINE_JS}}", $JsText)

if ($Html -match '(?i)type\s*=\s*["'']module["'']') {
    throw "Build produced type=module; 1C WebKit will not run it"
}

Write-Host "==> write inline HTML -> $TemplateBin"
New-Item -ItemType Directory -Force -Path $TemplateDir.FullName | Out-Null
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($TemplateBin, $Html, $Utf8NoBom)

$binSize = (Get-Item -LiteralPath $TemplateBin).Length
Write-Host "Done: $TemplateBin ($binSize bytes)"
Write-Host "Update EDT config (F7) and reopen the processor from the updated infobase."
