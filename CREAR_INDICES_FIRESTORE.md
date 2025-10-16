# 🔥 Crear Índices de Firestore - URGENTE

## ⚠️ Error Actual

```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

## 📋 Índices Requeridos

### Opción 1: Usar el Link del Error (MÁS RÁPIDO) ⚡

1. **Copia el link completo del error** que aparece en la consola
2. Pégalo en el navegador
3. Click en "Crear índice"
4. Espera 2-5 minutos a que se construya

---

### Opción 2: Crear Manualmente en Firebase Console

Ve a: https://console.firebase.google.com/project/klycs-58190/firestore/indexes

#### Índice 1: Query por rango de fechas
```
Colección: professional_availability
Campos:
  - calendarId (Ascending)
  - date (Ascending)
  - __name__ (Ascending)
```

#### Índice 2: Query por rango de fechas + status
```
Colección: professional_availability
Campos:
  - calendarId (Ascending)
  - status (Ascending)
  - date (Ascending)
  - __name__ (Ascending)
```

#### Índice 3: Query para inbox (pending)
```
Colección: professional_availability
Campos:
  - calendarId (Ascending)
  - status (Ascending)
  - requestedAt (Descending)
  - __name__ (Ascending)
```

---

### Opción 3: Usar Firebase CLI (Recomendado para producción)

1. **Crea el archivo `firestore.indexes.json`** en la raíz del proyecto:

```json
{
  "indexes": [
    {
      "collectionGroup": "professional_availability",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "calendarId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "professional_availability",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "calendarId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "professional_availability",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "calendarId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "requestedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

2. **Despliega los índices**:
```bash
firebase deploy --only firestore:indexes
```

3. **Espera a que se construyan** (2-10 minutos según tamaño de datos)

---

## 🚀 Pasos Inmediatos

1. **Desplegar reglas de Firestore** (YA ACTUALIZADAS):
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Crear índices** usando una de las 3 opciones de arriba

3. **Esperar** 2-5 minutos a que se construyan los índices

4. **Recargar la aplicación** y probar de nuevo

---

## ✅ Verificación

Una vez creados los índices, deberías poder:
- ✅ Crear solicitudes de disponibilidad (sin error de permisos)
- ✅ Ver solicitudes en el Inbox (sin error de índice)
- ✅ Aprobar/rechazar solicitudes

---

## 🐛 Si Siguen los Errores de Permisos

Si después de desplegar las reglas siguen los errores de permisos, verifica:

1. **El usuario está autenticado**: `request.auth != null`
2. **El professionalId coincide**: `request.resource.data.professionalId == request.auth.uid`
3. **El status es 'pending'**: `request.resource.data.status == 'pending'`

Puedes revisar los errores detallados en:
https://console.firebase.google.com/project/klycs-58190/firestore/rules

---

## 📊 Estado de Construcción de Índices

Para ver el estado de construcción de los índices:
https://console.firebase.google.com/project/klycs-58190/firestore/indexes

Estados posibles:
- 🟡 **Building** - En construcción (2-10 min)
- 🟢 **Enabled** - Listo para usar
- 🔴 **Error** - Hubo un problema (contacta soporte)
