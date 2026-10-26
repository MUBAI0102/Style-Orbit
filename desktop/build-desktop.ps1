param(
  [string]$Runtime = "runtime",
  [string]$Out = "dist\STYLE-ORBIT",
  [switch]$SkipZip
)

$ErrorActionPreference = "Stop"
$desktop = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $desktop
$app = Join-Path $desktop "app"
$outPath = Join-Path $desktop $Out
$runtimePath = Join-Path $desktop $Runtime
$uiPath = Join-Path $app "ui"

if (-not (Test-Path (Join-Path $runtimePath "electron.exe"))) {
  throw "Electron runtime not found at $runtimePath\electron.exe"
}
foreach ($file in @("index.html", "styles.css", "app.bundle.js")) {
  if (-not (Test-Path (Join-Path $root $file))) {
    throw "Missing built web file: $file"
  }
}

Write-Host "Preparing UI..."
if (Test-Path $uiPath) { Remove-Item $uiPath -Recurse -Force }
New-Item -ItemType Directory -Force -Path $uiPath | Out-Null
Copy-Item (Join-Path $root "index.html") $uiPath
Copy-Item (Join-Path $root "styles.css") $uiPath
Copy-Item (Join-Path $root "app.bundle.js") $uiPath

Write-Host "Copying Electron runtime..."
if (Test-Path $outPath) { Remove-Item $outPath -Recurse -Force }
New-Item -ItemType Directory -Force -Path $outPath | Out-Null
$runtimeOut = Join-Path $outPath "runtime"
New-Item -ItemType Directory -Force -Path $runtimeOut | Out-Null
Copy-Item (Join-Path $runtimePath "*") $runtimeOut -Recurse -Force
$exe = Join-Path $runtimeOut "electron.exe"
if (-not (Test-Path $exe)) { throw "Runtime copy did not produce electron.exe" }
Rename-Item $exe "STYLE-ORBIT-core.exe"
if (-not (Test-Path (Join-Path $app "launcher.exe"))) {
  throw "Missing launcher.exe. Compile Launcher.cs with csc first."
}
Copy-Item (Join-Path $app "launcher.exe") (Join-Path $outPath "STYLE-ORBIT.exe")

Write-Host "Installing app package..."
$resourcesApp = Join-Path $runtimeOut "resources\app"
if (Test-Path $resourcesApp) { Remove-Item $resourcesApp -Recurse -Force }
New-Item -ItemType Directory -Force -Path $resourcesApp | Out-Null
Copy-Item (Join-Path $app "package.json") $resourcesApp
Copy-Item (Join-Path $app "main.js") $resourcesApp
Copy-Item (Join-Path $app "preload.js") $resourcesApp
Copy-Item (Join-Path $app "icon.png") $resourcesApp
Copy-Item (Join-Path $app "icon.ico") $resourcesApp
Copy-Item (Join-Path $app "Launcher.cs") $resourcesApp
Copy-Item (Join-Path $app "Diagnose-Start.cmd") $resourcesApp
Copy-Item $uiPath (Join-Path $resourcesApp "ui") -Recurse
Copy-Item (Join-Path $app "Diagnose-Start.cmd") (Join-Path $outPath "Diagnose-Start.cmd")
Copy-Item (Join-Path $root "THIRD_PARTY_NOTICES.md") (Join-Path $outPath "THIRD_PARTY_NOTICES.md")
Copy-Item (Join-Path $app "README.txt") (Join-Path $outPath "README.txt")

Write-Host "Desktop folder ready: $outPath"

if (-not $SkipZip) {
  $zipPath = Join-Path $desktop "dist\STYLE-ORBIT-windows-x64.zip"
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  Write-Host "Compressing portable archive..."
  Compress-Archive -Path $outPath -DestinationPath $zipPath -CompressionLevel Optimal -Force
  Write-Host "Archive ready: $zipPath"
}
