# Сборка EdoAdiutor.epf из исходников EDT через v8unpack (без конфигуратора).
param(
    [string]$BaselineEpf = "",
    [string]$OutEpf = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$SrcRoot = Join-Path $ProjectRoot "src\ExternalDataProcessors\ПомощникДляЭДО"
$BinDir = Join-Path $ProjectRoot "bin"
if (-not $OutEpf) {
    $OutEpf = Join-Path $BinDir "EdoAdiutor.epf"
}
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

$V8Exe = ""
$cmdV8 = Get-Command v8unpack -ErrorAction SilentlyContinue
if ($cmdV8) {
    $V8Exe = $cmdV8.Source
}
if (-not $V8Exe) {
    $v8Candidate = Join-Path $env:LOCALAPPDATA "Programs\Python\Python313\Scripts\v8unpack.exe"
    if (Test-Path -LiteralPath $v8Candidate) {
        $V8Exe = $v8Candidate
    } else {
        throw "v8unpack не найден. Установите: py -3 -m pip install v8unpack"
    }
}

function Convert-BinToC1B64([string]$BinPath) {
    $bytes = [System.IO.File]::ReadAllBytes($BinPath)
    $b64 = [Convert]::ToBase64String($bytes)
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append("{1,{#base64:")
    for ($i = 0; $i -lt $b64.Length; $i += 64) {
        $len = [Math]::Min(64, $b64.Length - $i)
        if ($i -gt 0) {
            [void]$sb.Append([Environment]::NewLine)
        }
        [void]$sb.Append($b64.Substring($i, $len))
    }
    [void]$sb.Append("}")
    [void]$sb.Append([Environment]::NewLine)
    [void]$sb.Append("}")
    return $sb.ToString()
}

if (-not $BaselineEpf) {
    $BaselineEpf = Join-Path $env:TEMP "EdoAdiutor.epf"
    if (-not (Test-Path -LiteralPath $BaselineEpf)) {
        gh release download v0.8.27 -p EdoAdiutor.epf -D $env:TEMP --repo Nior21/edo-adiutor --clobber
    }
}
if (-not (Test-Path -LiteralPath $BaselineEpf)) {
    throw "Нет baseline EPF: $BaselineEpf"
}

$Work = Join-Path $env:TEMP "edo-epf-build-$([Guid]::NewGuid().ToString('N').Substring(0,8))"
New-Item -ItemType Directory -Path $Work | Out-Null
try {
    & $V8Exe -E $BaselineEpf $Work | Out-Null

    Copy-Item -LiteralPath (Join-Path $SrcRoot "ObjectModule.bsl") `
        -Destination (Join-Path $Work "ExternalDataProcessor.obj.bsl") -Force

    $formObj = Get-ChildItem -LiteralPath (Join-Path $Work "Form") -Recurse -Filter "Form.obj.bsl" | Select-Object -First 1
    if (-not $formObj) {
        throw "Form.obj.bsl не найден в распакованном EPF"
    }
    Copy-Item -LiteralPath (Join-Path $SrcRoot "Forms\Форма\Module.bsl") -Destination $formObj.FullName -Force

    $tplDir = Get-ChildItem -LiteralPath (Join-Path $Work "Template") -Directory | Select-Object -First 1
    if (-not $tplDir) {
        throw "Каталог Template не найден"
    }
    $binPath = Join-Path $SrcRoot "Templates\ReactПриложение\Template.bin"
    $c1Path = Join-Path $tplDir.FullName "Template.c1b64"
    $c1Text = Convert-BinToC1B64 $binPath
    [System.IO.File]::WriteAllText($c1Path, $c1Text, [System.Text.UTF8Encoding]::new($false))

    if (Test-Path -LiteralPath $OutEpf) {
        Remove-Item -LiteralPath $OutEpf -Force
    }
    & $V8Exe -B $Work $OutEpf | Out-Null

    $epfCopy = Join-Path $BinDir "ПомощникДляЭДО.epf"
    Copy-Item -LiteralPath $OutEpf -Destination $epfCopy -Force

    $size = (Get-Item -LiteralPath $OutEpf).Length
    Write-Host "Built: $OutEpf ($size bytes)"
    Write-Host "Copy:  $epfCopy"
} finally {
    Remove-Item -LiteralPath $Work -Recurse -Force -ErrorAction SilentlyContinue
}
