# ANÁLISIS DETALLADO: Flujo de Cálculo de Pagos y Horas Trabajadas

## 1. VISIÓN GENERAL DE LA ARQUITECTURA

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────────┐
│                       DATOS BASE: Firebase                       │
│  - calendars (SharedCalendar[])                                 │
│  - shared_calendars/monthlyStats (agregaciones mensuales)       │
│  - calendar_events (eventos de servicios)                       │
└────────────┬──────────────────────────────────────────────┬────┘
             │                                              │
             ▼                                              ▼
┌──────────────────────────┐                    ┌──────────────────────┐
│  HOOKS DE DATOS          │                    │  HOOKS DE PERIODOS   │
├──────────────────────────┤                    ├──────────────────────┤
│ • useWorkHoursStats      │                    │ • useWorkHoursByPeriod
│ • usePaymentStats        │ (año completo)    │ • getCurrentPaymentPeriod
│ • usePaymentPendingServ. │                    │   (fecha base para pago)
│ • useUserCalendars       │                    └──────────────────────┘
└──────────────────────────┘
             │                                
             └────────┬─────────────────────┘
                      ▼
         ┌──────────────────────────┐
         │  DASHBOARDS              │
         ├──────────────────────────┤
         │ • DashboardWorkHours     │ (Vista anual)
         │ • DashboardStripe        │ (Vista flexible: año, mes, período pago)
         └──────────────────────────┘
```

---

## 2. FLUJO DE CÁLCULO DE HORAS TRABAJADAS

### 2.1 Origen de los Datos

**Archivo:** `/src/services/workHoursAnalytics.ts`

**Método:** `calculateWorkHours(calendarId, startDate, endDate, onlyCompleted)`

```typescript
// PASO 1: Obtener eventos del calendario en rango de fechas
const { events, fetchedCount } = await CalendarEventService.getCalendarEvents([calendarId], startDate, endDate);

// PASO 2: Filtrar solo eventos completados (si onlyCompleted=true)
const filteredEvents = events.filter(event => 
  onlyCompleted ? event.serviceStatus === 'completed' : true
);

// PASO 3: Sumar duraciones
const totalMinutes = filteredEvents.reduce((sum, event) => 
  event.duration && event.duration > 0 ? sum + event.duration : sum, 
0);

// PASO 4: Convertir a horas
return {
  hours: totalMinutes / 60,
  events: filteredEvents.length
};
```

**Datos Utilizados:**
- `event.duration`: Duración en minutos
- `event.serviceStatus`: Estado del servicio ('pending', 'completed', 'in_progress', 'not_done')
- `event.startDate` y `event.endDate`: Para filtrar por rango

---

### 2.2 Estrategia Híbrida de Cálculo

**Archivo:** `/src/services/workHoursAnalytics.ts` → `getProfessionalStats()`

```
┌─────────────────────────────────────────────────┐
│      PARA CADA MES DEL AÑO SOLICITADO           │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   MES PASADO    MES ACTUAL    MES FUTURO
   (Histórico)   (En Curso)    (Sin datos)
        │              │              │
        ▼              ▼              ▼
   Agregación   Tiempo Real      Skip
   (1 lectura)  (eventos reales)
   📦            🔴
