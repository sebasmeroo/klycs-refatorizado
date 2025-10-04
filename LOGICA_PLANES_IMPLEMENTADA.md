# Lógica de Planes y Suscripciones - Implementada

## ✅ Completado

### 1. Validación de Límites por Recurso

#### A) Creación de Tarjetas
**Archivo:** `src/components/cards/CardCreator.tsx`

**Lógica:**
- FREE: 1 tarjeta máximo
- PRO: 1 tarjeta máximo
- BUSINESS: Tarjetas ilimitadas

**Implementación:**
```typescript
// Antes de crear tarjeta
const limitsCheck = await subscriptionsService.checkPlanLimits(userId, 'cards_created');
if (!canProceed) {
  // Mostrar modal de upgrade
  setShowUpgradeModal(true);
  return;
}

// Después de crear
await subscriptionsService.recordUsage(userId, 'cards_created', 1, { cardId, cardTitle });
```

**Modal de Upgrade:** Muestra planes PRO (€9.99) y BUSINESS (€40) con características.

---

#### B) Creación de Calendarios
**Archivo:** `src/components/calendar/CreateCalendarModal.tsx`

**Lógica:**
- FREE: 0 calendarios (no puede crear)
- PRO: 1 calendario máximo
- BUSINESS: Calendarios ilimitados

**Implementación:**
```typescript
// Antes de crear calendario
const limitsCheck = await subscriptionsService.checkPlanLimits(user.id, 'calendars');
if (!canProceed) {
  if (planName === 'free') {
    setErrors({ general: 'Plan FREE: No puedes crear calendarios. Actualiza a PRO.' });
  } else if (planName === 'pro') {
    setErrors({ general: 'Plan PRO: Ya tienes tu calendario. Actualiza a BUSINESS.' });
  }
  setShowUpgradeModal(true);
  return;
}

// Después de crear
await subscriptionsService.recordUsage(user.id, 'calendars', 1, { calendarId, calendarName });
```

**Modal de Upgrade:** Similar al de tarjetas.

---

#### C) Agregar Profesionales
**Archivo:** `src/services/professionalService.ts`

**Lógica:**
- FREE: 0 profesionales (no puede agregar)
- PRO: Profesionales ilimitados
- BUSINESS: Profesionales ilimitados

**Implementación:**
```typescript
// Antes de agregar profesional
const limitsCheck = await subscriptionsService.checkPlanLimits(userId, 'professionals');
if (!canProceed) {
  if (planName === 'free') {
    throw new Error('Plan FREE: No puedes agregar profesionales. Actualiza a PRO.');
  }
}

// Después de agregar
await subscriptionsService.recordUsage(userId, 'professionals', 1, {
  professionalId,
  professionalName,
  professionalEmail
});
```

---

#### D) Crear Reservas/Eventos
**Archivo:** `src/services/collaborativeCalendar.ts`

**Lógica:**
- FREE: 0 reservas (no puede crear)
- PRO: Reservas ilimitadas
- BUSINESS: Reservas ilimitadas

**Implementación:**
```typescript
// Obtener ownerId del calendario
const calendarDoc = await getDoc(doc(db, 'shared_calendars', calendarId));
const ownerId = calendarData.ownerId;

// Validar límites
const limitsCheck = await subscriptionsService.checkPlanLimits(ownerId, 'bookings');
if (!canProceed) {
  if (planName === 'free') {
    throw new Error('Plan FREE: No puedes crear reservas. Actualiza a PRO.');
  }
}

// Después de crear evento
await subscriptionsService.recordUsage(ownerId, 'bookings', 1, {
  eventId,
  eventTitle,
  calendarId
});
```

---

### 2. Sistema de Renovación Automática para FREE

**Archivo:** `functions/src/renewFreeSubscriptions.ts`

**Lógica:**
- Cloud Function programada para ejecutarse diariamente a las 00:00 UTC
- Busca suscripciones FREE con `currentPeriodEnd` vencido
- Renueva automáticamente por 1 mes más

**Funciones creadas:**
1. `renewFreeSubscriptions` - Cron job automático
2. `renewFreeSubscriptionsManual` - Endpoint HTTP para testing manual

**Despliegue:**
```bash
cd functions
npm install
firebase deploy --only functions:renewFreeSubscriptions
```

**Testing manual:**
```bash
curl -X POST \
  -H "Authorization: Bearer test-token-change-in-production" \
  https://REGION-PROJECT_ID.cloudfunctions.net/renewFreeSubscriptionsManual
```

---

### 3. Hook de Estado de Suscripción

**Archivo:** `src/hooks/useSubscriptionStatus.ts`

**Propósito:** Hook React Query para verificar estado de suscripción en tiempo real.

**Retorna:**
```typescript
{
  isActive: boolean;
  planName: string;
  currentPeriodEnd: Date | null;
  daysUntilExpiration: number | null;
  isExpiringSoon: boolean; // < 7 días
  canAccessFeature: (feature) => boolean;
}
```

**Uso:**
```typescript
const { isActive, planName, canAccessFeature } = useSubscriptionStatus();

if (!canAccessFeature('calendars')) {
  // Mostrar modal de upgrade
}
```

---

### 4. Detección de Plan en Registro

**Archivo:** `src/pages/Register.tsx`

**Lógica:**
- Detecta parámetro `?plan=pro` o `?plan=business` en la URL
- Muestra indicador visual del plan seleccionado
- Guarda el plan seleccionado en logs
- Redirige a `/dashboard?upgrade=pro` para completar pago (cuando Stripe esté implementado)

