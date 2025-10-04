# Manual de Testing - Sistema de Suscripciones

## Índice
1. [Configuración Inicial](#configuración-inicial)
2. [Testing de Límites por Plan](#testing-de-límites-por-plan)
3. [Testing de Validación de Downgrades](#testing-de-validación-de-downgrades)
4. [Testing de Renovación Automática](#testing-de-renovación-automática)
5. [Testing del Hook de Estado](#testing-del-hook-de-estado)
6. [Comandos de Consola Útiles](#comandos-de-consola-útiles)

---

## Configuración Inicial

### 1. Preparar entorno de testing

```bash
# Asegurarse de que el servidor está corriendo
npm run dev

# En otra terminal, iniciar Firebase Emulators (si aplica)
firebase emulators:start
```

### 2. Crear usuarios de prueba

Necesitarás 3 usuarios de prueba, uno por cada plan:

- **Usuario FREE**: `test-free@klycs.com` / `password123`
- **Usuario PRO**: `test-pro@klycs.com` / `password123`
- **Usuario BUSINESS**: `test-business@klycs.com` / `password123`

### 3. Asignar planes manualmente en Firestore

Ve a Firebase Console > Firestore y crea documentos en `user_subscriptions`:

**Para Usuario FREE:**
```json
{
  "userId": "[UID del usuario]",
  "planId": "free",
  "status": "active",
  "currentPeriodStart": [Timestamp ahora],
  "currentPeriodEnd": [Timestamp +30 días],
  "stripeSubscriptionId": "",
  "createdAt": [Timestamp ahora],
  "updatedAt": [Timestamp ahora]
}
```

**Para Usuario PRO:**
```json
{
  "userId": "[UID del usuario]",
  "planId": "pro",
  "status": "active",
  "currentPeriodStart": [Timestamp ahora],
  "currentPeriodEnd": [Timestamp +30 días],
  "stripeSubscriptionId": "test_stripe_sub_pro",
  "createdAt": [Timestamp ahora],
  "updatedAt": [Timestamp ahora]
}
```

**Para Usuario BUSINESS:**
```json
{
  "userId": "[UID del usuario]",
  "planId": "business",
  "status": "active",
  "currentPeriodStart": [Timestamp ahora],
  "currentPeriodEnd": [Timestamp +30 días],
  "stripeSubscriptionId": "test_stripe_sub_business",
  "createdAt": [Timestamp ahora],
  "updatedAt": [Timestamp ahora]
}
```

---

## Testing de Límites por Plan

### Test 1: Límite de Tarjetas (FREE)

**Plan FREE: Máximo 1 tarjeta**

1. Inicia sesión con `test-free@klycs.com`
2. Ve a `/dashboard`
3. Intenta crear la primera tarjeta:
   - ✅ Debe permitir crear
   - ✅ Debe aparecer en la lista
4. Intenta crear una segunda tarjeta:
   - ✅ Debe mostrar toast: "Plan FREE: Solo puedes crear 1 tarjeta. Actualiza a PRO."
   - ✅ Debe mostrar modal de upgrade
   - ✅ NO debe crear la tarjeta

**Validación en consola:**
```javascript
// Abrir DevTools > Console
const userId = '[TU_USER_ID]';
const result = await subscriptionsService.checkPlanLimits(userId, 'cards_created');
console.log(result.data);
// Esperado: { current: 1, limit: 1, canProceed: false, plan: {...} }
```

---

### Test 2: Límite de Calendarios (FREE vs PRO)

**Plan FREE: 0 calendarios**

1. Inicia sesión con `test-free@klycs.com`
2. Ve a `/calendar`
3. Haz clic en "Crear Calendario"
4. Intenta crear un calendario:
   - ✅ Debe mostrar error: "Plan FREE: No puedes crear calendarios. Actualiza a PRO."
   - ✅ Debe mostrar modal de upgrade
   - ✅ NO debe crear el calendario

**Plan PRO: Máximo 1 calendario**

1. Inicia sesión con `test-pro@klycs.com`
2. Ve a `/calendar`
3. Crea el primer calendario:
   - ✅ Debe permitir crear
   - ✅ Debe aparecer en la lista
4. Intenta crear un segundo calendario:
   - ✅ Debe mostrar error: "Plan PRO: Solo puedes crear 1 calendario. Actualiza a BUSINESS."
   - ✅ Debe mostrar modal de upgrade
   - ✅ NO debe crear el calendario

**Plan BUSINESS: Ilimitados**

1. Inicia sesión con `test-business@klycs.com`
2. Ve a `/calendar`
3. Crea múltiples calendarios (2-3):
   - ✅ Debe permitir crear todos
   - ✅ NO debe mostrar ningún error de límite

---

### Test 3: Límite de Profesionales (FREE vs PRO/BUSINESS)

**Plan FREE: 0 profesionales**

1. Inicia sesión con `test-free@klycs.com`
2. Ve a `/dashboard/team`
3. Intenta agregar un profesional:
   - ✅ Debe lanzar error: "Plan FREE: No puedes agregar profesionales. Actualiza a PRO."
   - ✅ NO debe crear el profesional

**Plan PRO/BUSINESS: Ilimitados**

1. Inicia sesión con `test-pro@klycs.com`
2. Ve a `/dashboard/team`
3. Agrega múltiples profesionales (2-3):
   - ✅ Debe permitir agregar todos
   - ✅ NO debe mostrar ningún error de límite

**Validación en consola:**
```javascript
const userId = '[USER_ID]';
const result = await subscriptionsService.checkPlanLimits(userId, 'professionals');
console.log(result.data);
```

---

### Test 4: Límite de Reservas/Bookings (FREE vs PRO/BUSINESS)

**Plan FREE: 0 reservas**

1. Inicia sesión con `test-free@klycs.com`
2. Ve a un calendario público (si existe)
3. Intenta crear una reserva/evento:
   - ✅ Debe lanzar error: "Plan FREE: No puedes crear reservas. Actualiza a PRO."
   - ✅ NO debe crear la reserva

**Plan PRO/BUSINESS: Ilimitadas**

1. Inicia sesión con `test-pro@klycs.com`
2. Ve a `/calendar` o `/professional-calendar`
3. Crea múltiples eventos/reservas (2-3):
   - ✅ Debe permitir crear todos
   - ✅ NO debe mostrar ningún error de límite

**Validación en consola:**
```javascript
const userId = '[USER_ID]';
const result = await subscriptionsService.checkPlanLimits(userId, 'bookings');
console.log(result.data);
```

---

## Testing de Validación de Downgrades

### Test 5: Downgrade de BUSINESS a PRO (con recursos excedentes)

**Escenario: Usuario BUSINESS con 3 calendarios intenta bajar a PRO**

1. Como `test-business@klycs.com`, crea 3 calendarios
2. Ve a `/dashboard/settings`
3. En la sección "Suscripción y Planes", haz clic en "Actualizar a PRO" en la tarjeta del plan PRO
4. Resultado esperado:
   - ✅ Debe mostrar toast de error: "No puedes cambiar a PRO: Tienes 3 calendarios. El plan PRO permite máximo 1. Elimina recursos antes de hacer el downgrade."
   - ✅ NO debe cambiar el plan

### Test 6: Downgrade de PRO a FREE (con recursos excedentes)

**Escenario: Usuario PRO con 1 tarjeta + 1 calendario + 2 profesionales intenta bajar a FREE**

1. Como `test-pro@klycs.com`:
   - Crea 1 tarjeta
   - Crea 1 calendario
   - Agrega 2 profesionales
2. Ve a `/dashboard/settings`
3. Haz clic en "Cambiar a FREE"
4. Resultado esperado:
   - ✅ Debe mostrar error: "No puedes cambiar a FREE: Tienes 1 calendarios. El plan FREE permite máximo 0. Tienes 2 profesionales. El plan FREE permite máximo 0. Elimina recursos antes de hacer el downgrade."
   - ✅ NO debe cambiar el plan

### Test 7: Downgrade válido

**Escenario: Usuario PRO con solo 1 tarjeta baja a FREE**

1. Como `test-pro@klycs.com`, asegúrate de tener:
   - 1 tarjeta creada
   - 0 calendarios
   - 0 profesionales
2. Ve a `/dashboard/settings`
3. Haz clic en "Cambiar a FREE"
4. Resultado esperado:
   - ✅ Debe mostrar mensaje: "Para cambiar a un plan inferior, contáctanos en sales@klycs.com"

**Nota:** El downgrade automático está deshabilitado. Los usuarios deben contactar soporte.

---

## Testing de Renovación Automática

### Test 8: Renovación automática de plan FREE

**Preparación:**

1. En Firestore, modifica el documento `user_subscriptions` del usuario FREE:
   - Cambia `currentPeriodEnd` a una fecha pasada (ej: ayer)
   - Asegúrate de que `stripeSubscriptionId` esté vacío (`""`)

2. Ejecuta la Cloud Function manualmente:

```bash
# Opción 1: Mediante URL local (si estás en emulators)
curl http://localhost:5001/[PROJECT_ID]/us-central1/renewFreeSubscriptionsManual

# Opción 2: Mediante consola de Firebase
# Ve a Firebase Console > Functions > renewFreeSubscriptionsManual > Testing
# Ejecuta la función
```

3. Verifica en Firestore:
   - ✅ `currentPeriodEnd` debe haberse extendido +1 mes desde la fecha original
   - ✅ `currentPeriodStart` debe ser la antigua `currentPeriodEnd`
   - ✅ `updatedAt` debe ser el timestamp actual

**Validación en consola:**
```javascript
const userId = '[USER_ID_FREE]';
const result = await subscriptionsService.getUserSubscription(userId);
console.log('Current Period End:', result.data.currentPeriodEnd);
console.log('Status:', result.data.status);
// Esperado: status = 'active', currentPeriodEnd = fecha futura
```

---

## Testing del Hook de Estado

### Test 9: Hook useSubscriptionStatus

**Verificar datos del hook en diferentes planes:**

1. Abre DevTools > React Developer Tools
2. Selecciona un componente que use `useSubscriptionStatus` (ej: `SubscriptionSettings`)
3. Inspecciona los hooks en el panel derecho

**Para plan FREE:**
```javascript
// En consola:
const { subscriptionStatus } = useSubscriptionStatus();
console.log({
  isActive: subscriptionStatus.isActive,           // true
  planName: subscriptionStatus.planName,           // 'FREE'
  daysUntilExpiration: subscriptionStatus.daysUntilExpiration, // ~30
  isExpiringSoon: subscriptionStatus.isExpiringSoon,     // false
  canAccessCalendars: subscriptionStatus.canAccessFeature('calendars') // false
});
```

**Para plan PRO:**
```javascript
console.log({
  isActive: subscriptionStatus.isActive,           // true
  planName: subscriptionStatus.planName,           // 'PRO'
  canAccessCalendars: subscriptionStatus.canAccessFeature('calendars'), // true
  canAccessProfessionals: subscriptionStatus.canAccessFeature('professionals') // true
});
```

### Test 10: Caché de React Query

**Verificar que los datos se cachean correctamente:**

1. Navega a `/dashboard/settings`
2. Abre DevTools > Network
3. Filtra por `firestore` o `subscriptions`
4. Observa las peticiones iniciales
5. Navega a otra página y vuelve a `/dashboard/settings` dentro de 5 minutos
6. Resultado esperado:
   - ✅ NO debe hacer nuevas peticiones a Firestore
   - ✅ Los datos deben cargarse instantáneamente desde caché

---

## Comandos de Consola Útiles

### Verificar límites actuales de un usuario

```javascript
const userId = 'TU_USER_ID';

// Ver todas las validaciones a la vez
const checks = await Promise.all([
  subscriptionsService.checkPlanLimits(userId, 'cards_created'),
  subscriptionsService.checkPlanLimits(userId, 'calendars'),
  subscriptionsService.checkPlanLimits(userId, 'professionals'),
  subscriptionsService.checkPlanLimits(userId, 'bookings')
]);

console.table(checks.map((c, i) => ({
  resource: ['cards', 'calendars', 'professionals', 'bookings'][i],
  current: c.data.current,
  limit: c.data.limit,
  canProceed: c.data.canProceed
})));
```

### Ver uso actual de recursos

```javascript
const userId = 'TU_USER_ID';

const usage = await subscriptionsService.getCurrentUsage(userId, 'cards_created');
console.log('Cards created:', usage);

const calendars = await subscriptionsService.getCurrentUsage(userId, 'calendars');
console.log('Calendars:', calendars);

const professionals = await subscriptionsService.getCurrentUsage(userId, 'professionals');
console.log('Professionals:', professionals);
```

### Simular cambio de plan

```javascript
const userId = 'TU_USER_ID';
const newPlanId = 'pro'; // o 'business' o 'free'

const result = await subscriptionsService.changePlan(userId, newPlanId);
console.log(result);
```

### Ver registros de uso (usage_records)

```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const userId = 'TU_USER_ID';
const usageQuery = query(
  collection(db, 'usage_records'),
  where('userId', '==', userId)
);

const snapshot = await getDocs(usageQuery);
const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
console.table(records);
```

---

## Checklist de Testing Completo

Marca cada test al completarlo:

**Límites de Recursos:**
- [ ] Test 1: Límite de tarjetas en FREE (1 máx)
- [ ] Test 2a: Límite de calendarios en FREE (0)
- [ ] Test 2b: Límite de calendarios en PRO (1 máx)
- [ ] Test 2c: Calendarios ilimitados en BUSINESS
- [ ] Test 3a: Límite de profesionales en FREE (0)
- [ ] Test 3b: Profesionales ilimitados en PRO
- [ ] Test 4a: Límite de reservas en FREE (0)
- [ ] Test 4b: Reservas ilimitadas en PRO

**Validación de Downgrades:**
- [ ] Test 5: Downgrade BUSINESS→PRO bloqueado (exceso de calendarios)
- [ ] Test 6: Downgrade PRO→FREE bloqueado (exceso de recursos)
- [ ] Test 7: Mensaje de contacto en downgrades

**Renovación y Estado:**
- [ ] Test 8: Renovación automática de plan FREE
- [ ] Test 9: Hook useSubscriptionStatus retorna datos correctos
- [ ] Test 10: Caché de React Query funciona (5 min)

**UI y UX:**
- [ ] Modales de upgrade se muestran correctamente
- [ ] Toasts de error son claros y específicos
- [ ] Página de Settings muestra plan actual
- [ ] Comparador de planes funciona
- [ ] Badges de "Plan Actual" y "Más Popular" se muestran

---

## Problemas Conocidos

1. **Downgrade automático deshabilitado**: Por diseño, los downgrades muestran mensaje de contacto a sales@klycs.com
2. **Stripe no integrado**: Los upgrades muestran modal con mensaje "Próximamente disponible con Stripe"
3. **Cloud Function renovación**: Debe desplegarse a Firebase Functions para funcionar automáticamente

---

## Siguientes Pasos

Una vez completado el testing manual:

1. [ ] Integrar Stripe Checkout
2. [ ] Configurar Webhooks de Stripe
3. [ ] Crear tests automatizados con Jest/Vitest
4. [ ] Desplegar Cloud Function de renovación
5. [ ] Configurar monitoreo de errores (Sentry)
