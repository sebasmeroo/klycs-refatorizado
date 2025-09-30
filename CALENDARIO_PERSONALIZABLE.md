# 📅 Calendario Personalizable y Eventos Recurrentes

## ✨ Nuevas Funcionalidades Implementadas

### 1. **Campos Personalizados en Eventos** 🎨

Ahora los profesionales pueden personalizar completamente el formulario de creación de eventos.

#### Tipos de campos disponibles:
- 📝 **Texto corto**: Para nombres, títulos, etc.
- 📄 **Texto largo**: Para descripciones extensas
- 🔗 **Enlace/URL**: Para links (Zoom, Google Meet, etc.)
- ✉️ **Email**: Validación de correos
- 📞 **Teléfono**: Para números de contacto
- 🔢 **Número**: Cantidades, códigos, etc.
- 📋 **Selección**: Lista desplegable con opciones
- 📅 **Fecha**: Selección de fechas adicionales

#### Ejemplos de uso:
```
- Link de reunión: https://zoom.us/j/...
- Ruta del evento: Calle Principal #123, Piso 2
- Código Postal: 28001
- Tipo de consulta: [Selección: Primera vez / Seguimiento / Urgente]
- Número de participantes: 5
```

#### Características:
- ✅ Reordenar campos (drag & drop)
- ✅ Mostrar/Ocultar campos
- ✅ Marcar campos como obligatorios
- ✅ Personalizar placeholder
- ✅ Iconos personalizados

---

### 2. **Eventos Recurrentes** 🔄

Crea eventos que se repiten automáticamente en los días seleccionados.

#### ¿Cómo funciona?

1. **Activa la recurrencia** con el toggle
2. **Selecciona días** (L, M, X, J, V, S, D)
3. **Define duración** (1-52 semanas)
4. **Crea el evento** → Se generan automáticamente todas las ocurrencias

#### Ejemplo:
```
Evento: "Consulta de Fisioterapia"
Recurrencia: Lunes, Miércoles, Viernes
Duración: 12 semanas
Hora: 10:00 - 11:00

Resultado: 36 eventos creados (3 días × 12 semanas)
```

#### Características:
- ✅ Máximo 52 semanas (1 año)
- ✅ Selección multi-día
- ✅ Eventos independientes (editar uno no afecta los demás)
- ✅ Marcados como instancias de evento recurrente

---

## 🛠️ Implementación Técnica

### Archivos Nuevos Creados:

1. **`src/components/calendar/CustomFieldsEditor.tsx`**
   - Editor visual de campos personalizados
   - Drag & drop para reordenar
   - Vista previa en tiempo real

2. **`src/components/calendar/RecurrenceSelector.tsx`**
   - Selector de días de la semana
   - Configuración de duración
   - Toggle de activación

3. **Tipos actualizados en `src/types/calendar.ts`**:
   ```typescript
   export interface CustomEventField {
     id: string;
     label: string;
     type: 'text' | 'textarea' | 'url' | 'email' | 'phone' | 'number' | 'select' | 'date';
     placeholder?: string;
     required: boolean;
     options?: string[];
     order: number;
     isVisible: boolean;
     icon?: string;
   }

   export interface CalendarSettings {
     // ... campos existentes ...
     customFields?: CustomEventField[];
   }

   export interface CalendarEvent {
     // ... campos existentes ...
     customFieldsData?: Record<string, any>;
     isRecurringInstance?: boolean;
     parentEventId?: string;
     recurring?: RecurrencePattern;
   }
   ```

4. **Servicio actualizado `src/services/collaborativeCalendar.ts`**:
   - `createSingleEvent()`: Crear un solo evento
   - `createRecurringEvents()`: Crear múltiples eventos recurrentes
   - Soporte para campos personalizados

---

## 🎯 Cómo Integrar en tu Calendario

### Paso 1: Configurar Campos Personalizados

```tsx
import { CustomFieldsEditor } from '@/components/calendar/CustomFieldsEditor';
import { CollaborativeCalendarService } from '@/services/collaborativeCalendar';

// En tu configuración de calendario
<CustomFieldsEditor
  fields={calendar.settings.customFields || []}
  onUpdate={async (fields) => {
    await CollaborativeCalendarService.updateCalendarSettings(calendarId, {
      ...calendar.settings,
      customFields: fields
    });
  }}
/>
```

### Paso 2: Agregar Recurrencia al Formulario de Eventos

```tsx
import { RecurrenceSelector } from '@/components/calendar/RecurrenceSelector';
import { CalendarEventService } from '@/services/collaborativeCalendar';

// En tu formulario de nuevo evento
const [recurrence, setRecurrence] = useState<RecurrencePattern | null>(null);

<RecurrenceSelector
  value={recurrence}
  onChange={setRecurrence}
/>

// Al crear el evento
await CalendarEventService.createEvent(calendarId, {
  // ... otros campos ...
  recurring: recurrence,
  customFieldsData: {
    'field_123': 'Valor del campo',
    'field_456': 'https://zoom.us/...'
  }
});
```

### Paso 3: Renderizar Campos Personalizados en el Formulario

