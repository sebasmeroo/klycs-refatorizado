# 🚀 DESPLEGAR AHORA - Pasos Exactos

## ✅ Cambios Realizados

1. ✅ Reglas de Firestore actualizadas (`firestore.rules`)
2. ✅ Índices agregados a `firestore.indexes.json`
3. ✅ Bug de `undefined` arreglado en `professionalAvailability.ts`
4. ✅ Inbox convertido a sidebar deslizante

---

## 🔥 PASO 1: Desplegar Todo (OPCIÓN RÁPIDA)

### Windows
```bash
.\deploy-firestore.bat
```

### Mac/Linux
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

**Esto desplegará:**
- ✅ Reglas de seguridad actualizadas
- ✅ 3 índices nuevos para `professional_availability`

---

## 🔥 PASO 2: Esperar Construcción de Índices

**Tiempo estimado:** 2-10 minutos

**Ver estado:** https://console.firebase.google.com/project/klycs-58190/firestore/indexes

Estados:
- 🟡 **Building** → Espera
- 🟢 **Enabled** → ¡Listo!
- 🔴 **Error** → Contacta soporte

---

## 🧪 PASO 3: Verificar que Funciona

### Test 1: Crear Solicitud de Disponibilidad

1. Ve a `/calendar/:calendarId?email=profesional@ejemplo.com`
2. Selecciona una fecha
3. Click en "Añadir" en panel de disponibilidad
4. Elige tipo: "Bloqueo" o "Nota"
5. Completa formulario y envía

**Resultado esperado:**
- ✅ No error de "undefined"
- ✅ No error de permisos
- ✅ Solicitud aparece en lista con status "Pendiente"

---

### Test 2: Ver Inbox (Owner)

1. Ve a `/dashboard/bookings`
2. Mira el botón Inbox en header superior
3. Debe mostrar badge con número si hay pendientes
4. Click en botón Inbox

**Resultado esperado:**
- ✅ Sidebar se desliza desde la derecha
- ✅ Muestra solicitudes agrupadas por profesional
- ✅ No error de índice

---

### Test 3: Aprobar Solicitud

1. En el Inbox, click en "Aprobar" en una solicitud
2. Debe desaparecer inmediatamente (optimistic update)

**Resultado esperado:**
- ✅ Solicitud desaparece de inbox
- ✅ Contador de badge se actualiza
- ✅ Profesional ve status "Aprobado"

---

### Test 4: Rechazar Solicitud

1. Click en "Rechazar" en una solicitud
2. Escribe un motivo
3. Click en "Confirmar rechazo"

**Resultado esperado:**
- ✅ Solicitud desaparece de inbox
- ✅ Profesional ve status "Rechazado" con motivo

---

## 🐛 Si Hay Errores

### Error: "The query requires an index"

**Solución:**
1. Copia el link del error completo
2. Pégalo en navegador
3. Click "Crear índice"
4. Espera 2-5 minutos

O usa el link directo del error que te salga.

---

### Error: "Missing or insufficient permissions"

**Causas posibles:**

1. **No desplegaste las reglas:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Usuario no autenticado:**
   - Verifica que estás logueado
   - Verifica que el `professionalId` coincide con tu UID

3. **Status incorrecto:**
   - Las solicitudes siempre deben crearse con `status: 'pending'`

**Debug:**
Ver errores detallados en:
https://console.firebase.google.com/project/klycs-58190/firestore/rules

---

### Error: Índices no se construyen

**Solución:**

Si los índices tardan más de 15 minutos:

1. Ve a: https://console.firebase.google.com/project/klycs-58190/firestore/indexes
2. Si hay error, elimina el índice fallido
3. Créalo manualmente:
   - Click "Create index"
   - Collection: `professional_availability`
   - Campos según `CREAR_INDICES_FIRESTORE.md`

---

## 📊 Monitoreo

### Ver Logs de Errores
https://console.firebase.google.com/project/klycs-58190/firestore/rules

### Ver Estado de Índices
https://console.firebase.google.com/project/klycs-58190/firestore/indexes

### Ver Documentos Creados
https://console.firebase.google.com/project/klycs-58190/firestore/data/~2Fprofessional_availability

---

## ✅ Checklist Final

- [ ] Desplegadas reglas: `firebase deploy --only firestore:rules`
- [ ] Desplegados índices: `firebase deploy --only firestore:indexes`
- [ ] Esperados 5-10 minutos para construcción
- [ ] Índices en estado "Enabled" ✅
- [ ] Test 1 pasado: Crear solicitud sin errores
- [ ] Test 2 pasado: Ver inbox en sidebar
- [ ] Test 3 pasado: Aprobar funciona
- [ ] Test 4 pasado: Rechazar funciona

---

## 🎉 Una Vez Funcione

El sistema está completo y listo:
- ✅ Profesionales pueden solicitar disponibilidades
- ✅ Propietarios reciben en inbox (sidebar)
- ✅ Sistema de aprobación funcional
- ✅ Optimistic updates
- ✅ Costes ultra-bajos (< $0.001/mes)

---

## 📞 Si Necesitas Ayuda

1. Revisa errores en consola del navegador
2. Revisa logs de Firestore (links arriba)
3. Verifica que índices estén en "Enabled"
4. Verifica que reglas estén desplegadas

**Comando para verificar despliegue:**
```bash
firebase deploy --only firestore:rules --dry-run
```
