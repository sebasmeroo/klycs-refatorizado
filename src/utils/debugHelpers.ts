import { templateDebuggerService } from '@/services/templateDebugger';

// Helper global para debug - se puede usar en la consola del navegador
declare global {
  interface Window {
    debugTemplate: (cardId?: string) => Promise<void>;
    fixTemplate: (cardId?: string) => Promise<void>;
    checkTemplateContent: (templateId: string) => Promise<void>;
    getCurrentCardId: () => string | null;
    debugCurrentCard: () => Promise<void>;
    fixCurrentCard: () => Promise<void>;
  }
}

// Función para debuggear plantilla activa de una tarjeta
window.debugTemplate = async (cardId?: string) => {
  console.log('🔍 Iniciando debug de plantilla...');
  
  if (!cardId) {
    // Intentar obtener cardId desde la URL o localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlCardId = urlParams.get('cardId');
    const storedCardId = localStorage.getItem('currentCardId');
    cardId = urlCardId ?? storedCardId ?? undefined;
  }
  
  if (!cardId) {
    console.error('❌ No se encontró cardId. Uso: debugTemplate("tu-card-id")');
    return;
  }
  
  console.log('🎯 Diagnosticando tarjeta:', cardId);
  
  try {
    const debugInfo = await templateDebuggerService.diagnoseActiveTemplateForCard(cardId);
    
    if (!debugInfo) {
      console.log('ℹ️ No hay plantilla activa para esta tarjeta');
      return;
    }
    
    console.log('📊 Información de la plantilla:');
    console.table({
      'ID': debugInfo.templateId,
      'Nombre': debugInfo.templateName,
      'Sección': debugInfo.targetSection,
      'Es Pública': debugInfo.isPublic,
      'Tiene React Code': debugInfo.hasReactCode,
      'Tiene CSS': debugInfo.hasCSS,
      'Tamaño React Code': debugInfo.reactCodeLength + ' chars',
      'Tamaño CSS': debugInfo.cssCodeLength + ' chars'
    });
    
    if (!debugInfo.hasReactCode || !debugInfo.hasCSS) {
      console.warn('⚠️ La plantilla está incompleta:');
      if (!debugInfo.hasReactCode) console.warn('  - Falta React Code');
      if (!debugInfo.hasCSS) console.warn('  - Falta CSS');
      console.log('💡 Ejecuta fixTemplate() para arreglarla automáticamente');
    } else {
      console.log('✅ La plantilla tiene contenido válido');
      console.log('📄 Vista previa del React Code:');
      console.log(debugInfo.reactCodePreview + (debugInfo.reactCodeLength > 200 ? '...' : ''));
      console.log('🎨 Vista previa del CSS:');
      console.log(debugInfo.cssCodePreview + (debugInfo.cssCodeLength > 200 ? '...' : ''));
    }
    
  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  }
};

// Función para arreglar plantilla vacía
window.fixTemplate = async (cardId?: string) => {
  console.log('🔧 Iniciando reparación de plantilla...');
  
  if (!cardId) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCardId = urlParams.get('cardId');
    const storedCardId = localStorage.getItem('currentCardId');
    cardId = urlCardId ?? storedCardId ?? undefined;
  }
  
  if (!cardId) {
    console.error('❌ No se encontró cardId. Uso: fixTemplate("tu-card-id")');
    return;
  }
  
  try {
    // Primero diagnosticar para obtener el templateId
    const debugInfo = await templateDebuggerService.diagnoseActiveTemplateForCard(cardId);
    
    if (!debugInfo) {
      console.log('ℹ️ No hay plantilla activa para reparar');
      return;
    }
    
    console.log('🔧 Reparando plantilla:', debugInfo.templateName);
    
    const result = await templateDebuggerService.fixEmptyTemplate(debugInfo.templateId);
    
    if (result.success) {
      console.log('✅', result.message);
      if (result.debugInfo) {
        console.log('📊 Estado después de la reparación:');
        console.table({
          'Tiene React Code': result.debugInfo.hasReactCode,
          'Tiene CSS': result.debugInfo.hasCSS,
          'Tamaño React Code': result.debugInfo.reactCodeLength + ' chars',
          'Tamaño CSS': result.debugInfo.cssCodeLength + ' chars'
        });
      }
      console.log('🔄 Recarga la página para ver los cambios');
    } else {
      console.error('❌', result.message);
    }
    
  } catch (error) {
    console.error('❌ Error durante la reparación:', error);
  }
};