```

**Lógica Detallada:**

```typescript
static async getProfessionalStats(calendar, startYear, onlyCompleted) {
  const monthlyData: Record<string, { hours, events, amount }> = {};
  
  for (let month = 0; month < 12; month++) {
    const isPastMonth = month < currentMonth;
    const isCurrentMonth = month === currentMonth;
    
    if (isPastMonth) {
      // Intentar obtener agregación mensual
      const aggregation = await tryGetMonthlyAggregation(calendarId, year, month);
      if (aggregation) {
        // ✅ ÉXITO: Usar agregación (1 lectura Firebase)
        monthlyData[monthKey] = aggregation;
        continue;
      }
      // Fallback: calcular en tiempo real si no existe agregación
    }
    
    // Meses actuales: calcular en tiempo real
    const { events } = await CalendarEventService.getCalendarEvents(
      [calendarId], 
      monthStart, 
      monthEnd
    );
    
    // Procesar eventos
    let monthHours = 0;
    events.forEach(event => {
      if (onlyCompleted && event.serviceStatus !== 'completed') return;
      monthHours += event.duration / 60;
    });
    
    monthlyData[monthKey] = { hours: monthHours, ... };
  }
}
```

**Cálculos Realizados:**

1. **Horas totales del mes:**
   ```
   monthHours = SUM(event.duration / 60) para todos los eventos
   ```

2. **Monto a pagar (basado en tarifa horaria):**
   ```
   monthAmount = monthHours × hourlyRate
   (o customHourlyRate si está configurada)
   ```

3. **Total anual:**
   ```
   totalHours = SUM(monthlyData[*].hours)
   totalAmount = SUM(monthlyData[*].amount)
   ```

---

### 2.3 Hook: useWorkHoursByPeriod (NUEVOS DATOS)

**Archivo:** `/src/hooks/useWorkHoursByPeriod.ts`

**Propósito:** Calcular horas **filtradas por el período de pago ACTUAL** del profesional

```typescript
export const useWorkHoursByPeriod = (userId, onlyCompleted) => {
  return useQuery({
    queryKey: ['workHoursByPeriod', userId, onlyCompleted],
    queryFn: async () => {
      const results: WorkHoursByPeriod[] = [];
      
      for (const calendar of calendars) {
        // PASO 1: Obtener configuración de pago
        const paymentType = calendar.payoutDetails?.paymentType || 'monthly';
        const paymentDay = calendar.payoutDetails?.paymentDay;
        const hourlyRate = calendar.payoutDetails?.customHourlyRate ?? calendar.hourlyRate;
        
        // PASO 2: Encontrar última fecha de pago registrada
        let lastPaymentDate = null;
        Object.values(calendar.payoutRecords || {}).forEach(record => {
          if (record?.lastPaymentDate) {
            if (!lastPaymentDate || record.lastPaymentDate > lastPaymentDate) {
              lastPaymentDate = record.lastPaymentDate;
            }
          }
        });
        
        // PASO 3: Calcular período de pago ACTUAL
        const currentPeriod = getCurrentPaymentPeriod(
          new Date(),
          paymentType,
          paymentDay,
          lastPaymentDate
        );
        
        // PASO 4: Calcular horas SOLO en este período
        const { hours, events } = await WorkHoursAnalyticsService.calculateWorkHours(
          calendar.id,
          currentPeriod.start,
          currentPeriod.end,
          onlyCompleted
        );
        
        const amount = Math.round((hours × hourlyRate) * 100) / 100;
        
        // PASO 5: Obtener también los últimos 3 períodos (historial)
        const history = [];
        let cursor = new Date(currentPeriod.start);
        for (let i = 0; i < 3; i++) {
          cursor.setDate(cursor.getDate() - 1);
          const previousPeriod = getCurrentPaymentPeriod(cursor, paymentType, paymentDay);
          // ... calcular stats para previousPeriod
          history.push({ stats, period: previousPeriod });
        }
        
        results.push({
          stats: { totalHours: hours, totalAmount: amount, ... },
          period: currentPeriod,
          history,
          professionalId: calendar.id,
          professionalName: calendar.name
        });
      }
      
      return results;
    },
    staleTime: 0, // Siempre obtener datos frescos
    refetchOnMount: true, // Recargar al montar
  });
};
```

**Diferencia Clave:** Usa `getCurrentPaymentPeriod()` para filtrar por el período de pago, NO por el mes calendario.

---

## 3. CÁLCULO DE PERÍODOS DE PAGO

### 3.1 Períodos Soportados

**Archivo:** `/src/utils/paymentPeriods.ts`

```typescript
export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export const getCurrentPaymentPeriod = (
  referenceDate: Date,
  paymentType: PaymentFrequency,
  paymentDay: number | null | undefined,
  lastPaymentDate?: string
): PaymentPeriod => {
  // Devuelve { start, end, label, periodKey }
}
```

### 3.2 Cálculo para Cada Tipo

#### **DAILY (Diario)**
```
Período: Desde inicio del día hasta fin del día
Ejemplo: 23 Oct 2024, 00:00:00 - 23:59:59

