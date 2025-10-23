# Referencias de Código - Flujo de Pagos

## Archivos Clave

### 1. Cálculo de Horas Base
**Archivo:** `/src/services/workHoursAnalytics.ts`

- **Línea 120-163:** `calculateWorkHours()` - Calcula horas en un rango de fechas
- **Línea 169-324:** `getProfessionalStats()` - Estadísticas anuales desglosadas por mes (estrategia híbrida)
- **Línea 330-345:** `getAllProfessionalsStats()` - Procesa múltiples profesionales en paralelo

### 2. Períodos de Pago
**Archivo:** `/src/utils/paymentPeriods.ts`

- **Línea 41-192:** `getCurrentPaymentPeriod()` - Calcula período actual basado en tipo de pago
  - **Línea 56-63:** DAILY
  - **Línea 66-106:** WEEKLY
  - **Línea 108-149:** BIWEEKLY
  - **Línea 151-184:** MONTHLY
- **Línea 217-254:** `getPaymentPeriodsForYear()` - Genera todos los períodos de un año

### 3. Hooks de Datos

#### useWorkHoursByPeriod
**Archivo:** `/src/hooks/useWorkHoursByPeriod.ts`

- **Línea 45-173:** Hook principal para obtener horas por período de pago actual
  - **Línea 66-90:** Encuentra última fecha de pago registrada
  - **Línea 93:** Calcula período actual
  - **Línea 97-129:** Función auxiliar `buildStatsForPeriod()` para calcular stats
  - **Línea 133-151:** Genera historial de últimos 3 períodos
- **Línea 178-210:** `useWorkHoursByPeriodTotals()` - Agrega totales

#### useWorkHoursStats
**Archivo:** `/src/hooks/useWorkHoursStats.ts`

- **Línea 27-83:** Hook para estadísticas anuales con caché multi-capa
  - **Línea 43-49:** Intenta obtener de localStorage (PersistentCache)
  - **Línea 64-68:** Llamada a `getAllProfessionalsStats()`
  - **Línea 71:** Guarda en PersistentCache
- **Línea 88-121:** `useWorkHoursTotals()` - Calcula totales agregados

#### usePaymentStats
**Archivo:** `/src/hooks/usePaymentStats.ts`

- **Línea 17-71:** Hook para estadísticas de pagos (idéntico a useWorkHoursStats)
- **Línea 80-148:** `usePaymentPendingServices()` - Obtiene servicios no completados
- **Línea 154-189:** `useUpdatePayoutDetails()` - Mutation para actualizar configuración
- **Línea 195-235:** `useUpdatePayoutRecord()` - Mutation para marcar pago
- **Línea 242-297:** `useUpdatePayoutComplete()` - Mutation combinada (detalles + registro)

### 4. Componentes de UI

#### DashboardWorkHours
**Archivo:** `/src/pages/DashboardWorkHours.tsx`

- **Línea 27-31:** Carga de `useWorkHoursStats`
- **Línea 257-327:** Renderizado de lista de profesionales con desglose mensual

#### DashboardStripe
**Archivo:** `/src/pages/DashboardStripe.tsx` (3,735 líneas)

- **Línea 382-393:** Carga de hooks (`usePaymentStats` + `useWorkHoursByPeriod`)
- **Línea 432-450:** Cálculo de `periodRange` (año, mes, trimestre)
- **Línea 491-525:** **CRÍTICO:** `statsForDisplay` - Diferencia entre period='payment' vs otros
- **Línea 527-531:** Mapeo `statsByPeriodMap` (contiene lógica confusa con Array.isArray())
- **Línea 533-581:** **CRÍTICO:** `getCalendarPaymentContext()` - Segunda llamada a `getCurrentPaymentPeriod()`
- **Línea 654-664:** `isProfessionalPending()` - Determina si profesional tiene pago pendiente
- **Línea 675-737:** `scheduledPayments` - Calcula próximos pagos
- **Línea 933-1007:** `handleQuickMarkAsPaid()` - Marca pago y actualiza registros

### 5. Tipos
**Archivo:** `/src/types/calendar.ts`

- **Línea 5:** `PaymentFrequency` - Tipo de pago (daily, weekly, biweekly, monthly)
- **Línea 6:** `PaymentMethod` - Método de pago (cash, transfer, bizum, other)
- **Línea 35-52:** `payoutDetails` y `payoutRecords` - Estructura de almacenamiento de pago
- **Línea 95-110:** `WorkHoursStats` - Estructura de datos de estadísticas

---

## Flujos de Cálculo