**Flujo:**
1. Usuario hace clic en "Comenzar Ahora" en plan PRO → `/signup?plan=pro`
2. Formulario muestra badge con "Plan PRO - €9.99/mes"
3. Después de registro → Redirige a `/dashboard?upgrade=pro`
4. *TODO:* Dashboard detecta `?upgrade=pro` y abre checkout de Stripe

---

## 📊 Límites por Plan (Configurados)

### FREE
```javascript
{
  cards_created: 1,
  calendars: 0,
  professionals: 0,
  bookings: 0,
  views: 100,
  storage_mb: 15,
  portfolio_images: 3,
  portfolio_videos: 0,
  link_designs: 1,
  analytics_export: 0
}
```

### PRO (€9.99/mes)
```javascript
{
  cards_created: 1,
  calendars: 1,
  professionals: Infinity,
  bookings: Infinity,
  views: 10000,
  storage_mb: 200,
  portfolio_images: 30,
  portfolio_videos: 10,
  link_designs: 5,
  analytics_export: 10
}
```

### BUSINESS (€40/mes)
```javascript
{
  cards_created: Infinity,
  calendars: Infinity,
  professionals: Infinity,
  bookings: Infinity,
  views: Infinity,
  storage_mb: 5000,
  portfolio_images: Infinity,
  portfolio_videos: Infinity,
  link_designs: 5,
  analytics_export: Infinity
}
```

---

## 🔄 Flujo Completo de Suscripción

### Usuario FREE
1. Registro → Plan FREE automático
2. Puede crear 1 tarjeta
3. **No puede:**
   - Crear calendarios
   - Agregar profesionales
   - Crear reservas
4. Al intentar → Modal de upgrade a PRO/BUSINESS

### Usuario PRO
1. Registro con `?plan=pro`
2. *TODO:* Checkout de Stripe
3. Webhook actualiza `user_subscriptions`
4. Puede:
   - 1 tarjeta
   - 1 calendario
   - Profesionales ilimitados
   - Reservas ilimitadas

### Usuario BUSINESS
1. Registro con `?plan=business`
2. *TODO:* Checkout de Stripe
3. Todo ilimitado

---

## 🚀 Próximos Pasos (NO Implementados)

### 1. Integración Stripe
**Pendiente:**
- Crear productos en Stripe Dashboard
- Implementar checkout session
- Webhook endpoint para eventos:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

**Archivos a crear:**
- `src/services/stripeCheckout.ts`
- `functions/src/stripeWebhook.ts`

### 2. Bloqueo por Pago Fallido
**Pendiente:**
- Detectar `status: 'past_due'` en suscripción
- Mostrar banner de "Actualizar método de pago"
- Bloquear acceso a funciones premium si pago falla más de 7 días

### 3. Cancelación y Downgrades
**Pendiente:**
- Botón "Cancelar suscripción" en settings
- Mantener acceso hasta `currentPeriodEnd`
- Cambiar a FREE después de expiración
- Validar que no exceda límites de FREE al hacer downgrade

### 4. Dashboard de Admin
**Pendiente:**
- Ver todas las suscripciones
- Métricas de conversión
- Ingresos mensuales
- Cancelaciones/churns

---

## 📝 Notas Importantes

1. **Suscripciones FREE** se renuevan automáticamente cada mes (sin cobro)
2. **Suscripciones de Pago** se renuevan automáticamente en Stripe
3. **Webhooks de Stripe** actualizarán `currentPeriodEnd` automáticamente
4. **Uso registrado** en `usage_records` para análisis futuro
5. **React Query** cachea límites por 5 minutos para reducir lecturas de Firestore

---

## 🔍 Testing

### Validar Límites
```javascript
// En consola del navegador
const result = await subscriptionsService.checkPlanLimits(userId, 'calendars');
console.log(result.data);
// { current: 0, limit: 0, canProceed: false, plan: {...} }
```

### Renovar FREE manualmente
```bash
# Ejecutar función manual
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  https://REGION-PROJECT.cloudfunctions.net/renewFreeSubscriptionsManual
```

### Simular upgrade
```javascript
// Cambiar plan en Firestore
await updateDoc(doc(db, 'users', userId), {
  plan: 'PRO'
});

// Crear suscripción
await subscriptionsService.createFreeSubscription(userId, 'pro_plan_id');
```

---

## ✅ Checklist de Implementación

- [x] Validación de límites en creación de tarjetas
- [x] Validación de límites en creación de calendarios
- [x] Validación de límites al agregar profesionales
- [x] Validación de límites en reservas
- [x] Modales de upgrade con planes
- [x] Cloud Function de renovación FREE
- [x] Hook useSubscriptionStatus
- [x] Detección de plan en registro
- [x] Indicador visual de plan seleccionado
- [x] Registro de uso (usage_records)
- [ ] Checkout de Stripe
- [ ] Webhooks de Stripe
- [ ] Bloqueo por pago fallido
- [ ] Cancelación de suscripción
- [ ] Dashboard de admin

---

## 🎯 Siguientes Pasos

1. **Configurar Stripe:**
   - Crear productos PRO y BUSINESS
   - Obtener Price IDs
   - Configurar webhooks

2. **Implementar Checkout:**
   - Crear sesión de Stripe Checkout
   - Redirigir desde `/dashboard?upgrade=pro`
   - Success/cancel URLs

3. **Implementar Webhooks:**
   - Endpoint en Cloud Functions
   - Verificar firma de Stripe
   - Actualizar `user_subscriptions`

4. **Testing:**
   - Modo test de Stripe
   - Tarjetas de prueba
   - Webhooks locales con Stripe CLI