start = referenceDate (00:00:00)
end = referenceDate (23:59:59)
periodKey = "2024-10-23"
```

#### **WEEKLY (Semanal)**
```
Parámetro: paymentDay (0=domingo, 1=lunes, ..., 6=sábado)
Defecto: 5 (viernes)

Lógica:
1. Calcular qué día fue el último paymentDay
2. El período es desde ese día hasta 6 días después

Ejemplo (hoy=martes 23 Oct, paymentDay=5/viernes):
- Última vez que fue viernes: 18 Oct
- Período: 18 Oct 00:00:00 - 24 Oct 23:59:59 (7 días)
periodKey = "2024-W43" (ISO week number)
```

#### **BIWEEKLY (Quincenal)**
```
Parámetro: paymentDay (1-31)
Defecto: 1

Lógica: Dos opciones dependiendo de paymentDay
Si paymentDay <= 15:
  - Primera quincena: día X al 15
  - Segunda quincena: 16 al fin de mes

Si paymentDay > 15:
  - Primera quincena: 1 al 15
  - Segunda quincena: 16 al día X

Ejemplo (paymentDay=1, hoy=23 Oct):
- Hoy es 23, que es > 15
- Períodos actuales: 16 Oct - 31 Oct
- Período anterior: 1 Oct - 15 Oct
periodKey = "2024-10-Q2" (segunda quincena)
```

#### **MONTHLY (Mensual)**
```
Parámetro: paymentDay (1-31)
Defecto: 1

Lógica:
1. Si hoy >= paymentDay: período es desde paymentDay este mes hasta
   (paymentDay-1) del mes siguiente
2. Si hoy < paymentDay: período es desde paymentDay del mes anterior hasta
   (paymentDay-1) de este mes

Ejemplo (paymentDay=15, hoy=23 Oct):
- Hoy (23) >= paymentDay (15)
- Período actual: 15 Oct 00:00:00 - 14 Nov 23:59:59
periodKey = "2024-10"

Ejemplo (paymentDay=25, hoy=23 Oct):
- Hoy (23) < paymentDay (25)
- Período actual: 25 Sep 00:00:00 - 24 Oct 23:59:59
periodKey = "2024-09"
```

---

## 4. FLUJO EN EL DASHBOARD DE PAGOS (DashboardStripe)

### 4.1 Hooks Utilizados

```typescript
// Estadísticas por AÑO (filtradas luego por mes/trimestre)
const { data: stats = [] } = usePaymentStats(userId, selectedYear, onlyCompleted);

// Estadísticas por PERÍODO DE PAGO ACTUAL
const { data: statsByPeriod = [] } = useWorkHoursByPeriod(userId, onlyCompleted);
const periodTotals = useWorkHoursByPeriodTotals(statsByPeriod);

