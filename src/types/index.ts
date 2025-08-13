export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}



export interface PortfolioImage {
  id: string;
  fileName: string;
  urls: {
    thumbnail: string;
    medium: string;
    large: string;
    original: string;
  };
  metadata: {
    width: number;
    height: number;
    size: number;
    uploadedAt: string;
  };
  order: number;
}



export interface BookingSettings {
  enabled: boolean;
  title: string;
  description: string;
  duration: number; // in minutes
  price?: number;
  currency: string;
  timeSlots: TimeSlot[];
  availability: Availability[];
  requiresApproval: boolean;
  collectPayment: boolean;
  customFields: CustomField[];
  buttonStyle?: string; // Template ID para el estilo del botón
  buttonText?: string;
  buttonSubtext?: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
}

export interface Booking {
  id: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  service: string;
  date: Date;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  userId: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Availability {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}



export interface LayoutModule {
  id: string;
  type: 'profile' | 'bio' | 'links' | 'contact' | 'services' | 'portfolio' | 'social' | 'booking';
  isVisible: boolean;
  showTitle?: boolean;
  order: number;
  style: ModuleStyle;
}

export interface ModuleStyle {
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  // Nuevos campos para diseño avanzado
  spacing?: AdvancedSpacing;
  border?: AdvancedBorder;
  layout?: AdvancedLayout;
  shadow?: AdvancedShadow;
  transform?: AdvancedTransform;
  effects?: AdvancedEffects;
  // Nuevos campos para herramientas avanzadas
  textStyle?: any; // De AdvancedTextEditor
  backgroundImage?: string; // De ImageEditor
  gradient?: any; // De GradientEditor
  pattern?: any; // De PatternTextureSystem
  animations?: any[]; // De AnimationSystem
  icon?: any; // De IconLibrary
  shapes?: any[]; // De ShapeEditor
  // Design style for services module
  designStyle?: 'modern' | 'glassmorphism' | 'neon' | 'minimal' | 'retro' | 'liquid' | 'card3d' | 'gradient';
  content?: any; // Contenido del módulo
}

export interface AdvancedSpacing {
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    unit: 'px' | 'rem' | '%' | 'vh' | 'vw';
  };
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    unit: 'px' | 'rem' | '%' | 'vh' | 'vw';
  };
  gap: {
    value: number;
    unit: 'px' | 'rem' | '%';
  };
}

export interface AdvancedBorder {
  radius: {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
    unit: 'px' | 'rem' | '%';
  };
  width: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    unit: 'px';
  };
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';
  color: string;
}

export interface AdvancedLayout {
  width: {
    type: 'auto' | 'full' | 'custom' | 'fit-content' | 'min-content' | 'max-content';
    value?: number;
    unit?: 'px' | '%' | 'rem' | 'vh' | 'vw';
    maxWidth?: number;
    minWidth?: number;
  };
  height: {
    type: 'auto' | 'full' | 'custom' | 'fit-content' | 'min-content';
    value?: number;
    unit?: 'px' | '%' | 'rem' | 'vh' | 'vw';
    maxHeight?: number;
    minHeight?: number;
  };
  positioning: {
    type: 'relative' | 'absolute' | 'fixed' | 'sticky';
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    unit?: 'px' | '%' | 'rem' | 'vh' | 'vw';
  };
  overflow: 'visible' | 'hidden' | 'scroll' | 'auto';
  zIndex: number;
  display: 'block' | 'flex' | 'grid' | 'inline' | 'inline-block' | 'inline-flex';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  gap?: number;
}

export interface AdvancedShadow {
  enabled: boolean;
  shadows: {
    id: string;
    x: number;
    y: number;
    blur: number;
    spread: number;
    color: string;
    opacity: number;
    inset: boolean;
  }[];
}

export interface AdvancedTransform {
  scale: number;
  rotate: number;
  translateX: number;
  translateY: number;
  skewX: number;
  skewY: number;
  perspective: number;
  transformOrigin: string;
}

export interface AdvancedEffects {
  opacity: number;
  blur: number;
  brightness: number;
  contrast: number;
  saturate: number;
  hueRotate: number;
  sepia: number;
  grayscale: number;
  backdrop?: {
    blur: number;
    brightness: number;
    contrast: number;
    saturate: number;
  };
}

export interface ResponsiveStyle {
  mobile?: ModuleStyle;
  tablet?: ModuleStyle;
  desktop?: ModuleStyle;
}

export interface DesignPreset {
  id: string;
  name: string;
  description: string;
  category: 'spacing' | 'border' | 'layout' | 'effects';
  icon: string;
  style: Partial<ModuleStyle>;
}

// ===== SISTEMA DE TARJETAS =====

export interface Card {
  id: string;
  userId: string;
  title: string;
  description?: string;
  slug: string; // URL amigable para compartir
  isPublic: boolean;
  