// Función para verificar contenido de cualquier plantilla por ID
window.checkTemplateContent = async (templateId: string) => {
  console.log('🔍 Verificando contenido de plantilla:', templateId);
  
  try {
    const debugInfo = await templateDebuggerService.diagnoseTemplate(templateId);
    
    if (!debugInfo) {
      console.error('❌ Plantilla no encontrada');
      return;
    }
    
    console.log('📊 Información de la plantilla:');
    console.table({
      'ID': debugInfo.templateId,
      'Nombre': debugInfo.templateName,
      'Sección': debugInfo.targetSection,
      'Es Pública': debugInfo.isPublic,
      'Tiene React Code': debugInfo.hasReactCode,
      'Tiene CSS': debugInfo.hasCSS,
      'Tamaño React Code': debugInfo.reactCodeLength + ' chars',
      'Tamaño CSS': debugInfo.cssCodeLength + ' chars'
    });
    
    console.log('📄 React Code Preview:');
    console.log(debugInfo.reactCodePreview + (debugInfo.reactCodeLength > 200 ? '...' : ''));
    
    console.log('🎨 CSS Preview:');
    console.log(debugInfo.cssCodePreview + (debugInfo.cssCodeLength > 200 ? '...' : ''));
    
  } catch (error) {
    console.error('❌ Error verificando plantilla:', error);
  }
};

// Función para obtener cardId actual desde URL o localStorage
window.getCurrentCardId = () => {
  // Intentar desde URL params
  const urlParams = new URLSearchParams(window.location.search);
  let cardId = urlParams.get('cardId');
  
  if (cardId) {
    console.log('🎯 CardId encontrado en URL:', cardId);
    return cardId;
  }
  
  // Intentar desde localStorage
  cardId = localStorage.getItem('currentCardId');
  if (cardId) {
    console.log('🎯 CardId encontrado en localStorage:', cardId);
    return cardId;
  }
  
  // Intentar extraer de la URL path (para rutas como /cards/edit/cardId)
  const pathMatch = window.location.pathname.match(/\/cards\/edit\/([^\/]+)/);
  if (pathMatch) {
    cardId = pathMatch[1];
    console.log('🎯 CardId encontrado en path:', cardId);
    return cardId;
  }
  
  console.warn('⚠️ No se pudo detectar cardId automáticamente');
  console.log('💡 Puedes proporcionar el cardId manualmente: debugTemplate("tu-card-id")');
  return null;
};

// Función simplificada para debug de tarjeta actual
window.debugCurrentCard = async () => {
  const cardId = window.getCurrentCardId();
  if (cardId) {
    await window.debugTemplate(cardId);
  }
};

// Función simplificada para reparar tarjeta actual
window.fixCurrentCard = async () => {
  const cardId = window.getCurrentCardId();
  if (cardId) {
    await window.fixTemplate(cardId);
  }
};

console.log('🔧 Debug helpers cargados:');
console.log('  - getCurrentCardId() - Obtiene el ID de la tarjeta actual');
console.log('  - debugCurrentCard() - Diagnostica plantilla de tarjeta actual');
console.log('  - fixCurrentCard() - Repara plantilla de tarjeta actual');
console.log('  - debugTemplate(cardId) - Diagnostica plantilla activa');
console.log('  - fixTemplate(cardId) - Repara plantilla vacía');
console.log('  - checkTemplateContent(templateId) - Verifica contenido de plantilla');
console.log('');
console.log('💡 Uso rápido: debugCurrentCard() y luego fixCurrentCard()');

export {};