// Servicios pendientes en rango
const { data: pendingServices = {} } = usePaymentPendingServices(
  calendarIds, 
  periodRange.start, 
  periodRange.end
);
```

### 4.2 Cálculo de statsForDisplay (Línea 491-525)

```typescript
const statsForDisplay = useMemo(() => {
  // ✅ OPCIÓN 1: Si período seleccionado es 'payment'
  if (period === 'payment') {
    // Usar datos calculados específicamente para período de pago
    return statsByPeriod.map(item => ({
      base: item.stats,                              // Stats crudas
      filteredMonths: item.stats.monthlyBreakdown,   // Desglose mensual
      filteredAmount: item.stats.totalAmount,        // Monto en período de pago
      filteredHours: item.stats.totalHours,          // Horas en período de pago
      filteredEvents: SUM(monthlyBreakdown[*].events),
      paymentPeriod: item.period                     // { start, end, label, periodKey }
    }));
  }

  // ✅ OPCIÓN 2: Otros períodos (año, mes, trimestre)
  return stats.map(stat => {
    // Filtrar meses que caen en periodRange
    const filteredMonths = stat.monthlyBreakdown.filter(month => {
      const date = new Date(yearStr, monthIndex, 1);
      return date >= periodRange.start && date <= periodRange.end;
    });
    
    // Sumar montos y horas de meses filtrados
    const filteredAmount = SUM(filteredMonths[*].amount);
    const filteredHours = SUM(filteredMonths[*].hours);
    
    return {
      base: stat,
      filteredMonths,
      filteredAmount,      // Solo meses en el rango seleccionado
      filteredHours,
      filteredEvents
    };
  });
}, [stats, periodRange, period, statsByPeriod]);
```

**Diferencia Crítica:**
- **period === 'payment'**: Los datos son del período de pago actual (línea 493-501)
- **period === 'year'|'month'|'quarter'**: Los datos se filtran por rango de fechas calendario (línea 505-524)

---

### 4.3 Contexto de Pagos por Profesional

**Función:** `getCalendarPaymentContext()` (línea 533-581)

```typescript
const getCalendarPaymentContext = useCallback((calendarId: string) => {
  // PASO 1: Obtener calendario y configuración de pago
  const calendar = calendarMap.get(calendarId);
  const details = calendar.payoutDetails || {};
  const paymentType = details.paymentType || 'monthly';
  const paymentDay = details.paymentDay;
  
  // PASO 2: Encontrar última fecha de pago registrada
  const latestRecord = getLatestPaymentRecord(calendar.payoutRecords);
  
  // PASO 3: Calcular PERÍODO ACTUAL basado en config
  const currentPeriod = getCurrentPaymentPeriod(
    new Date(),           // Hoy
    paymentType,
    paymentDay,
    latestRecord?.lastPaymentDate  // Última vez que se pagó
  );
  
  // PASO 4: Buscar datos de horas para este período específico
  const periodStats = statsByPeriodMap.get(calendarId);
  
  let amountForCurrentPeriod;
  let hoursForCurrentPeriod;
  
  if (periodStats) {
    const currentPeriodData = periodStats.find(item =>
      item.period.periodKey === currentPeriod.periodKey  // ✅ MATCH por periodKey
    );
    
    if (currentPeriodData) {
      amountForCurrentPeriod = currentPeriodData.stats.totalAmount;  // Monto en este período
      hoursForCurrentPeriod = currentPeriodData.stats.totalHours;    // Horas en este período
    } else {
      // Fallback: usar totales si no encuentra match
      amountForCurrentPeriod = periodStats.stats.totalAmount;
    }
  }
  
  // RETORNA contexto completo de pago
  return {
    calendar,
    paymentType,
    paymentDay,
    currentPeriod,              // Objeto { start, end, label, periodKey }
    amountForPeriod,            // Monto a pagar EN ESTE PERÍODO
    hoursForPeriod,             // Horas EN ESTE PERÍODO
    latestRecord,               // Último pago registrado
    preferredMethod             // Método de pago preferido
  };
}, [calendarMap, statsByPeriodMap]);
```

---

## 5. FLUJO EN DASHBOARDWORKHOURS

**Archivo:** `/src/pages/DashboardWorkHours.tsx`

```typescript
// Obtiene estadísticas ANUALES (sin período de pago)
const { data: stats = [] } = useWorkHoursStats(
  analyticsEnabled ? user?.uid : undefined,
  selectedYear,  // ← Año COMPLETO
  onlyCompleted
);