### Flujo 1: DashboardWorkHours (Año completo)

```
1. useWorkHoursStats(userId, selectedYear, onlyCompleted)
   └─ PersistentCache.get() → Firebase
      └─ getAllProfessionalsStats(calendars, year, onlyCompleted)
         └─ getProfessionalStats(calendar, year, onlyCompleted)
            ├─ Para cada mes:
            │  ├─ Intenta: tryGetMonthlyAggregation()
            │  └─ Fallback: calculateWorkHours() en tiempo real
            └─ Retorna: { monthlyBreakdown[], totalHours, totalAmount }

2. useWorkHoursTotals(stats)
   └─ Calcula: totalHours, totalEvents, totalAmount, topProfessional

3. Renderiza:
   stats.map(stat => (
     <div>
       <h3>{stat.professionalName}</h3>
       {stat.monthlyBreakdown.map(month => (
         <div>{month.month}: {month.hours}h → {month.amount}€</div>
       ))}
     </div>
   ))
```

### Flujo 2: DashboardStripe (Período de pago)

```
1. useWorkHoursByPeriod(userId, onlyCompleted)
   └─ Para cada calendar:
      ├─ Obtiene payoutDetails (paymentType, paymentDay)
      ├─ Encuentra lastPaymentDate más reciente
      ├─ Llama: getCurrentPaymentPeriod(now, paymentType, paymentDay, lastPaymentDate)
      │  └─ Retorna: { start, end, label, periodKey }
      ├─ Llama: calculateWorkHours(calendarId, start, end, onlyCompleted)
      │  └─ Retorna: { hours, events }
      ├─ Calcula: amount = hours × hourlyRate
      └─ Retorna: { stats, period, history[] }

2. statsForDisplay (useMemo)
   ├─ Si period='payment':
   │  └─ statsByPeriod.map(item => ({ filteredAmount: item.stats.totalAmount, ... }))
   └─ Si period='month'|'quarter'|'year':
      └─ stats.map(stat => {
         filteredMonths = stat.monthlyBreakdown.filter(mes en periodRange)
         filteredAmount = SUM(filteredMonths[*].amount)
      })

3. getCalendarPaymentContext(calendarId)
   ├─ Llama: getCurrentPaymentPeriod() SEGUNDA VEZ ⚠️
   ├─ Busca datos en statsByPeriodMap por periodKey
   └─ Retorna: { amountForPeriod, hoursForPeriod, currentPeriod, ... }
```

### Flujo 3: Marcar Pago como Realizado

```
1. handleQuickMarkAsPaid(calendarId)
   ├─ getCalendarPaymentContext(calendarId)
   ├─ Prepara: PayoutRecordDraft = { status: 'paid', lastPaymentDate, ... }
   ├─ Prepara: PayoutDraft = { paymentType, paymentDay, ... }
   └─ Llama: updatePayoutMutation.mutateAsync()
      └─ CollaborativeCalendarService.updatePayoutRecord()
         └─ Firebase: calendar.payoutRecords[periodKey] = record

2. onSuccess:
   └─ queryClient.invalidateQueries({ queryKey: ['calendars'] })
      └─ Fuerza recalculación de todos los hooks dependientes
```

---

## Variables Críticas

### Período de Pago
```typescript
interface PaymentPeriod {
  start: Date;           // Inicio del período
  end: Date;             // Fin del período
  label: string;         // "15 oct - 14 nov" o "Sem 43"
  periodKey: string;     // "2024-10" o "2024-W43"
}
```

### Estadísticas de Trabajo
```typescript
interface WorkHoursStats {
  professionalId: string;
  professionalName: string;
  totalHours: number;              // Horas totales en período
  totalAmount: number;             // Monto total en período
  currency: string;
  hourlyRate: number;
  monthlyBreakdown: {
    month: string;                // "2024-10"
    hours: number;
    events: number;
    amount: number;
  }[];
  yearlyTotal: number;
  averagePerMonth: number;
}
```

### Configuración de Pago
```typescript
interface PayoutDetails {
  paymentType?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  paymentDay?: number;             // 1-31 (día del mes) o 0-6 (día de semana)
  paymentMethod?: 'cash' | 'transfer' | 'bizum' | 'other';
  customHourlyRate?: number;
  iban?: string;
  bank?: string;
}

interface PayoutRecord {
  [periodKey]: {
    status: 'pending' | 'paid';
    lastPaymentDate?: string;
    lastPaymentBy?: string;
    note?: string;
    amountPaid?: number;
  }
}
```

---

## Puntos de Entrada

