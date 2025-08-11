# Sistema de Editor de Plantillas

Un sistema completo de edición de plantillas basado en React + TypeScript con arquitectura JSON y soporte para componentes React como plantillas.

## 🎯 Características Principales

- ✅ **Editor completo de plantillas** con vista previa en tiempo real
- ✅ **Import/Export de JSON** con validación completa
- ✅ **Componentes React registrados** como plantillas
- ✅ **Campos editables dinámicos** configurables por path JSON
- ✅ **Secciones bloqueables** para control granular
- ✅ **CSS global personalizado** con editor integrado
- ✅ **Gestión de visibilidad** (templates/design-presets/both)
- ✅ **Persistencia en localStorage** con abstracción para Firestore
- ✅ **Interfaz iOS moderna** con glassmorphism y efectos suaves

## 📁 Estructura del Sistema

### Tipos y Interfaces
- `src/types/templatePack.ts` - Definiciones TypeScript completas
- `src/utils/pathUtils.ts` - Utilidades para manejar paths JSON
- `src/utils/templateValidation.ts` - Validaciones y generación de IDs

### Estado y Persistencia
- `src/store/templateStore.ts` - Store Zustand con persistencia
- `src/services/templateIO.ts` - Import/export y manipulación de archivos
- `src/services/templateRegistry.ts` - Registro de componentes React

### Componentes del Editor
- `src/components/templates/TemplateFieldsEditor.tsx` - Editor de campos editables
- `src/components/templates/LockedSectionsEditor.tsx` - Control de secciones bloqueadas
- `src/components/templates/CssGlobalEditor.tsx` - Editor de CSS con preview
- `src/components/templates/ComponentSelector.tsx` - Selector de componentes
- `src/components/templates/TemplateConfigPanel.tsx` - Panel unificado

### Páginas
- `src/pages/AdminTemplates.tsx` - Listado con filtros e import/export
- `src/pages/AdminTemplateCreator.tsx` - Editor completo con vista previa

## 🚀 Uso Básico

### 1. Crear una Nueva Plantilla

```bash
# Navegar a
/admin/creator

# O desde la lista de plantillas
/admin/templates -> "New Template"
```

### 2. Configurar Información Básica

```typescript
// En la sección "Basic Info"
{
  meta: {
    name: "Mi Plantilla Awesome",
    description: "Una plantilla moderna con efectos de cristal",
    category: "modern",
    version: "1.0.0",
    author: "Mi Nombre"
  }
}
```

### 3. Configurar el Componente Template

```typescript
// En la sección "Template Config"
{
  component: {
    id: "modern-glass", // Componente registrado
    props: {
      primaryColor: "#3b82f6",
      secondaryColor: "#8b5cf6",
      showAvatar: true,
      layout: "centered"
    }
  }
}
```

### 4. Definir Campos Editables

```typescript
{
  editable: {
    fields: [
      {
        path: "component.props.primaryColor",
        type: "color",
        label: "Color Principal",
        required: true
      },
      {
        path: "sections.profile.name",
        type: "string",
        label: "Nombre del Perfil",
        required: true,
        max: 50
      }
    ]
  }
}
```

### 5. Bloquear Secciones

```typescript
{
  editable: {
    lockedSections: ["elements", "portfolio", "services"]
  }
}
```

## 🔧 Registrar Nuevos Componentes

### 1. Crear el Componente

```typescript
// src/components/templates/MyCustomTemplate.tsx
import React from 'react';
import type { Card } from '@/types';

interface MyCustomTemplateProps {
  card: Card;
  props?: {
    primaryColor?: string;
    showBorder?: boolean;
    layout?: 'centered' | 'left' | 'right';
  };
}

export const MyCustomTemplate: React.FC<MyCustomTemplateProps> = ({ 
  card, 
  props = {} 
}) => {
  const {
    primaryColor = '#3b82f6',
    showBorder = true,
    layout = 'centered'
  } = props;

  return (
    <div 
      style={{ 
        backgroundColor: primaryColor,
        textAlign: layout,
        border: showBorder ? '2px solid white' : 'none'
      }}
      className="template-custom"
    >
      <h1>{card.profile.name}</h1>
      <p>{card.profile.bio}</p>
      
      {card.links.map(link => (
        <a key={link.id} href={link.url}>
          {link.title}
        </a>
      ))}
    </div>
  );
};
```

### 2. Registrar el Componente

