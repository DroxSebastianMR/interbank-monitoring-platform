param(
    [ValidateSet('Start', 'Stop', 'Status', 'Logs')]
    [string]$Action = 'Start'
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$runtimeRoot = Join-Path $projectRoot 'tmp/dashboard-runtime'
$sourceRoot = Join-Path $runtimeRoot 'source'
$localEnv = Join-Path $runtimeRoot '.env'
$composeFile = Join-Path $projectRoot 'monitoring-infrastructure/docker-compose.dashboard-local.yml'
$dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
$dockerExe = if ($dockerCommand) { $dockerCommand.Source } else { Join-Path $env:LOCALAPPDATA 'Programs/DockerDesktop/resources/bin/docker.exe' }
if (-not (Test-Path -LiteralPath $dockerExe)) {
    $dockerExe = 'C:/Program Files/Docker/Docker/resources/bin/docker.exe'
}
if (-not (Test-Path -LiteralPath $dockerExe)) { throw 'No se encuentra Docker Desktop.' }
$env:PATH = "$(Split-Path -Parent $dockerExe);$env:PATH"

if ($Action -eq 'Start') {
    & $dockerExe info --format '{{.ServerVersion}}'
    if ($LASTEXITCODE -ne 0) { throw 'Inicia Docker Desktop y espera a que el motor esté listo.' }
    New-Item -ItemType Directory -Force -Path $sourceRoot | Out-Null
    if (-not (Test-Path (Join-Path $runtimeRoot 'source-commit.txt'))) {
        Push-Location $projectRoot
        try {
            $sourceCommit = (& git rev-parse main).Trim()
            if ($LASTEXITCODE -ne 0) { throw 'Se requiere la referencia local main compatible.' }
            & git archive --format=tar --output=tmp/dashboard-runtime/source.tar $sourceCommit monitoring-backend interbank-app-backend monitoring-ai monitoring-infrastructure
            if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar la copia de ejecución.' }
            & tar -xf (Join-Path $runtimeRoot 'source.tar') -C $sourceRoot
            if ($LASTEXITCODE -ne 0) { throw 'No se pudo extraer la copia de ejecución.' }
            Set-Content -LiteralPath (Join-Path $runtimeRoot 'source-commit.txt') -Value $sourceCommit
        } finally { Pop-Location }
    }
    if (-not (Test-Path -LiteralPath $localEnv)) {
        $secretValues = foreach ($secretName in @('LOCAL_DB_PASSWORD', 'LOCAL_APP_JWT_SECRET', 'LOCAL_MONITOR_JWT_SECRET', 'LOCAL_ANALYTICS_TOKEN', 'LOCAL_ADMIN_PASSWORD')) {
            $secretBytes = New-Object byte[] 32
            $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
            try { $generator.GetBytes($secretBytes) } finally { $generator.Dispose() }
            $secretValue = ([BitConverter]::ToString($secretBytes)).Replace('-', '').ToLowerInvariant()
            "$secretName=$secretValue"
        }
        Set-Content -LiteralPath $localEnv -Value $secretValues -Encoding ascii
    }
}
if (-not (Test-Path -LiteralPath $localEnv)) { throw 'Ejecuta primero dashboard-local.ps1 Start.' }
$composeArgs = @('compose', '--env-file', $localEnv, '-f', $composeFile)
switch ($Action) {
    'Start' { & $dockerExe @composeArgs up -d --build --wait --wait-timeout 240 }
    'Stop' { & $dockerExe @composeArgs stop }
    'Status' { & $dockerExe @composeArgs ps -a }
    'Logs' { & $dockerExe @composeArgs logs --tail 80 }
}
if ($LASTEXITCODE -ne 0) { throw "Docker Compose no pudo completar $Action. Revisa los logs." }
if ($Action -eq 'Start') {
    Write-Host 'Dashboard: http://localhost:5173'
    Write-Host 'Usuario local: admin@monitoring.local'
    Write-Host "Contraseña local: consulta LOCAL_ADMIN_PASSWORD en $localEnv"
}
