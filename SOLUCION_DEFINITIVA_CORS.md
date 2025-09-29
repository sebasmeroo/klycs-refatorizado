# 🔥 SOLUCIÓN DEFINITIVA - CORS

## ⚡ MÉTODO 1: Desde el Navegador (2 MINUTOS)

1. **Abre esta URL EN EL NAVEGADOR:**
   ```
   https://console.cloud.google.com/storage/browser/klycs-58190.appspot.com?project=klycs-58190
   ```

2. **Haz clic en la pestaña "CONFIGURATION" (Configuración)** arriba

3. **Busca la sección "CORS configuration"**

4. **Haz clic en "EDIT"** o **"EDITAR"**

5. **Pega esto:**
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

6. **GUARDA** (botón "Save")

---

## ⚡ MÉTODO 2: Firebase Console (MÁS FÁCIL AÚN)

1. **Abre:**
   ```
   https://console.firebase.google.com/project/klycs-58190/storage/klycs-58190.appspot.com/rules
   ```

2. **Ve a la pestaña "Files"** (no Rules)

3. **Haz clic en los 3 puntos (⋮) del bucket**

4. **Edit CORS configuration**

5. **Pega la configuración de arriba**

---

## 🔄 MÉTODO 3: Manual desde Windows PowerShell

Si prefieres hacerlo desde consola:

```powershell
# 1. Copia el archivo cors.json a tu escritorio
# Ya lo tienes en: c:\Users\joanr\Desktop\klycs nuevo\cors.json

# 2. Instala Google Cloud SDK si no lo tienes:
# https://cloud.google.com/sdk/docs/install

# 3. Autentícate:
gcloud auth login

# 4. Configura el proyecto:
gcloud config set project klycs-58190

# 5. Aplica CORS:
gsutil cors set cors.json gs://klycs-58190.appspot.com
```

---

## ✅ DESPUÉS DE CONFIGURAR:

### Limpia el Service Worker:

1. Abre tu app: http://localhost:3000
2. Presiona F12
3. Ve a **Application** > **Service Workers**
4. Haz clic en **Unregister** en todos
5. Cierra DevTools
6. Recarga la página con **Ctrl + Shift + R**

### Limpia la Cache:

1. F12 > **Application** > **Storage**
2. **Clear site data**
3. Recarga

---

## 🎯 PRUEBA RÁPIDA

1. Ve a tu tarjeta
2. Sección **Portfolio**
3. Haz clic en **"Haz clic para subir"**
4. Selecciona una imagen
5. Debería subir sin errores CORS

---

## 🚨 SI SIGUE SIN FUNCIONAR

Es posible que el problema sea del Service Worker. Hazlo PRIMERO:

```javascript
// Abre la consola del navegador (F12) y pega esto:

navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
  console.log('✅ Service Workers eliminados');
  location.reload();
});
```

Presiona Enter y la página se recargará sin Service Worker.
