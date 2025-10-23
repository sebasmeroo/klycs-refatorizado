# RESUMEN EJECUTIVO: Análisis de Flujo de Pagos

## Panorama General

La aplicación tiene **DOS SISTEMAS DE CÁLCULO DE HORAS PARALELOS** que funcionan de forma INDEPENDIENTE:

### Sistema 1: Anual (DashboardWorkHours)
- **Uso:** Dashboard de horas por año
- **Granularidad:** Mensual (1 año = 12 meses)
- **Período:** Siempre el año calendario completo
- **Hook:** `useWorkHoursStats`

### Sistema 2: Por Período de Pago (DashboardStripe)
- **Uso:** Dashboard de pagos con vista flexible
- **Granularidad:** Período de pago específico (daily, weekly, biweekly, monthly)
- **Período:** Solo el período de pago ACTUAL
- **Hook:** `useWorkHoursByPeriod` + `usePaymentStats`

---

## El Problema Central

**Visualización Inconsistente:**

Cuando un profesional tiene `paymentType='weekly'` (pagos semanales):

```
DashboardWorkHours (Octubre completo):
├─ Semana 1-7 (Oct): 12h
├─ Semana 8-14 (Oct): 14h
├─ Semana 15-21 (Oct): 10h
└─ Semana 22-31 (Oct): 8h
TOTAL OCT: 44 horas → 880€

DashboardStripe (Período de pago actual, ej: Oct 18-24):
└─ Semana actual (18-24 Oct): 10h → 200€
  
⚠️ EL USUARIO VE NÚMEROS DIFERENTES en los dos dashboards
aunque está mirando PARCIALMENTE los mismos datos
```

---

## Inconsistencias Críticas

### 1. Duplicación de Lógica (✅ Funcional pero ineficiente)

`getCurrentPaymentPeriod()` se calcula **DOS VECES**:

- **Primera vez:** En `useWorkHoursByPeriod` (hook, línea 93)
- **Segunda vez:** En `DashboardStripe.getCalendarPaymentContext()` (línea 541-546)

→ **Riesgo:** Si `lastPaymentDate` cambia entre las dos llamadas, periodos diferentes

### 2. Mapeo Incorrecto en statsByPeriodMap (❌ Bug lógico)

**Línea 527-531:**
```typescript
// statsByPeriodMap contiene UN SOLO item por profesional
statsByPeriodMap.get(calendarId)  // Devuelve { stats, period, history, ... }
```

**Línea 556-559:**
```typescript
// Pero el código lo trata como si fuera array
const allStatsData = Array.isArray(periodStats) ? periodStats : [periodStats];
const currentPeriodData = allStatsData.find(item => ...);
```

→ **Ineficiente:** Array check innecesario, el `.find()` es redundante

### 3. Cálculo Inconsistente de filteredAmount (⚠️ Confuso)

**En period='payment':**
```typescript
filteredAmount: item.stats.totalAmount  // Toma directo el total del período
```

**En period='month':**
```typescript
filteredAmount = SUM(filteredMonths[*].amount)  // Recalcula filtrando meses
```

→ **Confusión:** Dos algoritmos diferentes para "filtrar" datos

### 4. Sincronización de Caché Inconsistente (⚠️ Ineficiente)

| Hook | staleTime | Comportamiento |
|------|-----------|---|
| `useWorkHoursStats` | 5 min | Cachea datos 5 minutos |
| `useWorkHoursByPeriod` | **0** | SIEMPRE recalcula (sin caché) |

→ **Consecuencia:** `useWorkHoursStats` puede mostrar datos desactualizados mientras `useWorkHoursByPeriod` recalcula constantemente

### 5. DashboardWorkHours Ignora Períodos de Pago (❌ Falta funcional)

- **Siempre muestra:** Año completo
- **Nunca muestra:** Período de pago del profesional
- **No hay forma de:** Ver horas según el período de pago en este dashboard

---

## Origen de los Cálculos

### Cadena de Datos

```
🔵 FIREBASE (eventos: event.duration, event.serviceStatus)
    ↓
🟢 WorkHoursAnalyticsService.calculateWorkHours()
    ├─→ Lee eventos en rango de fechas
    ├─→ Filtra por serviceStatus (if onlyCompleted)
    ├─→ SUM(event.duration) → horas
    └─→ horas × hourlyRate → monto
        ↓
    ├─→ useWorkHoursByPeriod (usa período de pago)
    │   └─→ DashboardStripe (cuando period='payment')
    │
    └─→ WorkHoursAnalyticsService.getProfessionalStats()
        └─→ Itera 12 meses (estrategia híbrida: agregaciones + real-time)
            └─→ useWorkHoursStats / usePaymentStats
                ├─→ DashboardWorkHours
                └─→ DashboardStripe (otros períodos)
```

### Cálculos Implementados: ✅ CORRECTOS

1. **Suma de duraciones:** `SUM(event.duration / 60)` → correcto
2. **Filtro completados:** `event.serviceStatus === 'completed'` → correcto
3. **Conversión a moneda:** `horas × hourlyRate` → correcto
4. **Períodos de pago:** Cálculo en `paymentPeriods.ts` → correcto (daily, weekly, biweekly, monthly)

---

## Sincronización de Datos

