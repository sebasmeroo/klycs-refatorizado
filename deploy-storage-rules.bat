@echo off
echo ====================================
echo Desplegando reglas de Storage
echo ====================================
echo.

cd /d "%~dp0"

echo Conectando al proyecto klycs-58190...
firebase use klycs-58190

echo.
echo Desplegando reglas de Storage...
firebase deploy --only storage

echo.
echo ====================================
echo Completado!
echo ====================================
pause
