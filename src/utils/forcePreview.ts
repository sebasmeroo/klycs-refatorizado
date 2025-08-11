declare global {
  interface Window {
    forcePreviewRefresh: () => void;
    verifyTemplateContent: () => Promise<void>;
    debugActiveTemplate: () => Promise<void>;
    forceReloadPreview: () => void;
  }
}

window.forcePreviewRefresh = () => {
  console.log('🔄 Forzando refresh del preview...');
  
  // 1. Limpiar caché de React
  const reactKeys = Object.keys(window).filter(key => 
    key.includes('__REACT') || key.includes('React')
  );
  reactKeys.forEach(key => {
    delete (window as any)[key];
  });
  
  // 2. Forzar re-render de todos los componentes de plantilla
  const templateElements = document.querySelectorAll('[class*="template"], [class*="Template"]');
  templateElements.forEach(el => {
    if (el.parentNode) {
      const parent = el.parentNode;
      const next = el.nextSibling;
      parent.removeChild(el);
      parent.insertBefore(el, next);
    }
  });
  
  // 3. Disparar eventos de resize para forzar re-render
  window.dispatchEvent(new Event('resize'));
  
  // 4. Forzar re-render del preview específico
  const previewElements = document.querySelectorAll('[class*="preview"], [class*="Preview"]');
  previewElements.forEach(el => {
    (el as HTMLElement).style.display = 'none';
    setTimeout(() => {
      (el as HTMLElement).style.display = '';
    }, 100);
  });
  
  console.log('✅ Preview refresh ejecutado');
  console.log('🔄 Si no funciona, ejecuta: forceReloadPreview()');
};

window.verifyTemplateContent = async () => {
  console.log('🔍 Verificando contenido de la plantilla aplicada...');
  
  try {
    await window.checkTemplateContent('dnsqZpuGV4Whwg7wscin');
    
    console.log('💡 La plantilla tiene contenido. Si no se ve:');
    console.log('   1. Ejecuta: forcePreviewRefresh()');
    console.log('   2. O ejecuta: forceReloadPreview()');
    
  } catch (error) {
    console.error('❌ Error verificando contenido:', error);
  }
};

window.debugActiveTemplate = async () => {
  console.log('🔍 Diagnosticando plantilla activa...');
  
  // Buscar elementos de plantilla en el DOM
  const templateIndicators = document.querySelectorAll('[class*="template"], [data-template]');
  console.log('🎯 Elementos de plantilla encontrados:', templateIndicators.length);
  
  templateIndicators.forEach((el, index) => {
    console.log(`  ${index + 1}:`, {
      className: el.className,
      dataset: (el as HTMLElement).dataset,
      content: el.textContent?.substring(0, 100)
    });
  });
  
  // Buscar sandbox de plantillas
  const sandboxes = document.querySelectorAll('[class*="sandbox"], [class*="Sandbox"]');
  console.log('📦 Sandboxes encontrados:', sandboxes.length);
  
  sandboxes.forEach((el, index) => {
    console.log(`  Sandbox ${index + 1}:`, {
      className: el.className,
      hasContent: el.innerHTML.length > 0,
      contentPreview: el.innerHTML.substring(0, 200)
    });
  });
  
  // Verificar estado de la plantilla específica
  await window.verifyTemplateContent();
};

window.forceReloadPreview = () => {
  console.log('🚀 FORZANDO RECARGA COMPLETA DEL PREVIEW...');
  
  // 1. Limpiar TODO el caché relacionado con plantillas
  ['template', 'Template', 'sandbox', 'Sandbox', 'preview', 'Preview'].forEach(keyword => {
    Object.keys(localStorage).forEach(key => {
      if (key.includes(keyword)) {
        localStorage.removeItem(key);
        console.log('🗑️ Removed from localStorage:', key);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes(keyword)) {
        sessionStorage.removeItem(key);
        console.log('🗑️ Removed from sessionStorage:', key);
      }
    });
  });
  
  // 2. Forzar refresh de todos los componentes
  window.forcePreviewRefresh();
  
  // 3. Recargar página después de un momento
  console.log('🔄 Recargando página en 2 segundos...');
  setTimeout(() => {
    location.reload();
  }, 2000);
};

console.log('🔄 Preview Force Tools cargadas:');
console.log('  - forcePreviewRefresh() - Refresca componentes sin recargar');
console.log('  - verifyTemplateContent() - Verifica que la plantilla tenga contenido');
console.log('  - debugActiveTemplate() - Diagnostica elementos de plantilla en DOM');
console.log('  - forceReloadPreview() - Limpia todo y recarga');
console.log('');
console.log('🎯 EJECUTA EN ORDEN:');
console.log('   1. verifyTemplateContent()');
console.log('   2. forcePreviewRefresh()');
console.log('   3. Si no funciona: forceReloadPreview()');

export {};
