Set-StrictMode -Version Latest

function Initialize-ProjectEnvironment {
  param([Parameter(Mandatory)][string]$InfrastructureRoot)

  Write-SetupStep 'Preparing project environment variables'
  $examplePath = Join-Path $InfrastructureRoot '.env.example'
  $environmentPath = Join-Path $InfrastructureRoot '.env'

  if (-not (Test-Path -LiteralPath $examplePath)) {
    throw "Environment template was not found: $examplePath"
  }
  if (-not (Test-Path -LiteralPath $environmentPath)) {
    Copy-Item -LiteralPath $examplePath -Destination $environmentPath
    Write-SetupWarning 'Created .env from .env.example. Example database values are suitable only for the initial non-persistent demonstration.'
  }
  else {
    Write-SetupSuccess '.env already exists; it was not overwritten'
  }
}

function Invoke-DockerCompose {
  param(
    [Parameter(Mandatory)][string]$InfrastructureRoot,
    [Parameter(Mandatory)][string]$DockerCli,
    [Parameter(Mandatory)][string[]]$Arguments
  )

  Push-Location $InfrastructureRoot
  try {
    & $DockerCli compose @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "docker compose failed with exit code $LASTEXITCODE."
    }
  }
  finally {
    Pop-Location
  }
}

function Start-MonitoringPlatform {
  param(
    [Parameter(Mandatory)][string]$InfrastructureRoot,
    [Parameter(Mandatory)][string]$DockerCli
  )

  Write-SetupStep 'Validating Docker Compose configuration'
  Invoke-DockerCompose -InfrastructureRoot $InfrastructureRoot -DockerCli $DockerCli -Arguments @('config', '--quiet')

  Write-SetupStep 'Building and starting the monitoring ecosystem'
  Invoke-DockerCompose -InfrastructureRoot $InfrastructureRoot -DockerCli $DockerCli -Arguments @('up', '-d', '--build')

  Write-SetupStep 'Container status'
  Invoke-DockerCompose -InfrastructureRoot $InfrastructureRoot -DockerCli $DockerCli -Arguments @('ps')
}

function Test-MonitoringPlatformHealth {
  Write-SetupStep 'Waiting for application health endpoints'
  $endpoints = @(
    'http://localhost:8080/health',
    'http://localhost:4000/health',
    'http://localhost:8000/health',
    'http://localhost:5173/dashboard-health',
    'http://localhost:9090/-/healthy'
  )

  $deadline = (Get-Date).AddMinutes(4)
  $pending = [Collections.Generic.List[string]]::new()
  $endpoints | ForEach-Object { $pending.Add($_) }

  while ($pending.Count -gt 0 -and (Get-Date) -lt $deadline) {
    foreach ($endpoint in @($pending)) {
      try {
        $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
          Write-SetupSuccess "$endpoint is available"
          $pending.Remove($endpoint)
        }
      }
      catch { }
    }
    if ($pending.Count -gt 0) { Start-Sleep -Seconds 5 }
  }

  if ($pending.Count -gt 0) {
    throw "Health checks failed for: $($pending -join ', ')"
  }
}

function Invoke-PlatformSmokeTest {
  param(
    [Parameter(Mandatory)][string]$InfrastructureRoot,
    [Parameter(Mandatory)][string]$DockerCli
  )

  Write-SetupStep 'Running the k6 smoke test'
  Invoke-DockerCompose `
    -InfrastructureRoot $InfrastructureRoot `
    -DockerCli $DockerCli `
    -Arguments @('--profile', 'tools', 'run', '--rm', 'k6', 'run', '/scripts/smoke.js')
  Write-SetupSuccess 'k6 smoke test passed'
}

Export-ModuleMember -Function @(
  'Initialize-ProjectEnvironment',
  'Start-MonitoringPlatform',
  'Test-MonitoringPlatformHealth',
  'Invoke-PlatformSmokeTest'
)
