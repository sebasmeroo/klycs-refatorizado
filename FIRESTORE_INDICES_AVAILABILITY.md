# Índices Firestore Requeridos para Professional Availability

## Índices Compuestos Necesarios

### 1. Query por rango de fechas y calendario
```
Colección: professional_availability
Campos:
  - calendarId (Ascending)
  - date (Ascending)
```

**Propósito**: Usado por `getAvailabilityByDateRange()` para obtener todas las disponibilidades de un calendario en un rango de fechas.

---

### 2. Query por rango de fechas, calendario y estado
```
Colección: professional_availability
Campos:
  - calendarId (Ascending)
  - status (Ascending)
  - date (Ascending)
```

**Propósito**: Usado por `getAvailabilityByDateRange()` cuando se filtra por estado específico (pending/approved/rejected).

---

### 3. Query para inbox (solicitudes pendientes)
```
Colección: professional_availability
Campos:
  - calendarId (Ascending)
  - status (Ascending)
  - requestedAt (Descending)
```

**Propósito**: Usado por `getPendingAvailabilities()` para obtener solicitudes pendientes ordenadas por fecha de solicitud.

---

### 4. Query para conteo de pendientes
```
Colección: professional_availability
Campos:
  - calendarId (Ascending)
  - status (Ascending)
```

**Propósito**: Usado por `getPendingCount()` para obtener el conteo de solicitudes pendientes.

---

## Cómo Configurar los Índices

### Opción 1: Configuración Manual en Firebase Console

1. Ve a Firebase Console → Firestore Database → Indexes
2. Crea los 4 índices compuestos listados arriba
3. Espera a que se construyan (puede tomar unos minutos)

### Opción 2: Usando Firebase CLI

Agrega estos índices a tu `firestore.indexes.json`:

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
    },
    {
      "collectionGroup": "professional_availability",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "calendarId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Luego ejecuta:
```bash
firebase deploy --only firestore:indexes
```

---

## Reglas de Seguridad Firestore

Añade estas reglas a tu `firestore.rules` para la colección `professional_availability`:

```javascript
match /professional_availability/{availabilityId} {
  // Los profesionales pueden crear solicitudes
  allow create: if request.auth != null
    && request.resource.data.professionalId == request.auth.uid
    && request.resource.data.status == 'pending';

  // Los profesionales pueden leer sus propias solicitudes
  allow read: if request.auth != null
    && (resource.data.professionalId == request.auth.uid
        || get(/databases/$(database)/documents/shared_calendars/$(resource.data.calendarId)).data.ownerId == request.auth.uid);

  // Solo el owner del calendario puede aprobar/rechazar
  allow update: if request.auth != null
    && get(/databases/$(database)/documents/shared_calendars/$(resource.data.calendarId)).data.ownerId == request.auth.uid
    && (request.resource.data.status in ['approved', 'rejected']);

  // Los profesionales pueden eliminar sus propias solicitudes pendientes
  allow delete: if request.auth != null
    && resource.data.professionalId == request.auth.uid
    && resource.data.status == 'pending';
}
```

---

## Estimación de Costes

Con los índices optimizados y cache agresivo:

### Lecturas
- Inbox inicial: ~1 read (query) + N reads (documentos) = 1-10 reads
- Cache de 2 minutos para inbox
- Disponibilidades por rango: ~1 read (query) + M reads (documentos) = 1-20 reads
- Cache de 5 minutos para disponibilidades
- Badge count: ~1 read (query optimizado)
- Cache de 1 minuto para badge

### Escrituras
- Crear solicitud: 1 write
- Aprobar/Rechazar: 1 write
- Batch approve (N solicitudes): ⌈N/500⌉ batch writes

### Estimación mensual (10 profesionales, 50 solicitudes/mes)
- Lecturas: ~1,000 reads/mes ≈ $0.00036
- Escrituras: ~100 writes/mes ≈ $0.00036

**Total estimado: ~$0.0007/mes** (menos de 1 centavo)

---

## Testing

Para verificar que los índices están funcionando correctamente:

1. **Monitoreo de errores**:
   - Abre la consola del navegador
   - Si faltan índices, Firestore mostrará un error con un enlace para crearlos

2. **Verificación manual**:
   - Crea una solicitud de disponibilidad desde el calendario profesional
   - Verifica que aparezca en el Inbox del owner
   - Aprueba/rechaza y verifica que se actualice correctamente

3. **Performance**:
   - Las queries deben completarse en < 500ms
   - El badge count debe actualizarse instantáneamente

---

## Troubleshooting

### Error: "The query requires an index"
- Firestore te dará un enlace directo para crear el índice
- Alternativamente, sigue las instrucciones de configuración manual arriba

### Las solicitudes no aparecen en el Inbox
- Verifica que el `calendarId` sea correcto
- Verifica que el `status` sea 'pending'
- Revisa las reglas de seguridad

### El badge count no se actualiza
- Verifica que el cache no esté bloqueando actualizaciones
- Fuerza un refetch: `queryClient.invalidateQueries(['availability', 'pendingCount'])`
