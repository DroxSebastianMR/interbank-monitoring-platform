#Requires -Version 5.1

[CmdletBinding()]
param(
  [switch]$SkipDockerInstall,
  [switch]$SkipProjectStart,
  [switch]$SkipSmokeTest,
  [switch]$RestartWhenRequired
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$moduleRoot = Join-Path $PSScriptRoot 'modules'

Import-Module (Join-Path $moduleRoot 'Common.psm1') -Force

if (-not (Test-IsAdministrator)) {
  Write-Host 'Administrator permissions are required. Opening the Windows UAC prompt...'
  $arguments = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', ('"{0}"' -f $PSCommandPath)
  )
  if ($SkipDockerInstall) { $arguments += '-SkipDockerInstall' }
  if ($SkipProjectStart) { $arguments += '-SkipProjectStart' }
  if ($SkipSmokeTest) { $arguments += '-SkipSmokeTest' }
  if ($RestartWhenRequired) { $arguments += '-RestartWhenRequired' }

  $elevated = Start-Process `
    -FilePath 'powershell.exe' `
    -Verb RunAs `
    -ArgumentList $arguments `
    -Wait `
    -PassThru
  exit $elevated.ExitCode
}

Import-Module (Join-Path $moduleRoot 'WindowsPrerequisites.psm1') -Force
Import-Module (Join-Path $moduleRoot 'DockerDesktop.psm1') -Force
Import-Module (Join-Path $moduleRoot 'ProjectSetup.psm1') -Force

$infrastructureRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$logPath = Start-SetupTranscript

try {
  Write-SetupBanner
  Write-SetupInfo "Infrastructure directory: $infrastructureRoot"
  Write-SetupInfo "Detailed log: $logPath"

  Assert-SupportedWindows
  $prerequisiteResult = Enable-DockerWindowsPrerequisites

  if ($prerequisiteResult.RestartRequired) {
    Write-SetupWarning 'Windows enabled one or more virtualization features and must restart before Docker can run.'
    Write-SetupInfo 'After restarting, double-click install-and-run.cmd again. The second run will continue automatically.'
    Show-RestartRequiredMessage

    if ($RestartWhenRequired) {
      Write-SetupWarning 'RestartWhenRequired was supplied. Windows will restart now.'
      Restart-Computer -Force
    }

    $answer = Read-Host 'Restart Windows now? Type Y to restart, or press Enter to restart later'
    if ($answer -match '^(y|yes|s|si|sí)$') {
      Restart-Computer -Force
    }
    exit 0
  }

  Initialize-Wsl2

  if (-not $SkipDockerInstall) {
    Install-DockerDesktopIfMissing
  }

  $dockerCli = Get-DockerCliPath
  if (-not $dockerCli) {
    throw 'Docker CLI was not found. Re-run the setup or install Docker Desktop from the official Docker website.'
  }

  Start-DockerDesktopAndWait -DockerCli $dockerCli

  if (-not $SkipProjectStart) {
    Initialize-ProjectEnvironment -InfrastructureRoot $infrastructureRoot
    Start-MonitoringPlatform -InfrastructureRoot $infrastructureRoot -DockerCli $dockerCli
    Test-MonitoringPlatformHealth

    if (-not $SkipSmokeTest) {
      Invoke-PlatformSmokeTest -InfrastructureRoot $infrastructureRoot -DockerCli $dockerCli
    }
  }

  Write-SetupSuccess 'Automatic setup completed.'
  Show-InstallationSummary -InfrastructureRoot $infrastructureRoot -DockerCli $dockerCli
}
catch {
  Write-SetupError $_.Exception.Message
  Write-SetupError "Review the detailed log: $logPath"
  exit 1
}
finally {
  Stop-SetupTranscript
}
