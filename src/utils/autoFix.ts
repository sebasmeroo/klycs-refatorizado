import { auth } from '@/lib/firebase';
import { secureLogger } from './secureLogger';

declare global {
  interface Window {
    autoFixAdminNow: () => Promise<void>;
    clearAllFirebaseCache: () => void;
  }
}

window.autoFixAdminNow = async () => {
  secureLogger.devOnly('AUTO-ARREGLANDO PERMISOS DE ADMIN...');
  
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      secureLogger.warn('No hay usuario autenticado');
      window.location.reload();
      return;
    }
    
    secureLogger.auth('Usuario detectado y autenticado');
    
    // 1. Limpiar toda la caché
    secureLogger.devOnly('Limpiando caché completa...');
    window.clearAllFirebaseCache();
    
    // 2. Forzar refresh del token
    secureLogger.devOnly('Refrescando token de autenticación...');
    await currentUser.getIdToken(true);
    secureLogger.devOnly('Token refrescado');
    
    // 3. Recargar usuario
    secureLogger.devOnly('Recargando datos del usuario...');
    await currentUser.reload();
    secureLogger.devOnly('Usuario recargado');
    
    // 4. Verificar token actualizado
    secureLogger.devOnly('Verificando nuevo token...');
    const newToken = await currentUser.getIdToken();
    secureLogger.devOnly('Nuevo token obtenido correctamente');
    
    // Auto-fix completado exitosamente - sin log
    
  } catch (error) {
    secureLogger.error('Error durante auto-arreglo', error);
    secureLogger.warn('FALLBACK: Recargando página completa...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
};

window.clearAllFirebaseCache = () => {
  secureLogger.devOnly('Limpiando caché de Firebase...');
  
  // Limpiar localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('firebase') ||
      key.includes('Firebase') ||
      key.includes('fbase') ||
      key.includes('auth') ||
      key.includes('token')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    secureLogger.devOnly(`Cache key removed: ${key.substring(0, 20)}...`);
  });
  
  // Limpiar sessionStorage
  const sessionKeysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.includes('firebase') ||
      key.includes('Firebase') ||
      key.includes('fbase') ||
      key.includes('auth') ||
      key.includes('token')
    )) {
      sessionKeysToRemove.push(key);
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
    secureLogger.devOnly(`Session key removed: ${key.substring(0, 20)}...`);
  });
  
  secureLogger.devOnly('Caché limpiada correctamente');
};

// Auto-fix deshabilitado para reducir ruido en consola

export {};
