## Plan de Unificación Bookings · Horas · Pagos

Objetivo: garantizar que los tres módulos consuman la misma lógica de periodos, horas y pagos, evitando cálculos duplicados o inconsistentes.

---

### 1. Módulo compartido (`src/services/paymentSchedule.ts`)
Centralizar la lógica de negocio:

- `getSchedule(calendarId, referenceDate)`  
  Devuelve `currentPeriod`, `nextPeriod`, `previousPeriod` con `periodKey`, `cycleStart/End`, `dueDate`, `status`.  
- `aggregateHours(calendarId, periodKey, onlyCompleted)`  
  Consulta Bookings, suma horas, importe, número de servicios.  
- `markPaymentPaid({ calendarId, periodKey, amount, method, maintainSchedule })`  
  Registra el pago, define `cycleStart/End` y prepara el `payoutRecord` del siguiente ciclo (status `pending`).

Este módulo será la única fuente de verdad; internamente usa la SDK de Firestore y utilidades existentes (`generateRecurringInstances`, etc.).

---

### 2. Bookings

- Al crear/editar una reserva, llamar a `getSchedule` para obtener el `periodKey` correcto y guardarlo junto al evento (no es necesario rediseñar la UI).  
- El resto de la pantalla permanece igual; sólo se asegura que cada evento guarda el identificador del ciclo que le corresponde.

---

### 3. Dashboard Horas

- Reemplazar los cálculos locales por llamadas a `getSchedule` y `aggregateHours`.  
- El listado mostrará exactamente los datos del ciclo retornado (mismos rangos, montos y horas que Pagos).  
- Mantener logs para depurar (`🧾 Reservas incluidas…`) consumiendo el resultado de `aggregateHours`.

---

### 4. Dashboard Pagos

- Usar `getSchedule` para pintar la tabla, drawer y timeline de pagos pendientes.  
- `Registrar pago` llamará a `markPaymentPaid`, pasando `maintainSchedule` según la opción elegida (“mantener calendario original” o “recalcular desde hoy”).  
- Tras el pago, se refrescan Pagos y Horas con el nuevo ciclo, ya que ambos usan el mismo módulo.

---

### 5. Migración y pruebas

1. **Migrar datos existentes:** script que recorra `payoutRecords`, calcule `nextCycleStart/End` y rellene campos faltantes con el helper.  
2. **Ajustar reservas antiguas:** si no tienen `periodKey`, generar uno con `getSchedule`.  
3. **Tests de regresión:**  
   - Unit: periodos mensuales (día 30/31), semanales, pagos anticipados.  
   - Integración: flujo completo Bookings → Horas → Pagos.
4. **Logs unificados:** informar en cada acción (`markPaymentPaid`, `aggregateHours`) para facilitar auditoría.

---

### 6. Futuro (opcional)

- Exponer el mismo módulo vía Cloud Functions / API si se requiere acceso desde apps móviles o integraciones externas.  
- Mantener la misma lógica: al migrar, bastará con mover este módulo a Functions sin reescribir la lógica.