  // Perfil
  profile: {
    name: string;
    bio?: string;
    avatar?: string;
    backgroundImage?: string;
    backgroundType: 'color' | 'gradient' | 'image';
    backgroundColor?: string;
    backgroundGradient?: string;
    // Modo alternativo: hoja en blanco para este apartado
    useCustomCode?: boolean;
    customCode?: {
      html?: string;
      css?: string;
      js?: string;
      height?: number;
    };
    
    // Configuración avanzada de diseño
    design: ProfileDesign;
  };

  // Enlaces y elementos
  links: CardLink[];
  elements: CardElement[];

  // ===== NUEVAS SECCIONES =====
  
  // Redes sociales
  socialLinks: CardSocialLinks[];
  
  // Servicios profesionales
  services: CardService[];
  
  // Portfolio
  portfolio: {
    items: CardPortfolioItem[];
    style: PortfolioStyle;
    isVisible: boolean;
    showTitle: boolean;
    title?: string;
    order: number;
  };
  
  // Sistema de reservas
  booking: CardBooking;

  // Diseño y tema
  theme: CardTheme;
  customCSS?: string;

  // Configuración
  settings: CardSettings;

  // Metadatos
  viewCount: number;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  iconType: 'lucide' | 'custom' | 'emoji';
  isVisible: boolean;
  order: number;
  style: LinkStyle;
  analytics: {
    clicks: number;
    lastClicked?: Date;
  };
}

export interface CardElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'divider' | 'spacer' | 'embed' | 'social-links' | 'services' | 'portfolio' | 'booking' | 'custom-code';
  content: any; // Contenido específico del tipo
  isVisible: boolean;
  order: number;
  style: ElementStyle;
}

export interface CardTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  spacing: 'compact' | 'normal' | 'relaxed';
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  animation: 'none' | 'subtle' | 'smooth' | 'bouncy';
}

export interface LinkStyle {
  variant: 'solid' | 'outline' | 'ghost' | 'gradient' | 'glassmorphism';
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: string;
  padding?: string;
  fontSize?: string;
  fontWeight?: string;
  shadow?: string;
  hover?: {
    backgroundColor?: string;
    textColor?: string;
    transform?: string;
    shadow?: string;
  };
}

export interface ElementStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: string;
  fontWeight?: string;
  shadow?: string;
}

export interface CardSettings {
  seo: {
    title?: string;
    description?: string;
    image?: string;
  };
  analytics: {
    enabled: boolean;
    trackClicks: boolean;
    trackViews: boolean;
  };
  sharing: {
    enabled: boolean;
    allowEmbed: boolean;
    customDomain?: string;
  };
  branding: {
    showWatermark: boolean;
    customFooter?: string;
  };
}

// ===== NUEVAS SECCIONES DE TARJETA =====

export interface CardSocialLinks {
  id: string;
  platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'youtube' | 'tiktok' | 'whatsapp' | 'telegram' | 'github' | 'behance' | 'dribbble' | 'pinterest' | 'snapchat' | 'discord';
  username: string;
  url: string;
  isVisible: boolean;
  order: number;
  style: SocialLinkStyle;
}

export interface SocialLinkStyle {
  displayType: 'icon' | 'button' | 'pill';
  size: 'sm' | 'md' | 'lg';
  color?: string;
  backgroundColor?: string;
  borderRadius?: string;
  shadow?: boolean;
  hover?: {
    color?: string;
    backgroundColor?: string;
    transform?: string;
  };
}

export interface CardService {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration?: number; // en minutos
  isVisible: boolean;
  order: number;
  category?: string;
  features?: string[];
  image?: string;
  style: ServiceStyle;
  booking?: {
    enabled: boolean;
    requiresApproval: boolean;
    customFields: CustomField[];
  };
}

export interface ServiceStyle {
  layout: 'card' | 'list' | 'minimal' | 'detailed';
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: string;
  padding?: string;
  shadow?: string;
  priceStyle?: {
    color?: string;
    size?: string;
    position?: 'top' | 'bottom' | 'side';
  };
}

export interface CardPortfolioItem {
  id: string;
  type: 'image' | 'video';
  title?: string;
  description?: string;
  url: string; // URL del archivo
  thumbnail?: string; // Para videos
  isVisible: boolean;
  order: number;
  category?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // Para videos
    size?: number;
  };
}

export interface PortfolioStyle {
  layout: 'grid' | 'masonry' | 'carousel' | 'list';
  columns: 1 | 2 | 3 | 4;
  spacing: 'tight' | 'normal' | 'relaxed';
  aspectRatio?: 'square' | '4:3' | '16:9' | 'auto';
  showTitles: boolean;
  showDescriptions: boolean;
  borderRadius?: string;
  shadow?: string;
  overlay?: {
    enabled: boolean;
    color?: string;
    opacity?: number;
  };
}

export interface CardBooking {
  enabled: boolean;
  title: string;
  description?: string;
  services: string[]; // IDs de servicios disponibles
  calendar: {
    enabled: boolean;
    timeSlots: TimeSlot[];
    availability: Availability[];
    blackoutDates: string[];
  };
  form: {
    fields: CustomField[];
    requiresApproval: boolean;
    autoConfirm: boolean;
    notification: {
      email: boolean;
      sms: boolean;
    };
  };
  payment: {
    enabled: boolean;
    processor?: 'stripe' | 'paypal';
    requiresDeposit: boolean;
    depositAmount?: number;
  };
  style: BookingStyle;
}

