<#
    Manages the local Gitea instance used as the application under test.

    Usage:
        powershell -ExecutionPolicy Bypass -File scripts/gitea.ps1 setup
        powershell -ExecutionPolicy Bypass -File scripts/gitea.ps1 start
        powershell -ExecutionPolicy Bypass -File scripts/gitea.ps1 status
        powershell -ExecutionPolicy Bypass -File scripts/gitea.ps1 stop
        powershell -ExecutionPolicy Bypass -File scripts/gitea.ps1 reset   # wipes all data

    Or via npm: npm run gitea:setup | gitea:start | gitea:status | gitea:stop

    The instance lives OUTSIDE the repo (default: ~/.gitea-aut) so that test
    data never pollutes git, and so the path contains no spaces or parentheses
    (several CLI tools mishandle those on Windows). Override with $env:GITEA_HOME.
#>

param([Parameter(Position = 0)][string]$Command = 'status')

$ErrorActionPreference = 'Stop'

$Version = '28.3.0'
$Port = 3000
$BaseUrl = "http://localhost:$Port"
$AdminUser = 'qaadmin'
$AdminPassword = 'QaAdmin#2026'
$AdminEmail = 'qaadmin@example.com'

$GiteaHome = $env:GITEA_HOME
if ([string]::IsNullOrWhiteSpace($GiteaHome)) { $GiteaHome = Join-Path $HOME '.gitea-aut' }
$Exe = Join-Path $GiteaHome 'gitea.exe'
$Ini = Join-Path $GiteaHome 'custom\conf\app.ini'
$HomeFwd = $GiteaHome.Replace('\', '/')

function Test-GiteaUp {
    try {
        $r = Invoke-WebRequest -Uri "$BaseUrl/api/v1/version" -TimeoutSec 3 -UseBasicParsing
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

function Invoke-Setup {
    Write-Host "Setting up Gitea $Version in $GiteaHome" -ForegroundColor Cyan

    foreach ($d in @($GiteaHome, (Join-Path $GiteaHome 'custom\conf'), (Join-Path $GiteaHome 'data'), (Join-Path $GiteaHome 'log'))) {
        if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
    }

    if (-not (Test-Path $Exe)) {
        $url = "https://dl.gitea.com/gitea/$Version/gitea-$Version-windows-amd64.exe"
        Write-Host "  downloading $url (~123 MB)"
        Invoke-WebRequest -Uri $url -OutFile $Exe -UseBasicParsing

        Write-Host '  verifying sha256'
        $sumFile = "$Exe.sha256"
        Invoke-WebRequest -Uri "$url.sha256" -OutFile $sumFile -UseBasicParsing
        $expected = ((Get-Content $sumFile -Raw).Trim() -split '\s+')[0]
        $actual = (Get-FileHash -Path $Exe -Algorithm SHA256).Hash.ToLower()
        if ($actual -ne $expected.ToLower()) {
            Remove-Item $Exe -Force
            throw "Checksum mismatch. Expected $expected, got $actual. Download deleted."
        }
        Write-Host '  checksum OK' -ForegroundColor Green
    } else {
        Write-Host '  binary already present, skipping download'
    }

    if (-not (Test-Path $Ini)) {
        Write-Host '  generating secrets and writing app.ini'
        $secretKey = & $Exe generate secret SECRET_KEY
        $internalToken = & $Exe generate secret INTERNAL_TOKEN

        $ini = @"
APP_NAME = Gitea AUT (QA Automation Target)
RUN_MODE = prod

[server]
PROTOCOL = http
DOMAIN = localhost
HTTP_PORT = $Port
ROOT_URL = $BaseUrl/
DISABLE_SSH = true
OFFLINE_MODE = true
LFS_START_SERVER = false

[database]
DB_TYPE = sqlite3
PATH = $HomeFwd/data/gitea.db

[repository]
ROOT = $HomeFwd/data/repos
DEFAULT_BRANCH = main

[security]
INSTALL_LOCK = true
SECRET_KEY = $secretKey
INTERNAL_TOKEN = $internalToken
PASSWORD_COMPLEXITY = off
MIN_PASSWORD_LENGTH = 8

[service]
DISABLE_REGISTRATION = false
REQUIRE_SIGNIN_VIEW = false
ENABLE_CAPTCHA = false
REGISTER_EMAIL_CONFIRM = false
ENABLE_NOTIFY_MAIL = false
DEFAULT_ALLOW_CREATE_ORGANIZATION = true
ALLOW_ONLY_EXTERNAL_REGISTRATION = false

[mailer]
ENABLED = false

[cron]
ENABLED = false

[api]
ENABLE_SWAGGER = true

[session]
PROVIDER = file

[log]
MODE = file
LEVEL = info
ROOT_PATH = $HomeFwd/log
"@
        Set-Content -Path $Ini -Value $ini -Encoding utf8
    } else {
        Write-Host '  app.ini already present, keeping it'
    }

    Write-Host '  running migrations'
    & $Exe migrate --work-path $GiteaHome --config $Ini | Out-Null

    Write-Host "  creating admin user '$AdminUser'"
    try {
        & $Exe admin user create --admin --username $AdminUser --password $AdminPassword `
            --email $AdminEmail --must-change-password=false `
            --work-path $GiteaHome --config $Ini | Out-Null
    } catch {
        Write-Host '  admin user already exists, skipping'
    }

    Write-Host "Setup complete. Start it with: npm run gitea:start" -ForegroundColor Green
}

function Invoke-Start {
    if (Test-GiteaUp) { Write-Host "Already running at $BaseUrl" -ForegroundColor Green; return }
    if (-not (Test-Path $Exe)) { throw "Gitea not installed. Run: npm run gitea:setup" }

    Write-Host "Starting Gitea at $BaseUrl"
    Start-Process -FilePath $Exe -ArgumentList @('web', '--work-path', $GiteaHome, '--config', $Ini) `
        -WorkingDirectory $GiteaHome -WindowStyle Hidden

    for ($i = 1; $i -le 60; $i++) {
        Start-Sleep -Seconds 1
        if (Test-GiteaUp) { Write-Host "Up after ${i}s" -ForegroundColor Green; return }
    }
    throw "Gitea did not become ready within 60s. Check $GiteaHome\log\gitea.log"
}

function Invoke-Stop {
    $procs = Get-Process -Name 'gitea' -ErrorAction SilentlyContinue
    if ($null -eq $procs) { Write-Host 'Not running.'; return }
    $procs | Stop-Process -Force
    Write-Host 'Stopped.' -ForegroundColor Green
}

function Invoke-Status {
    if (Test-GiteaUp) {
        $v = (Invoke-WebRequest -Uri "$BaseUrl/api/v1/version" -TimeoutSec 3 -UseBasicParsing).Content
        Write-Host "UP   $BaseUrl  $v" -ForegroundColor Green
        Write-Host "Swagger: $BaseUrl/api/swagger"
    } else {
        Write-Host "DOWN  $BaseUrl" -ForegroundColor Yellow
        Write-Host 'Start it with: npm run gitea:start'
    }
}

function Invoke-Reset {
    Write-Host 'This deletes ALL local Gitea data (users, repos, database).' -ForegroundColor Yellow
    Invoke-Stop
    foreach ($d in @('data', 'log')) {
        $p = Join-Path $GiteaHome $d
        if (Test-Path $p) { Remove-Item $p -Recurse -Force }
    }
    Write-Host 'Data wiped. Run: npm run gitea:setup' -ForegroundColor Green
}

switch ($Command.ToLower()) {
    'setup'  { Invoke-Setup }
    'start'  { Invoke-Start }
    'stop'   { Invoke-Stop }
    'status' { Invoke-Status }
    'reset'  { Invoke-Reset }
    default  { Write-Host "Unknown command '$Command'. Use: setup | start | stop | status | reset" }
}
