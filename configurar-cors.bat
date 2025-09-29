@echo off
chcp 65001 >nul
echo.
echo ════════════════════════════════════════════════════
echo   🔥 CONFIGURADOR AUTOMÁTICO DE CORS
echo ════════════════════════════════════════════════════
echo.
echo Configurando CORS para Firebase Storage...
echo.

REM Verificar si gcloud está instalado
where gcloud >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Google Cloud SDK no está instalado
    echo.
    echo 📥 Descárgalo desde:
    echo    https://cloud.google.com/sdk/docs/install
    echo.
    echo ⚠️  O configura CORS manualmente en:
    echo    https://console.cloud.google.com/storage/browser/klycs-58190.appspot.com
    echo.
    pause
    exit /b 1
)

echo ✅ Google Cloud SDK detectado
echo.

REM Configurar proyecto
echo 🔧 Configurando proyecto...
gcloud config set project klycs-58190
echo.

REM Aplicar CORS
echo 📡 Aplicando configuración CORS...
gsutil cors set cors.json gs://klycs-58190.appspot.com
echo.

if %ERRORLEVEL% EQU 0 (
    echo ════════════════════════════════════════════════════
    echo   ✅ CORS CONFIGURADO EXITOSAMENTE
    echo ════════════════════════════════════════════════════
    echo.
    echo 🎯 Próximos pasos:
    echo    1. Abre tu app: http://localhost:3000
    echo    2. Presiona F12
    echo    3. Application → Service Workers → Unregister
    echo    4. Recarga: Ctrl + Shift + R
    echo    5. Prueba subir una imagen al portfolio
    echo.
) else (
    echo ════════════════════════════════════════════════════
    echo   ❌ ERROR AL CONFIGURAR CORS
    echo ════════════════════════════════════════════════════
    echo.
    echo 🔐 Necesitas autenticarte primero:
    echo    1. Ejecuta: gcloud auth login
    echo    2. Vuelve a ejecutar este script
    echo.
    echo 📝 O configura manualmente:
    echo    https://console.cloud.google.com/storage/browser/klycs-58190.appspot.com
    echo    → Configuration → CORS → Edit → Pega el contenido de cors.json
    echo.
)

pause
