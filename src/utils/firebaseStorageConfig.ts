/**
 * Configuración específica para Firebase Storage que evita problemas de COEP
 */
import { info, warn } from './logger';

export const configureFirebaseStorageHeaders = () => {
  // REMOVER TODOS los meta tags restrictivos que puedan bloquear Firebase Storage
  const removeRestrictiveHeaders = () => {
    const metaElements = document.querySelectorAll('meta[http-equiv]');
    
    metaElements.forEach(meta => {
      const httpEquiv = meta.getAttribute('http-equiv');
      
      // Remover CUALQUIER Cross-Origin policy restrictiva
      if (httpEquiv?.includes('Cross-Origin')) {
        meta.remove();
      }
    });
  };
  
  // Remover headers restrictivos
  removeRestrictiveHeaders();
  
  // Forzar configuración permisiva para Firebase Storage
  const addPermissiveHeaders = () => {
    // CORP permisivo
    const corpMeta = document.createElement('meta');
    corpMeta.setAttribute('http-equiv', 'Cross-Origin-Resource-Policy');
    corpMeta.setAttribute('content', 'cross-origin');
    corpMeta.setAttribute('id', 'firebase-corp');
    document.head.appendChild(corpMeta);
    
    // COEP unsafe-none
    const coepMeta = document.createElement('meta');
    coepMeta.setAttribute('http-equiv', 'Cross-Origin-Embedder-Policy');
    coepMeta.setAttribute('content', 'unsafe-none');
    coepMeta.setAttribute('id', 'firebase-coep');
    document.head.appendChild(coepMeta);
    
    // COOP unsafe-none
    const coopMeta = document.createElement('meta');
    coopMeta.setAttribute('http-equiv', 'Cross-Origin-Opener-Policy');
    coopMeta.setAttribute('content', 'unsafe-none');
    coopMeta.setAttribute('id', 'firebase-coop');
    document.head.appendChild(coopMeta);
  };
  
  addPermissiveHeaders();
  
  // Observar cambios en el DOM y reapllicar si es necesario
  const observer = new MutationObserver(() => {
    if (!document.getElementById('firebase-corp') || 
        !document.getElementById('firebase-coep') || 
        !document.getElementById('firebase-coop')) {
      removeRestrictiveHeaders();
      addPermissiveHeaders();
    }
  });
  
  observer.observe(document.head, { childList: true, subtree: true });
};

/**
 * Configurar fetch para Firebase Storage con headers apropiados
 */
export const createFirebaseStorageFetch = () => {
  // Solo aplicar si no se ha aplicado ya
  if ((window as any).firebaseFetchPatched) return;
  
  const originalFetch = window.fetch;
  
  window.fetch = async function(url: RequestInfo | URL, init?: RequestInit) {
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // En desarrollo, silenciar errores de Firebase Analytics config fetch
    if (import.meta.env.NODE_ENV === 'development' && 
        (urlString.includes('firebase.googleapis.com/v1alpha/projects') ||
         urlString.includes('/webConfig'))) {
      
      // Silenciar esta request que siempre falla en desarrollo
      try {
        return await originalFetch(url, init);
      } catch (error) {
        // Silent fail para config fetch en desarrollo
        return new Response('{}', { status: 200, statusText: 'OK' });
      }
    }
    
    // Si es una request a Firebase Storage, usar configuración permisiva
    if (urlString.includes('firebasestorage.googleapis.com')) {
      
      const newInit = {
        ...init,
        headers: {
          ...init?.headers,
        },
        // Usar mode 'cors' para Firebase Storage
        mode: 'cors' as RequestMode,
        // Configurar credentials apropiadamente
        credentials: 'omit' as RequestCredentials
      };
      
      try {
        return await originalFetch(url, newInit);
      } catch (error) {
        warn('Firebase Storage fetch failed', { error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    }
    
    return originalFetch(url, init);
  };
  
  // Marcar como aplicado
  (window as any).firebaseFetchPatched = true;
};

/**
 * Configurar CSP específicamente para Firebase
 */
export const updateCSPForFirebase = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // Buscar el meta tag de CSP actual
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]') as HTMLMetaElement;
    
    if (cspMeta) {
      let cspContent = cspMeta.content;
      
      // Agregar dominios faltantes de Firebase si no están presentes
      const firebaseDomains = [
        'https://firebase.googleapis.com',
        'https://firebasestorage.googleapis.com', 
        'https://region1.google-analytics.com',
        'https://www.google-analytics.com',
        'https://analytics.google.com'
      ];
      
      firebaseDomains.forEach(domain => {
        if (!cspContent.includes(domain)) {
          // Agregar a connect-src
          cspContent = cspContent.replace(
            /connect-src ([^;]+)/,
            `connect-src $1 ${domain}`
          );
        }
      });
      
      // Actualizar el contenido del CSP
      cspMeta.content = cspContent;
    }
  }
};

/**
 * Función principal para inicializar todas las configuraciones de Firebase
 */
export const initializeFirebaseCompatibility = () => {
  // Solo ejecutar en el cliente
  if (typeof window !== 'undefined') {
    // Solo aplicar configuraciones si no estamos en desarrollo
    // En desarrollo, Firebase puede funcionar sin estas optimizaciones
    if (import.meta.env.NODE_ENV !== 'development') {
      configureFirebaseStorageHeaders();
      updateCSPForFirebase();
    }
    
    // Siempre aplicar el fetch patch (incluye silenciamiento en desarrollo)
    createFirebaseStorageFetch();
    
    info('Firebase compatibility configuration applied', { component: 'firebaseStorageConfig' });
  }
};

/**
 * Hook para usar en React
 */
export const useFirebaseCompatibility = () => {
  if (typeof window !== 'undefined') {
    // Solo importar React en el cliente
    const { useEffect } = require('react');
    
    useEffect(() => {
      initializeFirebaseCompatibility();
    }, []);
  }
};