// Los datos se muestran directamente por mes
stats.map(stat => (
  <div key={stat.professionalId}>
    <h3>{stat.professionalName}</h3>
    
    {/* Desglose mensual */}
    {stat.monthlyBreakdown.map(month => (
      <div>
        {month.month}: {month.hours}h → {month.amount} EUR
      </div>
    ))}
  </div>
));
```

**Características:**
- Siempre muestra datos del año seleccionado (completo)
- NO usa período de pago
- Sencillo y directo: año → 12 meses → profesionales

---

## 6. INCONSISTENCIAS IDENTIFICADAS

### 6.1 INCONSISTENCIA #1: Dos Formas Diferentes de Calcular Horas

| Aspecto | DashboardWorkHours | DashboardStripe (payment) |
|---------|-------------------|------------------------|
| **Hook usado** | `useWorkHoursStats` | `useWorkHoursByPeriod` |
| **Período** | Año completo | Período de pago |
| **Granularidad** | Mensual (12 meses) | Período único actual |
| **Fuente** | `WorkHoursAnalyticsService.getProfessionalStats()` | `WorkHoursAnalyticsService.calculateWorkHours()` |
| **Con historial** | No | Sí (últimos 3 períodos) |

**Problema:** Si un profesional tiene `paymentType='weekly'` y hoy es 23 Oct (miércoles):
- DashboardWorkHours mostrará OCT completo (Oct 1-31)
- DashboardStripe mostrará solo la semana actual (ej: Oct 17-23)
- **Los montos serán DIFERENTES aunque sea el mismo período de tiempo**

### 6.2 INCONSISTENCIA #2: Cálculo de "Período Actual" es Duplicado

El cálculo de `getCurrentPaymentPeriod()` se hace en:

1. **useWorkHoursByPeriod** (línea 93):
   ```typescript
   const period = getCurrentPaymentPeriod(now, paymentType, paymentDay, lastPaymentDate);
   ```

2. **DashboardStripe.getCalendarPaymentContext()** (línea 541-546):
   ```typescript
   const currentPeriod = getCurrentPaymentPeriod(
     new Date(),
     paymentType,
     paymentDay,
     latestRecord?.lastPaymentDate
   );
   ```

**Problema:** Se calcula DOS VECES con información que PUEDE ser diferente
- Si `lastPaymentDate` cambia entre las dos llamadas → períodos diferentes
- Sin sincronización explícita

### 6.3 INCONSISTENCIA #3: Falta de Sincronización en statsByPeriodMap

**Línea 527-531:**
```typescript
const statsByPeriodMap = useMemo(() => {
  const map = new Map<string, (typeof statsByPeriod)[number]>();
  statsByPeriod.forEach(item => map.set(item.professionalId, item));
  return map;
}, [statsByPeriod]);
```

**Línea 556-559:**
```typescript
const allStatsData = Array.isArray(periodStats) ? periodStats : [periodStats];
const currentPeriodData = allStatsData.find(item =>
  return item?.period?.periodKey === currentPeriod?.periodKey;
);
```

**Problema:** 
- `statsByPeriodMap.get(calendarId)` devuelve UN SOLO item con todo el período actual
- Luego intenta tratarlo como array (`Array.isArray(periodStats)`)
- El `.find()` después es innecesario porque ya es un item único

### 6.4 INCONSISTENCIA #4: filteredAmount en period='payment'

**Línea 493-501:**
```typescript
if (period === 'payment') {
  return statsByPeriod.map(item => ({
    base: item.stats,
    filteredAmount: item.stats.totalAmount,  // ✅ Dato del período
    // ...
  }));
}
```

**Vs. period='month':**
```typescript
return stats.map(stat => {
  const filteredMonths = stat.monthlyBreakdown.filter(month => month.month === selectedMonth);
  const filteredAmount = SUM(filteredMonths[*].amount);  // Recalculado
  // ...
});
```

**Problema:** 
- En `period='payment'`: toma directamente `totalAmount` del período
- En `period='month'`: recalcula sumando meses filtrados
- Inconsistencia en lógica

---

## 7. SINCRONIZACIÓN DE DATOS

### 7.1 React Query - Caché y Refresh

**Hooks configurados con:**

| Hook | staleTime | gcTime | refetchOnMount | refetchOnWindowFocus |
|------|-----------|--------|----------------|----------------------|
| `useWorkHoursStats` | 5 min | 10 min | **false** | **false** |
| `useWorkHoursByPeriod` | **0** | 2 min | **true** | **false** |
| `usePaymentStats` | 5 min | 10 min | (heredado) | **false** |

**Problema:** 
- `useWorkHoursByPeriod` tiene `staleTime: 0` → SIEMPRE recalcula
- Otros hooks cachean 5 minutos
- Si cambias período de pago en un profesional, `useWorkHoursStats` seguirá mostrando datos viejos

### 7.2 invalidateQueries en handleRefresh

**Línea 472-489:**
```typescript
const handleRefresh = useCallback(async () => {
  await queryClient.invalidateQueries({ queryKey: ['paymentStats'] });
  await queryClient.invalidateQueries({ queryKey: ['workHoursByPeriod'] });
  await queryClient.invalidateQueries({ queryKey: ['calendars'] });
  // ...
}, [queryClient]);
```

**Problema:** 
- Solo invalida cuando hace clic en botón Actualizar
- No hay sincronización automática si cambian datos base (eventos, payoutRecords)

---

## 8. FLUJO DE DATOS PASO A PASO

### Caso 1: Profesional con paymentType='monthly', paymentDay=15

**Hoy:** 23 Oct 2024

```
PASO 1: useWorkHoursByPeriod ejecuta
┌─────────────────────────────────────────────────────────────┐
│ getCurrentPaymentPeriod(23 Oct, 'monthly', 15, lastPaymentDate)
│
│ Lógica: hoy (23) >= paymentDay (15)
│ → Período actual: 15 Oct 00:00:00 - 14 Nov 23:59:59
│ → periodKey = "2024-10"
└─────────────────────────────────────────────────────────────┘
         ↓
