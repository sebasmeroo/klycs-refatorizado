import { auth } from '@/lib/firebase';
import { autoFixAdminPermissions } from './adminSetup';
import { updateFirestoreRules, FIRESTORE_RULES } from './updateFirestoreRules';
import { secureLogger } from './secureLogger';

/**
 * Función de emergencia para arreglar todos los permisos de Firebase
 */
export const fixAllFirebasePermissions = async (): Promise<{ success: boolean; message: string }> => {
  try {
    secureLogger.devOnly('Iniciando corrección completa de permisos Firebase...');
    
    // Verificar autenticación
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        message: 'No hay usuario autenticado. Inicia sesión primero.'
      };
    }

    secureLogger.auth(`Usuario actual autenticado correctamente`);

    // 1. Limpiar caché de Firebase/Firestore
    secureLogger.devOnly('Limpiando caché de autenticación...');
    Object.keys(localStorage).forEach(key => {
      if (key.includes('firebase') || key.includes('firestore')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('firebase') || key.includes('firestore')) {
        sessionStorage.removeItem(key);
      }
    });

    // 2. Refrescar token de autenticación
    secureLogger.devOnly('Refrescando token de autenticación...');
    await currentUser.getIdToken(true);
    
    // 3. Corregir permisos de admin
    secureLogger.devOnly('Corrigiendo permisos de administrador...');
    const adminResult = await autoFixAdminPermissions();
    
    if (!adminResult.success) {
      return {
        success: false,
        message: `Error corrigiendo permisos de admin: ${adminResult.message}`
      };
    }

    // 4. Aplicar reglas de Firestore
    secureLogger.devOnly('Aplicando reglas de Firestore...');
    const rulesResult = await updateFirestoreRules();
    
    // 5. Esperar un momento para que los cambios se propaguen
    secureLogger.devOnly('Esperando propagación de cambios...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      message: 'Permisos de Firebase actualizados correctamente'
    };

  } catch (error: any) {
    secureLogger.error('Error en corrección completa de permisos', error);
    return {
      success: false,
      message: 'Error al actualizar permisos de Firebase'
    };
  }
};

/**
 * Función que se ejecuta automáticamente al cargar la página
 */
export const autoFixOnLoad = () => {
  // Ejecutar en páginas admin y editor de tarjetas
  if (window.location.pathname.includes('/admin') || 
      window.location.pathname.includes('/tarjeta/edit')) {
    
    // Auto-ejecutar después de 2 segundos (silencioso)
    setTimeout(async () => {
      try {
        await fixAllFirebasePermissions();
        // Sin logs - funcionamiento silencioso
      } catch (error) {
        secureLogger.error('Error en auto-fix de permisos', error);
      }
    }, 2000);
  }
};

// Funciones globales deshabilitadas por seguridad