export interface BookingStyle {
  layout: 'inline' | 'modal' | 'popup';
  buttonStyle: LinkStyle;
  calendarTheme: 'default' | 'minimal' | 'modern';
  formStyle: {
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    spacing?: string;
  };
}

// Templates predefinidos para tarjetas
export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'business' | 'creative' | 'social' | 'portfolio';
  preview: string; // URL de imagen de preview
  theme: CardTheme;
  defaultLinks: Omit<CardLink, 'id' | 'analytics'>[];
  defaultElements: Omit<CardElement, 'id'>[];
  isPremium?: boolean;
}

// Para analytics y estadísticas
export interface CardAnalytics {
  cardId: string;
  period: 'day' | 'week' | 'month' | 'year';
  views: number;
  clicks: number;
  topLinks: {
    linkId: string;
    title: string;
    clicks: number;
  }[];
  referrers: {
    source: string;
    count: number;
  }[];
  locations: {
    country: string;
    count: number;
  }[];
  devices: {
    type: 'mobile' | 'desktop' | 'tablet';
    count: number;
  }[];
}

// ===== SISTEMA DE DISEÑO AVANZADO DE PERFIL =====

export interface ProfileDesign {
  layout: ProfileLayout;
  elements: ProfileElements;
  spacing: SpacingConfig;
  container: ProfileContainerStyle;
  content?: ProfilePresetContent;
  preset?: string; // ID del preset aplicado
  showCareerDescription?: boolean; // Controla si se muestra la descripción de carrera por defecto
}

export interface ProfileLayout {
  direction: 'column' | 'row';
  alignment: {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'center' | 'bottom';
  };
  order: ProfileElementOrder[];
}

export interface ProfileElementOrder {
  id: 'avatar' | 'name' | 'bio';
  enabled: boolean;
  order: number;
}

export interface ProfileElements {
  avatar: AvatarStyle;
  name: TypographyStyle;
  bio: TypographyStyle;
}

export interface AvatarStyle {
  size: number; // en px
  borderRadius: number; // en px
  border: BorderStyle;
  shadow: ShadowStyle;
  position: {
    x: number; // offset horizontal
    y: number; // offset vertical
  };
}

 export interface ProfileContainerStyle {
   backgroundColor: string;
   border: BorderStyle;
   borderRadius: number; // px
   variant?: 'default' | 'poster' | 'ticket' | 'wallet';
 }

export interface ProfilePresetContent {
  poster?: PosterContent;
  ticket?: TicketContent;
  // wallet?: WalletContent; // TODO: Definir WalletContent cuando se implemente
}

export interface PosterContent {
  titleTop: string; // STILL WASTING TIME
  titleBottom: string; // LOOKING FOR TICKETS?
  subtitle: string; // Simply relax...
  ctaText: string; // GET THE APP FOR FREE
  bgColor?: string; // frame background color
  frameBorderColor?: string;
  ctaBgColor?: string;
  ctaTextColor?: string;
}

export interface TicketContent {
  eventTitle: string; // ART OF VICTORY
  dateText: string; // MONDAY, JULY 23
  timeText: string; // 9:00 - 10:00
  attendeeName: string; // Anna Jordan
  attendeeEmail: string; // email
  ctaPrimary: string; // Your Tickets
  ctaSecondary: string; // Get Directions
  primaryColor?: string; // main ticket color (orange)
  frameBgColor?: string; // outer container bg
  textColor?: string; // black text color
  dockBgColor?: string; // buttons dock bg
}

export interface TypographyStyle {
  fontFamily: FontFamily;
  fontSize: number; // en px
  fontWeight: FontWeight;
  lineHeight: number; // ratio
  letterSpacing: number; // en px
  textAlign: 'left' | 'center' | 'right';
  color: string;
  textShadow?: ShadowStyle;
  padding: PaddingConfig;
  margin: MarginConfig;
}

export interface BorderStyle {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'none';
  color: string;
}

export interface ShadowStyle {
  enabled: boolean;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
}

export interface SpacingConfig {
  containerPadding: PaddingConfig;
  elementSpacing: number; // spacing entre elementos
}

export interface PaddingConfig {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface MarginConfig {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type FontFamily = 
  | 'Inter'
  | 'Montserrat'
  | 'Poppins'
  | 'Roboto'
  | 'SF Pro Display' // Apple Font
  | 'Helvetica Neue'
  | 'Arial'
  | 'Georgia'
  | 'Times New Roman'
  | 'Playfair Display'
  | 'Merriweather'
  | 'Lato'
  | 'Open Sans'
  | 'Source Sans Pro';

export type FontWeight = 
  | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  | 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';

// Presets de diseño predefinidos
export interface ProfileDesignPreset {
  id: string;
  name: string;
  description: string;
  category: 'minimal' | 'modern' | 'classic' | 'creative' | 'professional';
  preview: string; // URL de preview
  design: ProfileDesign;
}

