# 📋 Mejores Prácticas para Mantener Costes Bajos

## 🎯 Reglas de Oro

### 1. ✅ SIEMPRE Usa React Query para Lecturas de Firebase

**❌ NUNCA hagas esto:**
```typescript
useEffect(() => {
  const loadData = async () => {
    const data = await getDoc(doc(db, 'cards', cardId));
    setCard(data);
  };
  loadData();
}, [cardId]);
```

**✅ SIEMPRE haz esto:**
```typescript
import { useCard } from '@/hooks/useCards';

const { data: card } = useCard(cardId);
```

**Por qué:** React Query cachea los datos por 5 minutos. Sin cache, cada render = nueva lectura de Firebase.

---

### 2. ✅ USA los Hooks Disponibles

Hooks ya creados con cache automático:

#### Para Calendarios:
```typescript
import {
  useUserCalendars,       // Calendarios del usuario
  useCalendar,            // Calendario específico
  useCalendarEvents,      // Eventos de un calendario
  useMultipleCalendarEvents, // Eventos de múltiples calendarios
  useCreateCalendar,      // Crear calendario
  useCreateEvent,         // Crear evento
  useUpdateEvent,         // Actualizar evento
  useDeleteEvent          // Eliminar evento
} from '@/hooks/useCalendar';
```

#### Para Reservas:
```typescript
import {
  useUserBookings,        // Reservas del usuario
  useBookingStats,        // Estadísticas de reservas
  useCreateBooking,       // Crear reserva
  useUpdateBooking,       // Actualizar reserva
  useCancelBooking        // Cancelar reserva
} from '@/hooks/useBookings';
```

#### Para Tarjetas:
```typescript
import {
  useUserCards,           // Tarjetas del usuario
  useCard,                // Tarjeta específica
  useCardBySlug,          // Tarjeta por slug
  useCreateCard,          // Crear tarjeta
  useUpdateCard,          // Actualizar tarjeta
  useDeleteCard,          // Eliminar tarjeta
  useIncrementCardViews   // Incrementar vistas
} from '@/hooks/useCards';
```

---

### 3. ✅ NO Uses `onSnapshot` Sin Cleanup

**❌ NUNCA hagas esto:**
```typescript
useEffect(() => {
  onSnapshot(query, (snapshot) => {
    setData(snapshot.docs);
  });
  // ❌ Sin return → listener NUNCA se elimina
}, []);
```

**✅ SIEMPRE haz esto:**
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(query, (snapshot) => {
    setData(snapshot.docs);
  });

  // ✅ Cleanup: elimina listener al desmontar
  return () => unsubscribe();
}, []);
```

**Por qué:** Sin cleanup, cada navegación crea un nuevo listener. Después de 100 navegaciones = 100 listeners activos = 100x más lecturas.

---

### 4. ✅ USA getDocs en Lugar de onSnapshot Cuando Sea Posible

**❌ Evita esto:**
```typescript
// onSnapshot: Escucha cambios en TIEMPO REAL
onSnapshot(query, (snapshot) => {
  setData(snapshot.docs);
});
// Cada cambio en Firestore = Nueva lectura
```

**✅ Prefiere esto:**
```typescript
// getDocs: Carga UNA VEZ
const snapshot = await getDocs(query);
setData(snapshot.docs);
// Solo 1 lectura
```

**Cuándo usar onSnapshot:**
- Chat en tiempo real
- Dashboard de métricas en vivo
- Notificaciones instantáneas

**Cuándo usar getDocs:**
- Listados de tarjetas
- Perfil de usuario
- Configuración
- Todo lo demás

---

### 5. ✅ Invalida Cache Solo Cuando Sea Necesario

**❌ NO hagas esto:**
```typescript
// Invalidar cache en cada click
onClick={() => {
  queryClient.invalidateQueries({ queryKey: ['cards'] });
}}
```

**✅ HAZ esto:**
```typescript
// Invalidar cache solo después de mutations
const updateCard = useUpdateCard();

