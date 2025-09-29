# 🔧 Configuración CORS para Firebase Storage

## El Problema
Firebase Storage está bloqueando las subidas desde `localhost:3000` por políticas CORS.

## Solución Manual (RECOMENDADA)

### Opción 1: Desde Google Cloud Console (MÁS FÁCIL)

1. **Abre Google Cloud Console:**
   ```
   https://console.cloud.google.com/storage/browser?project=klycs-58190
   ```

2. **Encuentra tu bucket:**
   - Busca el bucket llamado: `klycs-58190.appspot.com`
   - Haz clic en los 3 puntos (⋮) al lado del bucket
   - Selecciona **"Edit CORS configuration"**

3. **Pega esta configuración:**
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
       "maxAgeSeconds": 3600,
       "responseHeader": [
         "Content-Type",
         "Authorization",
         "Content-Length"
       ]
     }
   ]
   ```

4. **Guarda** y espera 1-2 minutos

### Opción 2: Desde Firebase Console (ALTERNATIVA)

1. **Abre Firebase Console:**
   ```
   https://console.firebase.google.com/project/klycs-58190/storage
   ```

2. **Ve a la pestaña "Rules"**

3. **Verifica que las reglas estén así:**
   ```
   match /cards/{cardId}/portfolio/{fileName} {
     allow read: if true;
     allow write: if request.auth != null;
   }
   ```

## ✅ Verificar que Funciona

1. Cierra completamente tu navegador
2. Abre de nuevo `http://localhost:3000`
3. Ve a tu tarjeta > Portfolio
4. Intenta subir una imagen

## 🚨 Si Sigue Sin Funcionar

### Limpiar Service Worker:
1. Abre DevTools (F12)
2. Ve a **Application** > **Service Workers**
3. Haz clic en **Unregister**
4. Recarga la página (Ctrl + Shift + R)

### Limpiar Cache:
1. DevTools (F12) > **Application** > **Storage**
2. Haz clic en **Clear site data**
3. Recarga

## 📝 Notas Importantes

- **CORS solo afecta a desarrollo local** (localhost)
- En producción (después del deploy) NO hay problemas de CORS
- La configuración `"origin": ["*"]` es temporal para desarrollo
- En producción deberías especificar tu dominio real

## 🔄 Sistema Simplificado

He recreado TODO el sistema de portfolio:

✅ **Nuevo servicio:** `portfolioStorage.ts` - Subida directa sin compresión compleja
✅ **Reglas simplificadas:** Solo autenticación requerida
✅ **Sin múltiples tamaños:** Una sola versión por archivo
✅ **Progreso visual:** Barra de progreso real
✅ **Máximo 10 elementos:** Límite aplicado
✅ **Videos 10s max:** Validación de duración

## 💡 Después de Configurar CORS

El portfolio funcionará perfectamente:
- Sube imágenes y videos
- Se mostrarán en carrusel vertical (estilo iOS)
- Videos con autoplay
- Drag & drop para reordenar
- Títulos opcionales