```tsx
// Obtener campos del calendario
const customFields = calendar.settings.customFields || [];

// Renderizar dinámicamente
{customFields
  .filter(f => f.isVisible)
  .sort((a, b) => a.order - b.order)
  .map(field => (
    <div key={field.id}>
      <label>{field.label} {field.required && '*'}</label>
      
      {field.type === 'text' && (
        <input
          type="text"
          placeholder={field.placeholder}
          required={field.required}
          onChange={(e) => setCustomFieldData(field.id, e.target.value)}
        />
      )}
      
      {field.type === 'url' && (
        <input
          type="url"
          placeholder={field.placeholder}
          required={field.required}
          onChange={(e) => setCustomFieldData(field.id, e.target.value)}
        />
      )}
      
      {field.type === 'select' && (
        <select
          required={field.required}
          onChange={(e) => setCustomFieldData(field.id, e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}
      
      {/* Más tipos... */}
    </div>
  ))
}
```

---

## 📋 Ejemplo Completo de Uso

### Configuración de Campos Personalizados:

1. **Link de Videollamada**
   - Tipo: URL
   - Obligatorio: Sí
   - Placeholder: "https://zoom.us/j/..."

2. **Dirección del Evento**
   - Tipo: Texto largo
   - Obligatorio: No
   - Placeholder: "Calle, número, piso..."

3. **Código Postal**
   - Tipo: Texto corto
   - Obligatorio: No
   - Placeholder: "28001"

4. **Tipo de Consulta**
   - Tipo: Selección
   - Opciones: ["Primera vez", "Seguimiento", "Urgente"]
   - Obligatorio: Sí

### Crear Evento Recurrente:

```
Título: "Consulta de Fisioterapia"
Descripción: "Sesión de tratamiento"
Fecha: 12 de Septiembre, 2025
Hora: 09:00 - 10:00

Recurrencia: ✅ Activada
Días: L, X, V (Lunes, Miércoles, Viernes)
Duración: 12 semanas

Campos personalizados:
- Link de Videollamada: https://zoom.us/j/123456789
- Dirección del Evento: Consultorio 2, Piso 1
- Código Postal: 28001
- Tipo de Consulta: Seguimiento

→ Crear Evento
→ Se crean 36 eventos (3 días × 12 semanas)
→ Todos con los mismos campos personalizados
→ Aparecen en el calendario del profesional
```

---

## 🎨 UI/UX

### CustomFieldsEditor:
- Diseño moderno con glassmorphism
- Drag & drop visual
- Iconos para cada tipo de campo
- Toggle de visibilidad
- Expansión/Contracción de campos
- Validación en tiempo real

### RecurrenceSelector:
- Toggle intuitivo
- Selector de días estilo iOS
- Contador de semanas con límite
- Info contextual
- Diseño responsive

---

## 🚀 Beneficios

### Para Profesionales:
- ✅ Formularios a medida para su tipo de servicio
- ✅ Eventos recurrentes sin trabajo manual
- ✅ Recopilar información específica necesaria
- ✅ Organización automática del calendario

### Para Clientes:
- ✅ Formularios claros y concisos
- ✅ Campos relevantes al servicio
- ✅ Menos errores de captura
- ✅ Mejor experiencia de reserva

---

## 📊 Límites y Restricciones

### Campos Personalizados:
- Sin límite de campos
- Tipos: 8 disponibles
- Reordenamiento ilimitado

### Eventos Recurrentes:
- Máximo: 52 semanas (1 año)
- Días: Selección múltiple (1-7 días)
- Eventos creados: Hasta ~364 (7 días × 52 semanas)
- Recomendado: 12-24 semanas para mejor rendimiento

---

## 🔧 Mantenimiento

### Editar Campos Personalizados:
1. Ve a Configuración del Calendario
2. Sección "Campos Personalizados"
3. Click en el campo a editar
4. Modifica y guarda
5. ✅ Se aplica inmediatamente a nuevos eventos

### Editar Eventos Recurrentes:
- **Evento padre**: Editar afecta solo ese evento
- **Instancias**: Son eventos independientes
- **Eliminar**: Puedes eliminar instancias individuales
- **Modificar serie**: Requiere eliminar y recrear

---

## 🆘 Preguntas Frecuentes

**¿Puedo tener campos diferentes para cada tipo de evento?**
- Actualmente los campos son por calendario. Recomendamos crear calendarios separados para servicios diferentes.

**¿Los eventos recurrentes se sincronizan con Google Calendar?**
- Sí, cada evento se sincroniza individualmente.

**¿Puedo modificar un día específico de una serie recurrente?**
- Sí, cada evento es independiente y se puede editar.

**¿Los campos personalizados son visibles para el cliente?**
- Solo los campos marcados como visibles aparecen en el formulario de reserva.

**¿Hay límite de eventos recurrentes?**
- Sí, máximo 52 semanas para mantener buen rendimiento.

---

## 🎯 Próximos Pasos

Para usar estas funcionalidades en tu calendario, necesitas:

1. **Actualizar el componente de creación de eventos** para incluir:
   - `<RecurrenceSelector />`
   - Renderizado dinámico de campos personalizados

2. **Agregar configuración en el panel del calendario** para:
   - `<CustomFieldsEditor />`

3. **Integrar en `DashboardBookings.tsx`** o tu componente principal

¿Necesitas ayuda con la integración? Puedo crear el componente completo del modal de evento actualizado.