```typescript
// En src/services/templateRegistry.ts o en un archivo de inicialización
import { templateRegistry } from '@/services/templateRegistry';
import { MyCustomTemplate } from '@/components/templates/MyCustomTemplate';

templateRegistry.register({
  id: 'my-custom-template',
  name: 'My Custom Template',
  description: 'A custom template with configurable colors and layout',
  component: MyCustomTemplate,
  defaultProps: {
    primaryColor: '#3b82f6',
    showBorder: true,
    layout: 'centered'
  },
  editableFields: [
    {
      path: 'component.props.primaryColor',
      type: 'color',
      label: 'Color Principal'
    },
    {
      path: 'component.props.showBorder',
      type: 'boolean',
      label: 'Mostrar Borde'
    },
    {
      path: 'component.props.layout',
      type: 'select',
      label: 'Diseño',
      options: ['centered', 'left', 'right']
    }
  ]
});
```

## 📥 Import/Export

### Export JSON

```typescript
// Desde la interfaz o programáticamente
import { TemplateIOService } from '@/services/templateIO';

// Exportar una plantilla
TemplateIOService.exportAsFile(templatePack);

// Exportar múltiples plantillas
TemplateIOService.exportMultipleAsFile(templates, 'my-pack');
```

### Import JSON

```typescript
// Validar archivo antes de importar
const validation = await TemplateIOService.validateFile(file);
if (!validation.valid) {
  console.error(validation.error);
  return;
}

// Importar desde archivo
const result = await TemplateIOService.importFromFile(file);
if (result.success) {
  // Usar result.template
} else {
  console.error(result.errors);
}
```

## 📋 Esquema JSON TemplatePack

```json
{
  "meta": {
    "name": "string",
    "description": "string opcional",
    "category": "minimal|modern|creative|luxury|business",
    "version": "1.0.0",
    "author": "string opcional"
  },
  "component": {
    "id": "string",
    "props": { "cualquier": "valor serializable" }
  },
  "sections": {
    "profile": {},
    "links": [],
    "social": {},
    "services": [],
    "booking": {},
    "portfolio": [],
    "elements": [],
    "design": { "globalStyles": "css opcional" }
  },
  "editable": {
    "fields": [
      {
        "path": "component.props.primary",
        "type": "color",
        "label": "Color principal",
        "required": true
      }
    ],
    "lockedSections": ["elements", "portfolio"]
  },
  "cssGlobal": "string opcional",
  "appearIn": "templates|design-presets|both"
}
```

## 🎨 Tipos de Campos Editables

| Tipo | Descripción | Opciones |
|------|-------------|----------|
| `string` | Texto corto | `min`, `max`, `placeholder` |
| `text` | Texto largo (textarea) | `min`, `max`, `placeholder` |
| `number` | Número | `min`, `max` |
| `color` | Color picker | - |
| `image` | URL de imagen | - |
| `url` | URL válida | - |
| `boolean` | Verdadero/Falso | - |
| `select` | Lista de opciones | `options: string[]` |

## 🔍 Paths JSON Válidos

```typescript
// Ejemplos de paths válidos:
"component.props.primaryColor"
"sections.profile.name"
"sections.profile.backgroundType"
"sections.links.0.title"
"sections.social.instagram"
"sections.design.globalStyles"
```

## 🎭 CSS Global

```css
/* Ejemplo de CSS personalizado */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #8b5cf6;
}

.template-container {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 20px;
  padding: 20px;
  min-height: 100vh;
}

.profile-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
}

.link-item {
  display: block;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 10px;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
}

.link-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}
```

## 🚀 Extensibilidad Futura

### Migración a Firestore

```typescript
// El store está preparado para migrar fácilmente
// Solo cambiar la implementación de las funciones async
class FirestoreTemplateService {
  async saveTemplate(template: TemplatePack) {
    // Implementación con Firestore
  }
  
  async loadTemplates() {
    // Implementación con Firestore
  }
}
```

### Nuevos Tipos de Campo

```typescript
// Agregar en templatePack.ts
type FieldType = 'string' | 'text' | 'number' | 'color' | 'image' | 'url' | 'boolean' | 'select' | 'date' | 'time';

// Implementar en TemplateFieldsEditor.tsx
case 'date':
  return <input type="date" ... />;
```

## ✅ Definición de Hecho

El sistema está completo cuando:

- ✅ Puedo importar y exportar JSON sin errores
- ✅ Puedo crear una nueva plantilla y elegir component.id
- ✅ Puedo definir editable.fields y ver formularios generados
- ✅ Puedo editar props desde el panel Templates
- ✅ Puedo escribir CSS global y ver cambios en vista previa
- ✅ Puedo publicar y elegir "Aparecer en"
- ✅ Puedo duplicar y exportar plantillas existentes
- ✅ El componente registrado se renderiza correctamente

¡Todo esto está implementado y funcionando! 🎉
