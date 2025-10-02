# 📊 Guía de Índices de Firestore

## ¿Por qué necesitas índices?

Firebase Firestore requiere **índices compuestos** cuando haces consultas con:
- `where()` + `orderBy()` en campos diferentes
- Múltiples `where()` con operadores de rango (`>`, `<`, `!=`)

Sin índices, las consultas fallan con error: `The query requires an index`

---

## 🔍 Índices Necesarios para Tu App

### 1. Colección: `bookings`

**Consulta**: `where('userId', '==', X).orderBy('createdAt', 'desc')`
- **Archivo**: `src/services/bookings.ts:71-75`
- **Campos**:
  - `userId` (Ascending)
  - `createdAt` (Descending)

### 2. Colección: `shared_calendars`

**Consulta**: `where('ownerId', '==', X)` (puede necesitar orderBy en futuro)
- **Archivo**: `src/services/collaborativeCalendar.ts:216-219`
- **Campos**:
  - `ownerId` (Ascending)
  - `createdAt` (Descending) *(recomendado para ordenar)*

### 3. Colección: `calendar_events`

Si tienes consultas como `where('calendarId', '==', X).orderBy('startDate', 'asc')`
- **Campos**:
  - `calendarId` (Ascending)
  - `startDate` (Ascending)

---

## 🛠️ Cómo Crear los Índices

### Método 1: Automático (Recomendado)

1. **Ejecuta la app en desarrollo**
2. **Navega a las páginas** que hacen estas consultas:
   - Dashboard de Reservas
   - Calendario Colaborativo
3. **Firestore lanzará un error** con un enlace directo tipo:
   ```
   https://console.firebase.google.com/project/tu-proyecto/firestore/indexes?create_composite=...
   ```
4. **Haz clic en el enlace** → Firebase crea el índice automáticamente

### Método 2: Manual en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Indexes** → **Composite**
4. Crea estos índices:

#### Índice para `bookings`
```
Collection ID: bookings
Fields indexed:
  - userId (Ascending)
  - createdAt (Descending)
Query scope: Collection
Status: Enabled
```

#### Índice para `shared_calendars`
```
Collection ID: shared_calendars
Fields indexed:
  - ownerId (Ascending)
  - createdAt (Descending)
Query scope: Collection
Status: Enabled
```

---

## 📄 Archivo `firestore.indexes.json`

Si prefieres deployar índices con Firebase CLI:

```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "shared_calendars",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "ownerId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "calendar_events",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "calendarId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "startDate",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

**Para deployar**:
```bash
firebase deploy --only firestore:indexes
```

---

## ⚠️ Importante

1. **Índices tardan 5-10 minutos** en construirse la primera vez
2. **Índices no consumen cuota gratuita** (son gratis)
3. **Cada índice ocupa espacio** pero es mínimo (<1MB para miles de docs)
4. **Actualizar índices requiere re-construcción** (puede tardar)

---

## 🚀 Impacto en Rendimiento

**Sin índices**:
- Consultas complejas fallan con error
- Firebase no puede ejecutar `where + orderBy`

**Con índices**:
- ✅ Consultas 10x más rápidas
- ✅ Reducción de 90% en tiempo de respuesta
- ✅ Menos lecturas de documentos innecesarios

---

## 📊 Monitoreo de Índices

Verifica el estado de tus índices en:
[Firebase Console → Firestore → Indexes](https://console.firebase.google.com/project/_/firestore/indexes)

Estados posibles:
- 🟢 **Enabled** - Índice funcionando
- 🟡 **Building** - Índice construyéndose (5-10 min)
- 🔴 **Error** - Índice con problemas

---

## ✅ Checklist

- [ ] Crear índice para `bookings` (userId + createdAt)
- [ ] Crear índice para `shared_calendars` (ownerId + createdAt)
- [ ] Crear índice para `calendar_events` (calendarId + startDate)
- [ ] Verificar estado "Enabled" en Firebase Console
- [ ] Probar consultas en desarrollo
- [ ] Deployar índices con `firebase deploy --only firestore:indexes`