### React Query - Caché

| Componente | Invalidación | Refresh Automático |
|---|---|---|
| **useWorkHoursByPeriod** | Botón "Actualizar" | staleTime:0 (siempre recalcula) |
| **useWorkHoursStats** | Botón "Actualizar" | staleTime:5min (cachea) |
| **usePaymentStats** | Botón "Actualizar" | staleTime:5min (cachea) |

→ **Problema:** Sin sincronización automática si cambian `payoutRecords` o configuración de pago

### Invalidación Manual

```typescript
const handleRefresh = useCallback(async () => {
  await queryClient.invalidateQueries({ queryKey: ['paymentStats'] });
  await queryClient.invalidateQueries({ queryKey: ['workHoursByPeriod'] });
  // ... 6 más
}, [queryClient]);
```

→ **Funciona:** Pero requiere clic del usuario

---

## Flujo Actual: Ejemplo Práctico

**Escenario:** Profesional José con pago mensual (día 15)

**Hoy:** 23 Oct 2024

**Período de pago actual:** 15 Oct - 14 Nov

```
USUARIO ABRE: DashboardWorkHours
├─ Año: 2024
├─ Mes Oct mostrará: Octubre COMPLETO (1-31 Oct)
├─ Horas: 82h
└─ Monto: 1640€

USUARIO ABRE: DashboardStripe → Período de Pago
├─ Período actual: 15 Oct - 14 Nov
├─ Horas: 42.5h (solo 15-31 Oct)
└─ Monto: 850€

✋ CONFUSIÓN: ¿Por qué octubre tiene 82h en un dashboard y 42.5h en otro?
  (Respuesta: uno muestra mes calendario, otro muestra período de pago)
```

---

## Conexión Entre Componentes

### DashboardWorkHours
- **Usa:** `useWorkHoursStats` (año completo)
- **Muestra:** Desglose por mes del año seleccionado
- **NO usa:** Período de pago
- **NO conecta con:** DashboardStripe

### DashboardStripe
- **Usa:** `usePaymentStats` (año, filtrado por período) + `useWorkHoursByPeriod` (período de pago)
- **Muestra:** Flexible - año, mes, trimestre, O período de pago
- **Conecta con:** `useCalendar` (para payoutDetails), `paymentPeriods.ts` (para calcular período)

### Desconexión Identificada
1. ❌ DashboardWorkHours no conoce períodos de pago
2. ❌ DashboardStripe no ofrece vista de "todo el mes" cuando paymentType='weekly'
3. ❌ No hay sincronización automática entre los dos dashboards

---

## Resumen de Causas

### Problema = Dos Cálculos Paralelos

| Causa | Impacto | Severidad |
|-------|--------|-----------|
| `useWorkHoursStats` = anual, mensual | Siempre mes calendario | ⚠️ Funcional pero limitado |
| `useWorkHoursByPeriod` = período pago actual | Solo período actual, no historial largo | ⚠️ Funcional |
| Cálculo duplicado de período | Ineficiencia, riesgo de inconsistencia | ⚠️ Bajo riesgo |
| staleTime inconsistente | Datos desactualizados | ⚠️ Moderado |
| Visualización diferente por filtro | Confusión del usuario | ❌ **CRÍTICO** |
| DashboardWorkHours ignorar período pago | Usuario no puede ver horas por período de pago | ❌ **CRÍTICO** |

---

## Lo Que SÍ Funciona Bien

✅ **Cálculo de horas:** Correcto (suma de duraciones)

✅ **Filtro completados:** Correcto (serviceStatus)

✅ **Conversión a moneda:** Correcto (horas × tarifa)

✅ **Períodos de pago:** Cálculo correcto (daily, weekly, biweekly, monthly)

✅ **Estrategia híbrida:** Agregaciones + tiempo real (eficiente)

✅ **React Query:** Caché y invalidación (correcta)

---

## Recomendaciones (Prioridad)

### 🔴 CRÍTICA
1. **Sincronizar visualización:** Aclarar cuándo se muestran datos de período de pago vs mes calendario
2. **Opción: Mostrar ambas vistas en DashboardStripe** con etiquetas claras

### 🟠 ALTA
3. **Eliminar duplicación:** Un único cálculo de `getCurrentPaymentPeriod()`
4. **Sincronizar staleTime:** Consistencia en caché (todos 5 min o todos 0)
5. **Reparar statsByPeriodMap:** Lógica más clara, sin array check innecesario

### 🟡 MEDIA
6. **Agregar período de pago a DashboardWorkHours:** Mostrar también vista por período
7. **Sincronización automática:** Invalidar caché al cambiar payoutRecords
8. **Documentación:** Explicar diferencia entre período calendario vs período pago

---

## Conclusión

**Problema NO es de lógica de cálculo (que es correcta), sino de:**
1. **Visualización inconsistente** (mismo período se ve diferente según el filtro)
2. **Falta de conexión** (dos dashboards, dos sistemas independientes)
3. **Confusión conceptual** (período calendario vs período de pago no está claramente separado)

**La solución NO requiere cambiar la lógica de cálculo**, sino:
- Aclarar y sincronizar la visualización
- Conectar mejor los dos sistemas
- Eliminar confusión mediante mejor UX

