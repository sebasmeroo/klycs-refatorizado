// Helper para encontrar cardId en cualquier contexto
declare global {
  interface Window {
    findCardId: () => string | null;
    showAllCardIds: () => void;
    debugAnyCard: () => Promise<void>;
  }
}

window.findCardId = () => {
  console.log('🔍 Buscando cardId en todos lados...');
  
  // 1. URL actual completa
  console.log('📍 URL actual:', window.location.href);
  
  // 2. Todos los parámetros de URL
  const urlParams = new URLSearchParams(window.location.search);
  console.log('🔗 Parámetros URL:', Object.fromEntries(urlParams.entries()));
  
  // 3. Path completo
  console.log('🛤️ Path:', window.location.pathname);
  
  // 4. LocalStorage completo
  console.log('💾 LocalStorage relevante:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('card') || key.includes('Card'))) {
      console.log(`  ${key}: ${localStorage.getItem(key)}`);
    }
  }
  
  // 5. SessionStorage
  console.log('🎯 SessionStorage relevante:');
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('card') || key.includes('Card'))) {
      console.log(`  ${key}: ${sessionStorage.getItem(key)}`);
    }
  }
  
  // 6. Intentar encontrar en React DevTools context
  try {
    const reactRoot = document.querySelector('[data-reactroot]') || document.querySelector('#root');
    if (reactRoot) {
      const reactKey = Object.keys(reactRoot).find(key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance'));
      if (reactKey) {
        console.log('⚛️ React root encontrado, intentando extraer datos...');
      }
    }
  } catch (e) {
    // ignore
  }
  
  // 7. Buscar en elementos DOM que puedan tener el cardId
  const possibleElements = document.querySelectorAll('[data-card-id], [id*="card"], [class*="card"]');
  if (possibleElements.length > 0) {
    console.log('🎯 Elementos DOM con posible cardId:');
    possibleElements.forEach((el, index) => {
      const element = el as HTMLElement;
      console.log(`  Elemento ${index}:`, {
        tag: element.tagName,
        id: element.id,
        className: element.className,
        dataset: element.dataset
      });
    });
  }
  
  // 8. Buscar patrones en la URL
  const pathMatches = [
    window.location.pathname.match(/\/cards\/([^\/]+)/),
    window.location.pathname.match(/\/edit\/([^\/]+)/),
    window.location.pathname.match(/\/card\/([^\/]+)/),
    window.location.pathname.match(/cardId=([^&]+)/),
    window.location.hash.match(/#\/card\/([^\/]+)/),
  ];
  
  console.log('🔍 Patrones encontrados en URL:');
  pathMatches.forEach((match, index) => {
    if (match) {
      console.log(`  Patrón ${index}: ${match[1]}`);
    }
  });
  
  // 9. Intentar extraer de cualquier lugar
  const allText = document.body.innerText;
  const cardIdMatches = allText.match(/[a-zA-Z0-9]{20,}/g); // IDs típicos de Firebase
  if (cardIdMatches) {
    console.log('🎲 Posibles IDs encontrados en el contenido:');
    console.log(cardIdMatches.slice(0, 10)); // Solo los primeros 10
  }
  
  console.log('');
  console.log('💡 Usa cualquiera de estos valores con:');
  console.log('   debugTemplate("EL-ID-QUE-ENCONTRASTE")');
  
  return null;
};

window.showAllCardIds = () => {
  console.log('📋 Mostrando todos los datos de tarjetas en localStorage...');
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(value || '{}');
        if (parsed && typeof parsed === 'object') {
          if (parsed.id || parsed.cardId || key.includes('card')) {
            console.log(`🎯 ${key}:`, parsed);
          }
        }
      } catch (e) {
        // no es JSON, revisar si contiene "card"
        if (key.includes('card') || (value && value.includes('card'))) {
          console.log(`📝 ${key}: ${value}`);
        }
      }
    }
  }
};

window.debugAnyCard = async () => {
  console.log('🚀 Intentando encontrar y debuggear cualquier tarjeta...');
  
  // Buscar en localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(value || '{}');
        if (parsed && parsed.id && typeof parsed.id === 'string') {
          console.log(`🎯 Encontrada tarjeta en ${key}:`, parsed.id);
          await window.debugTemplate(parsed.id);
          return;
        }
      } catch (e) {
        // continue
      }
    }
  }
  
  console.log('❌ No se encontraron tarjetas en localStorage');
  console.log('💡 Ejecuta findCardId() para buscar manualmente');
};

console.log('🔍 Herramientas de búsqueda cargadas:');
console.log('  - findCardId() - Busca el cardId en todos lados');
console.log('  - showAllCardIds() - Muestra todas las tarjetas en localStorage');
console.log('  - debugAnyCard() - Intenta debuggear cualquier tarjeta encontrada');

export {};
