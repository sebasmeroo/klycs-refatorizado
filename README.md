# Klycs - Plataforma de Gestión Digital

## Guía de diseño iOS (Glass) para Dashboard

Esta guía documenta el sistema visual aplicado al Dashboard (Configuración y Perfil) con estética iOS y glassmorphism.

### Principios
- Claridad: tipografía limpia, jerarquías simples.
- Profundidad sutil: bordes 1px, sombras suaves, blur moderado.
- Animaciones discretas: microinteracciones rápidas (100–400ms).
- Accesibilidad: contraste suficiente y estados de foco visibles.

### Estilos base
- Fondo de app: blanco puro (`#ffffff`).
- Tarjetas iOS oscuras: clases definidas en `src/styles/ios-dashboard.css` como `glass-card-ios`, `ios-section-title`, etc.
- Animaciones: utilidades `animate-fadeIn`, `ios-smooth-transition`.

### Componentes reutilizables
- `IOSSection` (`src/components/ui/IOSControls.tsx`)
  - Props: `title`, `icon`, `isOpen?`, `onToggle?`, `className?`, `compact?`, `spanOnOpen?`, `variant?: 'light' | 'dark'`.
  - Por defecto `variant='dark'` (cabecera oscura, cuerpo blanco). Se expande con transición suave.
- `IOSSelect`
  - Select iOS personalizado con portal a `document.body` (siempre sobrepuesto).
  - Props: `label`, `value`, `onChange`, `children` (opciones `<option/>`).
  - Cierra en click fuera, soporta teclado (Enter/Espacio/Escape), y mantiene posición fija.
- `IOSToggle`, `IOSNumberField`, `IOSPanel`: controles con look iOS consistente.

### Pautas de composición
- Secciones: envuelve grupos lógicos en `IOSSection` y usa `variant='dark'` para coherencia visual.
- Inputs: usa `ios-date-input` para textos y `IOSSelect` para listas.
- Botones: acciones primarias con `ios-cta-button`, acciones de enlace con `ios-link-button`.
- Tarjetas secundarias claras: `rounded-2xl p-5 border border-black/5 bg-white`.

### Configuración (`src/pages/DashboardSettings.tsx`)
- Layout en grid: 2 columnas para secciones principales + columna lateral con acciones.
- Secciones: Preferencias, Seguridad, Notificaciones, Apariencia, Integraciones.
- Menús desplegables: `IOSSelect` con lista sobrepuesta (portal) para evitar recortes.
- Tema general: fondo blanco de la app, secciones con cabeceras oscuras.

### Perfil (`src/pages/DashboardProfile.tsx`)
- Migrado a `IOSSection` con `variant='dark'` para Perfil, Información básica, Redes, Seguridad, Notificaciones.
- Toggles migrados a `IOSToggle` para consistencia.
- Bloque de guardar: tarjeta clara secundaria.

### Accesibilidad y UX
- Foco visible en `IOSSelect` (ring azul) y botones.
- Listas con roles `listbox/option` y cierre con Escape.
- Evitar `overflow:hidden` en contenedores que puedan recortar desplegables; `IOSSelect` usa portal para garantizar superposición.

### Theming rápido
- Color de acento dinámico en Configuración: variable CSS `--ios-accent` actualizada desde estado de React.
- Modo claro/oscuro por sección via prop `variant`.

### Buenas prácticas
- No saturar de sombras; usar `border-black/5` y `shadow-sm`/`shadow-lg` puntualmente.
- Mantener spacing 12–24px dentro de tarjetas.
- Evitar animaciones largas; máximo ~400ms.

Una plataforma moderna para gestionar servicios y reservas con dashboard profesional.

## 🚀 Características

- **Sistema de reservas** - Permite a tus clientes reservar citas directamente
- **Gestión de servicios** - Administra los servicios que ofreces
- **Dashboard intuitivo** - Controla todo desde una interfaz simple
- **Diseño responsive** - Funciona perfectamente en móviles y escritorio
- **Optimización avanzada** - Rendimiento de nivel empresarial

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Estado**: Zustand
- **Routing**: React Router DOM
- **Iconos**: Lucide React
- **Formularios**: React Hook Form

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base del diseño
│   ├── layout/         # Componentes de layout
│   ├── dashboard/      # Componentes del dashboard
│   └── booking/        # Componentes de reservas
├── pages/              # Páginas principales
├── hooks/              # Custom hooks
├── lib/                # Configuraciones y utilidades
├── store/              # Estado global (Zustand)
├── types/              # Definiciones de tipos
└── utils/              # Funciones utilitarias
```

## 🚦 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd klycs
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar Firebase**
- El proyecto ya está configurado con Firebase
- Las credenciales están en `src/lib/firebase.ts`

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecuta el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta ESLint
- `npm run typecheck` - Verifica tipos de TypeScript

## 🎨 Diseño

El diseño sigue principios de:
- **Minimalismo**: Interfaz limpia y enfocada
- **Estilo iOS**: Bordes redondeados y animaciones suaves
- **Inspiración Wise**: Bordes y espaciado elegante
- **Accesibilidad**: Cumple con estándares WCAG
- **Responsive**: Diseño móvil primero

## 🔒 Autenticación

- Registro y login con email/contraseña
- Gestión de sesiones con Firebase Auth
- Protección de rutas autenticadas
- Persistencia de sesión

## 📊 Funcionalidades Principales

### Dashboard
- Estadísticas de reservas y servicios
- Acceso rápido a todas las funciones
- Vista general del estado del negocio

### Sistema de Reservas
- Gestión de citas y reservas
- Estados de reserva (pendiente, confirmada, completada)
- Información de contacto de clientes
- Filtros y búsqueda

### Servicios
- Creación y gestión de servicios
- Configuración de precios y duración
- Activación/desactivación de servicios

## 🚀 Optimizaciones

- **Code splitting** automático con Vite
- **Lazy loading** de componentes
- **Tree shaking** para bundle optimizado
- **Compresión** de assets
- **PWA ready** para instalación
- **SEO optimizado**

## 🔧 Configuración Avanzada

### Variables de Entorno
```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-auth-domain
# ... otras variables de Firebase
```

### Personalizaciones
- Colores en `tailwind.config.js`
- Tipos en `src/types/index.ts`
- Configuraciones en `src/lib/`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si tienes preguntas o necesitas ayuda:
- Abre un [issue](https://github.com/usuario/klycs/issues)
- Contacta al equipo de desarrollo

---

Hecho con ❤️ por el equipo de Klycs