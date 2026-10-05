@echo off
setlocal
chcp 65001 >nul
color 0B
mode con cols=96 lines=34 >nul 2>&1
title Interbank Monitoring - Instalacion automatica

set "SCRIPT_DIR=%~dp0"

cls
echo +----------------------------------------------------------------------------------------------+
echo ^|                                                                                              ^|
echo ^|                    INTERBANK MONITORING - INSTALACION AUTOMATICA                             ^|
echo ^|                                                                                              ^|
echo ^|       WSL 2  -  Docker Desktop  -  Docker Compose  -  Health checks  -  k6                  ^|
echo ^|                                                                                              ^|
echo +----------------------------------------------------------------------------------------------+
echo.
echo   Este es el unico archivo que debe ejecutar el equipo.
echo   Windows solicitara permisos de administrador mediante UAC.
echo   El proceso puede ejecutarse nuevamente sin reinstalar componentes existentes.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%bootstrap.ps1"
set "SETUP_EXIT_CODE=%ERRORLEVEL%"

echo.
if "%SETUP_EXIT_CODE%"=="0" (
  color 0A
  echo +----------------------------------------------------------------------------------------------+
  echo ^|  PROCESO FINALIZADO                                                                         ^|
  echo ^|  La instalacion termino correctamente o esta esperando el reinicio indicado.                ^|
  echo +----------------------------------------------------------------------------------------------+
) else (
  color 0C
  echo +----------------------------------------------------------------------------------------------+
  echo ^|  EL PROCESO NO PUDO COMPLETARSE                                                             ^|
  echo +----------------------------------------------------------------------------------------------+
  echo   Codigo de salida: %SETUP_EXIT_CODE%
  echo   Revise la ruta del log mostrada arriba para ver el diagnostico completo.
)
echo.
echo   Puede cerrar esta ventana despues de revisar el resultado.
echo.
pause
exit /b %SETUP_EXIT_CODE%