onClick={async () => {
  await updateCard.mutateAsync({ cardId, updates });
  // ✅ El hook ya invalida automáticamente
}}
```

**Por qué:** Invalidar cache fuerza una recarga de Firebase. Los hooks de mutation ya invalidan automáticamente.

---

### 6. ✅ NO Leas Firebase en Loops

**❌ NUNCA hagas esto:**
```typescript
for (const cardId of cardIds) {
  const card = await getDoc(doc(db, 'cards', cardId)); // 💸💸💸
  cards.push(card);
}
// 100 tarjetas = 100 lecturas
```

**✅ HAZ esto:**
```typescript
// Usa query con 'in' operator
const q = query(
  collection(db, 'cards'),
  where(documentId(), 'in', cardIds.slice(0, 10)) // Máx 10 por query
);
const snapshot = await getDocs(q);
// 100 tarjetas = 1 lectura (si usas paginación correcta)
```

**Por qué:** Firebase cobra por lectura de documento. Leer 100 documentos en loop = 100x más caro.

---

### 7. ✅ USA Paginación para Listas Largas

**❌ NO hagas esto:**
```typescript
// Cargar TODAS las tarjetas del usuario
const q = query(collection(db, 'cards'), where('userId', '==', userId));
const snapshot = await getDocs(q);
// 1000 tarjetas = 1000 lecturas
```

**✅ HAZ esto:**
```typescript
// Cargar solo 10 tarjetas por página
const q = query(
  collection(db, 'cards'),
  where('userId', '==', userId),
  limit(10)
);
const snapshot = await getDocs(q);
// Primera página = 10 lecturas
```

**Por qué:** Usuarios rara vez ven más de 10-20 items a la vez. ¿Para qué cargar 1000?

---

### 8. ✅ Configura Índices de Firestore

Si ves este error:
```
The query requires an index
```

**Solución:**
1. Haz clic en el enlace del error (abre Firebase Console)
2. Firebase crea el índice automáticamente
3. Espera 5-10 minutos

**O manualmente:**
```bash
firebase deploy --only firestore:indexes
```

**Por qué:** Sin índices, las queries complejas son lentas y pueden costar más.

---

### 9. ✅ Monitorea Costes Semanalmente

**Comando en consola del navegador:**
```javascript
firebaseStats()  // Ver uso de última hora
firebaseCost()   // Ver proyección mensual
```

**Umbrales de alerta:**
- 🟢 <1,000 lecturas/hora = NORMAL
- 🟡 1,000-5,000 lecturas/hora = REVISAR
- 🔴 >5,000 lecturas/hora = PROBLEMA

**Si ves >5,000/hora:**
1. Ejecuta `firebaseStats()` en consola
2. Busca en código dónde se está leyendo tanto
3. Agrega React Query o elimina listeners sin cleanup

---

### 10. ✅ USA Lazy Loading para Imágenes

**❌ NO hagas esto:**
```typescript
<img src={card.imageUrl} alt="Card" />
// Descarga imagen inmediatamente
```

**✅ HAZ esto:**
```typescript
<img
  src={card.imageUrl}
  alt="Card"
  loading="lazy"  // ✅ Solo carga cuando es visible
/>
```

**Por qué:** Firebase cobra por bandwidth. Lazy loading reduce descargas en 50-80%.

---

## 📊 Checklist Mensual

- [ ] Ejecutar `firebaseStats()` y verificar <1,000 lecturas/hora
- [ ] Revisar Firebase Console → Usage
- [ ] Verificar que índices estén "Enabled"
- [ ] Revisar logs de errores (Firebase Console → Firestore → Rules)
- [ ] Actualizar límites de planes si es necesario

---

## 🚨 Señales de Alerta

### ⚠️ Lecturas Excesivas
**Síntoma:** >10,000 lecturas/hora
**Causa probable:**
- Listeners sin cleanup
- Loops infinitos en useEffect
- onSnapshot en componentes que se renderizan mucho

**Solución:**
1. Ejecuta `firebaseStats()` para confirmar
2. Busca en código: `onSnapshot` sin `return () => unsubscribe()`
3. Busca: `useEffect` que llama Firebase sin dependencias correctas

### ⚠️ Escrituras Excesivas
**Síntoma:** >1,000 escrituras/hora
**Causa probable:**
- Increment views en loop
- Auto-save demasiado frecuente

**Solución:**
1. Agrega debounce a auto-save (esperar 2-3 segundos)
2. No incrementes views en desarrollo (solo en producción)

### ⚠️ Descargas Excesivas
**Síntoma:** >100MB/hora
**Causa probable:**
- Imágenes sin lazy loading
- Videos sin compresión

**Solución:**
1. Agrega `loading="lazy"` a todas las imágenes
2. Usa `ImageCompressionService` para reducir tamaño

---

## 💰 Proyección de Costes Optimizados

Con TODAS las optimizaciones implementadas:

| Usuarios Activos/Mes | Lecturas/Mes | Coste/Mes |
|----------------------|--------------|-----------|
| 100 | 500,000 | €0.18 |
| 1,000 | 5,000,000 | €1.80 |
| 10,000 | 50,000,000 | €18.00 |
| 100,000 | 500,000,000 | €180.00 |

**Plan Spark (Gratis):**
- 50,000 lecturas/día
- 20,000 escrituras/día
- 10GB storage
- **Soporta ~300 usuarios activos/día GRATIS** ✅

**Plan Blaze (Pago por uso):**
- Lecturas: €0.036 por 100,000
- Escrituras: €0.108 por 100,000
- Storage: €0.026/GB/mes
- Bandwidth: €0.12/GB

---

## ✅ Resumen

1. ✅ USA React Query para TODAS las lecturas
2. ✅ USA hooks disponibles (`useCards`, `useCalendar`, `useBookings`)
3. ✅ NUNCA uses `onSnapshot` sin cleanup
4. ✅ Prefiere `getDocs` sobre `onSnapshot`
5. ✅ Invalida cache solo en mutations
6. ✅ NO leas Firebase en loops
7. ✅ USA paginación con `limit()`
8. ✅ Configura índices de Firestore
9. ✅ Monitorea con `firebaseStats()` semanalmente
10. ✅ USA `loading="lazy"` en imágenes

**Siguiendo estas reglas, mantendrás los costes en <€5/mes con 1,000 usuarios activos.** 🎉

---

**Última actualización:** 2 de Octubre 2025
**Responsable:** Mantener estas prácticas siempre
