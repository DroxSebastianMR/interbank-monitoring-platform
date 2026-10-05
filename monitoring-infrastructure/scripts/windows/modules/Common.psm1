Set-StrictMode -Version Latest
$script:SetupStepNumber = 0

function Test-IsAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]::new($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Start-SetupTranscript {
  $logDirectory = Join-Path $env:LOCALAPPDATA 'InterbankMonitoring\logs'
  New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
  $logPath = Join-Path $logDirectory ('setup-{0}.log' -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
  Start-Transcript -Path $logPath -Force | Out-Null
  return $logPath
}

function Stop-SetupTranscript {
  try { Stop-Transcript | Out-Null } catch { }
}

function Write-SetupBanner {
  Write-Host ''
  Write-Host '+------------------------------------------------------------------------------------------+' -ForegroundColor Cyan
  Write-Host '|                     INTERBANK MONITORING - CONFIGURACION                                 |' -ForegroundColor Cyan
  Write-Host '+------------------------------------------------------------------------------------------+' -ForegroundColor Cyan
}

function Write-SetupStep([string]$Message) {
  $script:SetupStepNumber++
  Write-Host ''
  Write-Host ('  [{0:00}] {1}' -f $script:SetupStepNumber, $Message) -ForegroundColor Cyan
  Write-Host '       ------------------------------------------------------------------------------' -ForegroundColor DarkCyan
}
function Write-SetupInfo([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Gray }
function Write-SetupSuccess([string]$Message) { Write-Host "  [OK] $Message" -ForegroundColor Green }
function Write-SetupWarning([string]$Message) { Write-Warning $Message }
function Write-SetupError([string]$Message) { Write-Host "[ERROR] $Message" -ForegroundColor Red }

function Show-RestartRequiredMessage {
  Write-Host ''
  Write-Host '+------------------------------------------------------------------------------------------+' -ForegroundColor Yellow
  Write-Host '|  REINICIO DE WINDOWS NECESARIO                                                           |' -ForegroundColor Yellow
  Write-Host '|                                                                                          |' -ForegroundColor Yellow
  Write-Host '|  Los componentes quedaron habilitados. Reinicie y ejecute nuevamente                    |' -ForegroundColor Yellow
  Write-Host '|  SETUP-WINDOWS.cmd para continuar automaticamente.                                       |' -ForegroundColor Yellow
  Write-Host '+------------------------------------------------------------------------------------------+' -ForegroundColor Yellow
}

function Show-InstallationSummary {
  param(
    [Parameter(Mandatory)][string]$InfrastructureRoot,
    [Parameter(Mandatory)][string]$DockerCli
  )

  $os = Get-CimInstance Win32_OperatingSystem
  $dockerDesktopCandidates = @(
    (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'),
    (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe')
  )
  $dockerDesktopPath = $dockerDesktopCandidates |
    Where-Object { Test-Path -LiteralPath $_ } |
    Select-Object -First 1
  $dockerDesktopVersion = if ($dockerDesktopPath) {
    (Get-Item -LiteralPath $dockerDesktopPath).VersionInfo.ProductVersion
  } else { 'No detectado' }

  $wslOutput = @(& wsl.exe --version 2>$null)
  $wslVersion = if ($wslOutput.Count -gt 0) {
    ($wslOutput[0] -replace '^[^:]+:\s*', '').Trim()
  } else { 'No detectado' }
  $dockerClientVersion = (& $DockerCli version --format '{{.Client.Version}}' 2>$null | Select-Object -First 1)
  $dockerServerVersion = (& $DockerCli version --format '{{.Server.Version}}' 2>$null | Select-Object -First 1)
  $composeVersion = (& $DockerCli compose version --short 2>$null | Select-Object -First 1)

  Push-Location $InfrastructureRoot
  try {
    $runningServices = @(& $DockerCli compose ps --status running --services 2>$null).Count
  }
  finally {
    Pop-Location
  }

  Write-Host ''
  Write-Host '+------------------------------------------------------------------------------------------+' -ForegroundColor Green
  Write-Host '|                     TODO INSTALADO Y VALIDADO CORRECTAMENTE                              |' -ForegroundColor Green
  Write-Host '+------------------------------------------------------------------------------------------+' -ForegroundColor Green
  Write-Host ('|  Windows             : {0} (build {1})' -f $os.Caption, $os.BuildNumber) -ForegroundColor White
  Write-Host ('|  WSL                  : {0}' -f $wslVersion) -ForegroundColor White
  Write-Host ('|  Docker Desktop       : {0}' -f $dockerDesktopVersion) -ForegroundColor White
  Write-Host ('|  Docker Client        : {0}' -f $dockerClientVersion) -ForegroundColor White
  Write-Host ('|  Docker Engine        : {0}' -f $dockerServerVersion) -ForegroundColor White
  Write-Host ('|  Docker Compose       : {0}' -f $composeVersion) -ForegroundColor White
  Write-Host ('|  Servicios ejecutando : {0}' -f $runningServices) -ForegroundColor White
  Write-Host '+------------------------------------------------------------------------------------------+' -ForegroundColor Green
  Write-Host '|  Dashboard             http://localhost:5173                                             |' -ForegroundColor Cyan
  Write-Host '|  Monitoring Swagger    http://localhost:4000/api/docs                                    |' -ForegroundColor Cyan
  Write-Host '|  App Backend Swagger   http://localhost:8080/api/docs                                    |' -ForegroundColor Cyan
  Write-Host '|  Monitoring AI         http://localhost:8000/docs                                        |' -ForegroundColor Cyan
  Write-Host '|  Prometheus            http://localhost:9090                                             |' -ForegroundColor Cyan
  Write-Host '|  Grafana               http://localhost:3001                                             |' -ForegroundColor Cyan
  Write-Host '+------------------------------------------------------------------------------------------+' -ForegroundColor Green
}

function Invoke-CheckedProcess {
  param(
    [Parameter(Mandatory)][string]$FilePath,
    [string[]]$ArgumentList = @(),
    [string]$WorkingDirectory
  )

  $parameters = @{
    FilePath = $FilePath
    ArgumentList = $ArgumentList
    Wait = $true
    PassThru = $true
    NoNewWindow = $true
  }
  if ($WorkingDirectory) { $parameters.WorkingDirectory = $WorkingDirectory }

  $process = Start-Process @parameters
  if ($process.ExitCode -ne 0) {
    throw "$FilePath exited with code $($process.ExitCode)."
  }
  return $process.ExitCode
}

Export-ModuleMember -Function @(
  'Test-IsAdministrator',
  'Start-SetupTranscript',
  'Stop-SetupTranscript',
  'Write-SetupBanner',
  'Write-SetupStep',
  'Write-SetupInfo',
  'Write-SetupSuccess',
  'Write-SetupWarning',
  'Write-SetupError',
  'Show-RestartRequiredMessage',
  'Show-InstallationSummary',
  'Invoke-CheckedProcess'
)
