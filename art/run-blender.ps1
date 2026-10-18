# Runs an art/ build script in headless Blender and waits for it to finish.
#   powershell -File art/run-blender.ps1 art/build_tharun.py [preview dir]
# Uses the Microsoft Store app alias if BLENDER_PATH isn't set.
param(
  [Parameter(Mandatory = $true)][string]$Script,
  [string]$PreviewDir = "",
  [int]$TimeoutSec = 600
)

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$blender = $env:BLENDER_PATH
if (-not $blender) {
  $blender = Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps\BlenderFoundation.Blender_ppwjx1n5r4v9t\blender-launcher.exe"
}
if (-not $PreviewDir) { $PreviewDir = Join-Path $root "art\previews" }
New-Item -ItemType Directory -Force $PreviewDir | Out-Null
$log = Join-Path $PreviewDir "build.log"
Remove-Item $log -ErrorAction SilentlyContinue

$scriptPath = (Resolve-Path $Script).Path
$argsList = @("--background", "--factory-startup", "--python", "`"$scriptPath`"", "--", "`"$root`"", "`"$PreviewDir`"")
Start-Process -FilePath $blender -ArgumentList $argsList -WindowStyle Hidden | Out-Null

$start = Get-Date
while ($true) {
  Start-Sleep -Seconds 2
  if (Test-Path $log) {
    $text = Get-Content $log -Raw
    if ($text -match "(?m)^done$" -or $text -match "FAILED") { break }
  }
  if (((Get-Date) - $start).TotalSeconds -gt $TimeoutSec) { Write-Output "TIMEOUT"; break }
}
if (Test-Path $log) { Get-Content $log }
