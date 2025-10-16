@echo off
echo ========================================
echo Desplegando Firestore Rules e Indices
echo ========================================
echo.

echo [1/2] Desplegando reglas de Firestore...
call firebase deploy --only firestore:rules
echo.

echo [2/2] Desplegando indices de Firestore...
call firebase deploy --only firestore:indexes
echo.

echo ========================================
echo Despliegue completado!
echo ========================================
echo.
echo IMPORTANTE:
echo - Los indices pueden tardar 2-10 minutos en construirse
echo - Puedes ver el estado en: https://console.firebase.google.com/project/klycs-58190/firestore/indexes
echo.
pause