PASO 2: Calcula horas del 15 Oct al 14 Nov
┌─────────────────────────────────────────────────────────────┐
│ calculateWorkHours(
│   calendarId,
│   15 Oct 00:00:00,
│   14 Nov 23:59:59,
│   onlyCompleted=true
│ )
│
│ Retorna:
│ {
│   hours: 42.5h,
│   events: 10,
│   amount: 42.5 × 20€ = 850€
│ }
└─────────────────────────────────────────────────────────────┘
         ↓
PASO 3: usePaymentStats también ejecuta (independientemente)
┌─────────────────────────────────────────────────────────────┐
│ getProfessionalStats(
│   calendar,
│   2024,  // AÑO COMPLETO
│   onlyCompleted=true
│ )
│
│ Retorna:
│ {
│   monthlyBreakdown: [
│     { month: "2024-10", hours: 82h, events: 19, amount: 1640€ },  ← OCTUBRE COMPLETO
│     // otros meses...
│   ],
│   totalHours: 420h,  // TODO 2024
│   totalAmount: 8400€ // TODO 2024
│ }
└─────────────────────────────────────────────────────────────┘
         ↓
PASO 4: DashboardStripe visualiza
┌─────────────────────────────────────────────────────────────┐
│ Si period='payment':
│   Muestra: 42.5h → 850€ (período de pago 15 Oct - 14 Nov)
│
│ Si period='month' (Oct):
│   statsForDisplay filtra mes de Oct de monthlyBreakdown
│   → 82h (TODO octubre)
│
│ ⚠️ DISCREPANCIA: 42.5h vs 82h para el MISMO período de tiempo
└─────────────────────────────────────────────────────────────┘
```

### Caso 2: Profesional con paymentType='weekly', paymentDay=5 (viernes)

**Hoy:** 23 Oct 2024 (miércoles)

```
PASO 1: Cálculo de período
┌─────────────────────────────────────────────────────────────┐
│ getCurrentPaymentPeriod(23 Oct, 'weekly', 5, ...)
│
│ Lógica:
│ - Hoy es miércoles (day=3)
│ - paymentDay es viernes (day=5)
│ - Último viernes fue: 18 Oct
│ - Período actual: 18 Oct 00:00:00 - 24 Oct 23:59:59 (7 días)
│ - periodKey = "2024-W43"
└─────────────────────────────────────────────────────────────┘
         ↓
PASO 2: Calcula horas de 18-24 Oct
┌─────────────────────────────────────────────────────────────┐
│ calculateWorkHours(
│   calendarId,
│   18 Oct 00:00:00,
│   24 Oct 23:59:59,
│   onlyCompleted=true
│ )
│ Retorna: 8.5h → 170€
└─────────────────────────────────────────────────────────────┘
         ↓
PASO 3: Pero usePaymentStats devuelve octubre COMPLETO
┌─────────────────────────────────────────────────────────────┐
│ monthlyBreakdown['2024-10'] = {
│   hours: 42h,
│   amount: 840€  ← OCTUBRE COMPLETO, no solo semana 18-24
│ }
└─────────────────────────────────────────────────────────────┘
         ↓
PASO 4: En DashboardStripe
┌─────────────────────────────────────────────────────────────┐
│ Si period='payment':
│   Muestra: 8.5h → 170€
│
│ Si period='month':
│   Muestra: 42h → 840€
│
│ ⚠️ PROBLEMA GRAVE:
│ El usuario ve montos completamente diferentes según
│ cómo se seleccione el período, aunque los datos bases
│ (eventos) son los mismos.
└─────────────────────────────────────────────────────────────┘
```

---

## 9. ANÁLISIS DE CONEXIÓN ENTRE COMPONENTES

### 9.1 Conexión entre Hooks

```
useWorkHoursByPeriod
├─ Calcula: período de pago ACTUAL
├─ Fuente: getCurrentPaymentPeriod() + calculateWorkHours()
├─ Retorna: { stats, period, history } por profesional
└─ Usado en: DashboardStripe (cuando period='payment')

