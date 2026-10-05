Set-StrictMode -Version Latest

function Get-DockerDesktopPath {
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'),
    (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe')
  )
  return $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

function Get-DockerCliPath {
  $command = Get-Command docker.exe -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }

  $candidates = @(
    (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin\docker.exe'),
    (Join-Path $env:ProgramFiles 'Docker\Docker\resources\bin\docker.exe')
  )
  return $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

function Install-DockerDesktopIfMissing {
  if (Get-DockerDesktopPath) {
    Write-SetupSuccess 'Docker Desktop is already installed'
    return
  }

  Write-SetupStep 'Downloading Docker Desktop from the official Docker distribution server'
  $downloadUrl = 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe'
  $installerPath = Join-Path $env:TEMP 'DockerDesktopInstaller.exe'
  Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing

  Write-SetupStep 'Verifying the Docker installer signature'
  $signature = Get-AuthenticodeSignature -FilePath $installerPath
  if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Docker Inc') {
    throw 'The downloaded Docker installer does not have a valid Docker Inc signature.'
  }
  Write-SetupSuccess 'Official Docker Inc signature verified'

  Write-SetupStep 'Installing Docker Desktop silently'
  $installer = Start-Process `
    -FilePath $installerPath `
    -ArgumentList @(
      'install',
      '--accept-license',
      '--backend=wsl-2',
      '--no-windows-containers',
      '--quiet'
    ) `
    -Wait `
    -PassThru
  if ($installer.ExitCode -ne 0) {
    throw "Docker Desktop installer exited with code $($installer.ExitCode)."
  }

  $deadline = (Get-Date).AddMinutes(10)
  do {
    $installProcesses = Get-Process -ErrorAction SilentlyContinue |
      Where-Object { $_.ProcessName -in @('Docker Desktop Installer', 'DockerDesktopInstaller') }
    if (-not $installProcesses) { break }
    Start-Sleep -Seconds 5
  } while ((Get-Date) -lt $deadline)

  while (-not (Get-DockerDesktopPath) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 5
  }
  if (-not (Get-DockerDesktopPath)) {
    throw 'Docker Desktop installation did not complete within ten minutes.'
  }
  Write-SetupSuccess 'Docker Desktop installed'
}

function Start-DockerDesktopAndWait {
  param([Parameter(Mandatory)][string]$DockerCli)

  Write-SetupStep 'Starting Docker Desktop'
  $desktopPath = Get-DockerDesktopPath
  if (-not $desktopPath) { throw 'Docker Desktop executable was not found.' }

  if (-not (Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath $desktopPath -WindowStyle Hidden
  }

  $deadline = (Get-Date).AddMinutes(5)
  do {
    & $DockerCli info --format '{{.ServerVersion}}' 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Write-SetupSuccess 'Docker engine is running'
      return
    }
    Start-Sleep -Seconds 5
  } while ((Get-Date) -lt $deadline)

  throw 'Docker Desktop did not start within five minutes. Open Docker Desktop and review its diagnostic message.'
}

Export-ModuleMember -Function @(
  'Get-DockerDesktopPath',
  'Get-DockerCliPath',
  'Install-DockerDesktopIfMissing',
  'Start-DockerDesktopAndWait'
)
