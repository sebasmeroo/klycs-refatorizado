import { templateDebuggerService } from '@/services/templateDebugger';

// Quick fix para la plantilla específica que vimos en la imagen
declare global {
  interface Window {
    quickFixTemplate: () => Promise<void>;
    fixTemplateById: (templateId: string) => Promise<void>;
    forceTemplateRefresh: () => void;
  }
}

window.quickFixTemplate = async () => {
  console.log('🚀 QUICK FIX: Intentando arreglar la plantilla visible...');
  
  // ID de la plantilla que vimos en la imagen
  const knownTemplateId = '2025-08-11-90585';
  
  console.log('🎯 Intentando arreglar plantilla:', knownTemplateId);
  
  try {
    const result = await templateDebuggerService.fixEmptyTemplate(knownTemplateId);
    
    if (result.success) {
      console.log('✅', result.message);
      console.log('🔄 RECARGA LA PÁGINA AHORA para ver los cambios');
      console.log('   Ejecuta: location.reload()');
    } else {
      console.error('❌', result.message);
      console.log('🔍 Intentando buscar otras plantillas...');
      await window.debugAnyCard();
    }
  } catch (error) {
    console.error('❌ Error en quick fix:', error);
  }
};

window.fixTemplateById = async (templateId: string) => {
  console.log('🔧 Arreglando plantilla:', templateId);
  
  try {
    const result = await templateDebuggerService.fixEmptyTemplate(templateId);
    
    if (result.success) {
      console.log('✅', result.message);
      if (result.debugInfo) {
        console.table({
          'Tiene React Code': result.debugInfo.hasReactCode,
          'Tiene CSS': result.debugInfo.hasCSS,
          'Tamaño React Code': result.debugInfo.reactCodeLength + ' chars',
          'Tamaño CSS': result.debugInfo.cssCodeLength + ' chars'
        });
      }
      console.log('🔄 RECARGA LA PÁGINA para ver los cambios: location.reload()');
    } else {
      console.error('❌', result.message);
    }
  } catch (error) {
    console.error('❌ Error arreglando plantilla:', error);
  }
};

window.forceTemplateRefresh = () => {
  console.log('🔄 Forzando recarga completa...');
  
  // Limpiar caché de plantillas
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('template') || key.includes('Template')) {
      localStorage.removeItem(key);
      console.log('🗑️ Removido del cache:', key);
    }
  });
  
  // Limpiar sessionStorage también
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach(key => {
    if (key.includes('template') || key.includes('Template')) {
      sessionStorage.removeItem(key);
      console.log('🗑️ Removido de sesión:', key);
    }
  });
  
  console.log('✅ Caché limpiado');
  console.log('🔄 Recargando página...');
  
  setTimeout(() => {
    location.reload();
  }, 1000);
};

console.log('⚡ Quick Fix tools cargadas:');
console.log('  - quickFixTemplate() - Arregla la plantilla de la imagen');
console.log('  - fixTemplateById("id") - Arregla plantilla específica');
console.log('  - forceTemplateRefresh() - Limpia caché y recarga');
console.log('');
console.log('🎯 EJECUTA ESTO AHORA: quickFixTemplate()');

export {};