useWorkHoursStats
├─ Calcula: estadísticas ANUALES
├─ Fuente: getProfessionalStats() (mes por mes)
├─ Retorna: stats anuales desglosadas por mes
└─ Usado en: DashboardWorkHours + DashboardStripe

usePaymentStats (alias de useWorkHoursStats)
└─ Exactamente igual que useWorkHoursStats
```

### 9.2 Flujo de Información

```
EVENTOS EN FIREBASE
│
└─→ WorkHoursAnalyticsService.calculateWorkHours()
    ├─→ Lee eventos en rango
    ├─→ Filtra por serviceStatus
    ├─→ Suma duraciones
    └─→ { hours, events }
         │
         ├─→ useWorkHoursByPeriod
         │   └─→ Aplica período de pago
         │       └─→ DashboardStripe (period='payment')
         │
         └─→ WorkHoursAnalyticsService.getProfessionalStats()
             └─→ Itera 12 meses
                 ├─→ Busca agregación (si existe)
                 └─→ Calcula en tiempo real
                     └─→ { hours, events, amount } por mes
                         │
                         ├─→ useWorkHoursStats
                         │   └─→ DashboardWorkHours
                         │
                         └─→ usePaymentStats
                             └─→ DashboardStripe (otros períodos)
```

---

## 10. RESUMEN DE PROBLEMAS

### Lógica de Cálculo
1. ✅ **Correcto:** Cálculo base de horas (suma de duraciones)
2. ✅ **Correcto:** Aplicación de `onlyCompleted` filter
3. ✅ **Correcto:** Conversión a moneda con tarifa horaria
4. ✅ **Correcto:** Estrategia híbrida (agregaciones + tiempo real)

### Sincronización de Datos
1. ❌ **FALTA:** No se sincronizan cambios de `payoutRecords` automáticamente
2. ❌ **FALTA:** `useWorkHoursByPeriod` siempre recalcula (staleTime:0) mientras otros cachean
3. ❌ **FALTA:** Duplicación de cálculo de `getCurrentPaymentPeriod()`

### Inconsistencias de Visualización
1. ❌ **CRÍTICO:** Dos visiones diferentes del mismo período de tiempo según el filtro seleccionado
2. ❌ **CONFUSO:** `statsByPeriodMap` maneja un único item pero código la trata como array
3. ❌ **INCORRECTO:** `filteredAmount` en period='payment' toma totalAmount directo vs recalculado en otros períodos

### Falta de Conexión
1. ❌ **FALTA:** DashboardWorkHours NO usa período de pago (siempre año completo)
2. ❌ **FALTA:** No hay forma de ver período de pago en DashboardWorkHours
3. ❌ **FALTA:** Cambios en período de pago no se reflejan automáticamente en estadísticas

---

## 11. FLUJO RECOMENDADO PARA SOLUCIONAR

### Opción A: Unificar en una sola fuente (Recomendado)

```
1. Crear un único hook: useWorkHoursWithPeriod(userId, periodMode, ...)
   - periodMode: 'year' | 'month' | 'period_payment'
   - Devuelve SIEMPRE { stats, period }

2. Los dashboards usan el mismo hook con parámetros diferentes

3. Eliminar duplicación de getCurrentPaymentPeriod()

4. Sincronizar caché: staleTime consistente
```

### Opción B: Mantener separados pero conectados

```
1. useWorkHoursStats: Año completo (desglose mensual)

2. useWorkHoursByPeriod: Período de pago (desglose por período)

3. Un "sistema de sincronización":
   - Cuando cambia payoutDetails → invalidar ambos
   - Cuando cambia payoutRecords → invalidar ambos
   - Usar mismo lastPaymentDate en ambas funciones

4. DashboardStripe: Mostrar AMBAS vistas claramente separadas
```