### Para entender DashboardWorkHours:
1. `/src/pages/DashboardWorkHours.tsx` línea 27 → useWorkHoursStats
2. `/src/hooks/useWorkHoursStats.ts` línea 27
3. `/src/services/workHoursAnalytics.ts` línea 330

### Para entender DashboardStripe (período de pago):
1. `/src/pages/DashboardStripe.tsx` línea 389 → useWorkHoursByPeriod
2. `/src/hooks/useWorkHoursByPeriod.ts` línea 45
3. `/src/utils/paymentPeriods.ts` línea 41

### Para entender cálculo de período de pago:
1. `/src/utils/paymentPeriods.ts` línea 41 → getCurrentPaymentPeriod()
2. Estudiar cada caso: DAILY, WEEKLY, BIWEEKLY, MONTHLY

### Para entender marcado de pagos:
1. `/src/pages/DashboardStripe.tsx` línea 933 → handleQuickMarkAsPaid
2. `/src/hooks/usePaymentStats.ts` línea 242 → useUpdatePayoutComplete

---

## Caché y Sincronización

### Capas de Caché

```
Capa 1: React Query en memoria
├─ queryKey: ['workHoursByPeriod', userId, onlyCompleted]
├─ staleTime: 0 (siempre obsoleto)
└─ gcTime: 2 minutos

Capa 2: localStorage (PersistentCache)
├─ Key: workHoursStats:{userId}:{year}:{onlyCompleted}
└─ Duración: 10 minutos

Capa 3: Firebase + Cloud Functions
└─ Lectura real de datos
```

### Invalidación Manual
```typescript
queryClient.invalidateQueries({ queryKey: ['paymentStats'] });
queryClient.invalidateQueries({ queryKey: ['workHoursByPeriod'] });
queryClient.invalidateQueries({ queryKey: ['calendars'] });
```

### Falta Invalidación Automática Para:
- Cambios en `calendar.payoutRecords`
- Cambios en `calendar.payoutDetails`
- Cambios en eventos (sí están siendo observados)

---

## Bugs y Inconsistencias Específicos

### Bug #1: Array Check Redundante (DashboardStripe línea 556-559)
```typescript
const allStatsData = Array.isArray(periodStats) ? periodStats : [periodStats];
const currentPeriodData = allStatsData.find(item => 
  item?.period?.periodKey === currentPeriod?.periodKey
);
```

**Problema:** `periodStats` nunca es un array (viene de `statsByPeriodMap.get()`)

**Línea correcta:** Eliminar el ternario, usar directamente `periodStats`

### Bug #2: Cálculo Duplicado (DashboardStripe línea 541 vs useWorkHoursByPeriod línea 93)
```typescript
// useWorkHoursByPeriod - Primera vez
const period = getCurrentPaymentPeriod(now, paymentType, paymentDay, lastPaymentDate);

// DashboardStripe.getCalendarPaymentContext() - Segunda vez
const currentPeriod = getCurrentPaymentPeriod(new Date(), paymentType, paymentDay, latestRecord?.lastPaymentDate);
```

**Problema:** Dos llamadas independientes pueden devolver períodos diferentes si `lastPaymentDate` cambia

**Solución:** Reutilizar `currentPeriod` de `statsByPeriod[calendarId].period` si existe

### Bug #3: Inconsistencia staleTime (useWorkHoursStats vs useWorkHoursByPeriod)
```typescript
// useWorkHoursStats
staleTime: 5 * 60 * 1000,  // 5 minutos

// useWorkHoursByPeriod
staleTime: 0,  // Siempre recalcula
```

**Problema:** Datos inconsistentes entre hooks

**Solución:** Definir una constante global `WORK_HOURS_CACHE_TIME = 5 * 60 * 1000`

---

## Recomendaciones de Lectura en Orden

1. **Comprender el flujo base:**
   - `/src/services/workHoursAnalytics.ts` (calcular horas)
   - `/src/utils/paymentPeriods.ts` (calcular períodos)

2. **Comprender la captura de datos:**
   - `/src/hooks/useWorkHoursByPeriod.ts` (período de pago actual)
   - `/src/hooks/useWorkHoursStats.ts` (año completo)

3. **Comprender la visualización:**
   - `/src/pages/DashboardWorkHours.tsx` (anual, mensual)
   - `/src/pages/DashboardStripe.tsx` línea 491-525 (statsForDisplay, la diferencia crítica)

4. **Entender el problema:**
   - ANALISIS_FLUJO_PAGOS.md Sección 6 (inconsistencias)
   - RESUMEN_EJECUTIVO.md (impacto del problema)

