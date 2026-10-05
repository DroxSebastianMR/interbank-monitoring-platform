#Requires -RunAsAdministrator

$ErrorActionPreference = 'Stop'
$logPath = Join-Path $env:TEMP 'interbank-docker-prerequisites.log'
Start-Transcript -Path $logPath -Force

try {
  Write-Host 'Enabling Windows Subsystem for Linux...'
  Enable-WindowsOptionalFeature `
    -Online `
    -FeatureName Microsoft-Windows-Subsystem-Linux `
    -All `
    -NoRestart

  Write-Host 'Enabling Virtual Machine Platform...'
  Enable-WindowsOptionalFeature `
    -Online `
    -FeatureName VirtualMachinePlatform `
    -All `
    -NoRestart

  Write-Host 'Configuring the Windows hypervisor to start automatically...'
  bcdedit.exe /set hypervisorlaunchtype auto
  if ($LASTEXITCODE -ne 0) {
    throw "bcdedit failed with exit code $LASTEXITCODE"
  }

  Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux |
    Format-Table FeatureName, State
  Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform |
    Format-Table FeatureName, State
  Write-Host 'Docker prerequisites are configured. Restart Windows before starting Docker Desktop.'
}
catch {
  Write-Error $_
  exit 1
}
finally {
  Stop-Transcript
}
