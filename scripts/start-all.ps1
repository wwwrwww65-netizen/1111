Param()

$ErrorActionPreference = 'Stop'

$repo = 'C:\Users\lenovo\Desktop\تصاميم الصفحات\jeeet\1111'

function Start-SshTunnel {
  try {
    $existing = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'ssh' -and $_.CommandLine -match '55432:127.0.0.1:5432' }
    if (-not $existing) {
      $key = Join-Path $env:USERPROFILE '.ssh\id_mweb'
      Start-Process ssh -ArgumentList @(
        '-o','StrictHostKeyChecking=accept-new',
        '-o','ServerAliveInterval=60',
        '-o','ServerAliveCountMax=3',
        '-o','ExitOnForwardFailure=yes',
        '-o','IdentitiesOnly=yes',
        '-i', $key,
        '-N','-L','55432:127.0.0.1:5432','root@72.60.191.144'
      ) -WindowStyle Hidden | Out-Null
    }
  } catch {}
}

function Start-ApiDev {
  $env:NODE_ENV = 'development'
  $env:DATABASE_URL = 'postgresql://jeeey:Abc1234567890XYZ@127.0.0.1:55432/jeeey?schema=public'
  $env:DIRECT_URL   = 'postgresql://jeeey:Abc1234567890XYZ@127.0.0.1:55432/jeeey'
  $env:CORS_ALLOW_ORIGINS = 'http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost:3001'
  Start-Process pnpm -WorkingDirectory (Join-Path $repo 'packages\api') -ArgumentList 'dev' -WindowStyle Hidden | Out-Null
}

function Start-MwebDev {
  Start-Process pnpm -WorkingDirectory (Join-Path $repo 'apps\mweb') -ArgumentList 'dev' -WindowStyle Hidden | Out-Null
}

function Start-WebDev {
  Start-Process pnpm -WorkingDirectory (Join-Path $repo 'apps\web') -ArgumentList @('dev','-p','3001') -WindowStyle Hidden | Out-Null
}

function Probe($url) {
  try {
    (Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -Uri $url).StatusCode
  } catch {
    $_.Exception.Message
  }
}

Write-Host 'Starting SSH tunnel...'
Start-SshTunnel
Start-Sleep -Seconds 1

Write-Host 'Starting API dev server...'
Start-ApiDev

Write-Host 'Starting mweb dev server...'
Start-MwebDev

Write-Host 'Starting web dev server...'
Start-WebDev

Start-Sleep -Seconds 4

Write-Host 'Health checks:'
Write-Host ('API        : ' + (Probe 'http://localhost:4000/health'))
Write-Host ('mweb       : ' + (Probe 'http://localhost:5173/'))
Write-Host ('web        : ' + (Probe 'http://localhost:3001/'))
Write-Host ('admin (3000 already running if started)')


