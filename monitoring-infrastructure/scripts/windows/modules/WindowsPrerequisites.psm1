Set-StrictMode -Version Latest

function Test-PendingWindowsRestart {
  $rebootKeys = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending',
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired'
  )
  return [bool]($rebootKeys | Where-Object { Test-Path $_ })
}

function Assert-SupportedWindows {
  Write-SetupStep 'Checking Windows compatibility'
  if (-not [Environment]::Is64BitOperatingSystem) {
    throw 'Docker Desktop requires a 64-bit Windows installation.'
  }

  $os = Get-CimInstance Win32_OperatingSystem
  $build = [int]$os.BuildNumber
  if ($build -lt 19045) {
    throw "Windows build $build is not supported. Update Windows before installing Docker Desktop."
  }
  Write-SetupSuccess "Windows build $build, 64-bit"
}

function Enable-DockerWindowsPrerequisites {
  Write-SetupStep 'Checking WSL and virtualization features'
  $restartRequired = Test-PendingWindowsRestart
  if ($restartRequired) {
    Write-SetupWarning 'Windows has a pending restart. Setup will stop after verifying the required features.'
  }
  $features = @(
    'Microsoft-Windows-Subsystem-Linux',
    'VirtualMachinePlatform'
  )

  foreach ($featureName in $features) {
    $feature = Get-WindowsOptionalFeature -Online -FeatureName $featureName
    if ($feature.State -ne 'Enabled') {
      Write-SetupInfo "Enabling $featureName..."
      $result = Enable-WindowsOptionalFeature `
        -Online `
        -FeatureName $featureName `
        -All `
        -NoRestart
      if ($result.RestartNeeded) { $restartRequired = $true }
    }
    else {
      Write-SetupSuccess "$featureName is enabled"
    }
  }

  & bcdedit.exe /set hypervisorlaunchtype auto | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw 'Windows could not configure the hypervisor boot setting.'
  }

  return [PSCustomObject]@{ RestartRequired = $restartRequired }
}

function Initialize-Wsl2 {
  Write-SetupStep 'Initializing WSL 2'

  & wsl.exe --set-default-version 2 | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw 'WSL 2 could not be initialized. Confirm that virtualization is enabled in BIOS/UEFI.'
  }

  & wsl.exe --update --web-download | Out-Host
  if ($LASTEXITCODE -ne 0) {
    Write-SetupWarning 'WSL web update was not available; trying the standard update channel.'
    & wsl.exe --update | Out-Host
    if ($LASTEXITCODE -ne 0) {
      throw 'WSL could not be updated.'
    }
  }
  Write-SetupSuccess 'WSL 2 is ready'
}

Export-ModuleMember -Function @(
  'Assert-SupportedWindows',
  'Enable-DockerWindowsPrerequisites',
  'Initialize-Wsl2'
)
