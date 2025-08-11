import { auth } from '@/lib/firebase';
import { autoFixAdminPermissions } from './adminSetup';
import { updateFirestoreRules, FIRESTORE_RULES } from './updateFirestoreRules';

/**
 * Función de emergencia para arreglar todos los permisos de Firebase
 */
export const fixAllFirebasePermissions = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🔧 Iniciando corrección completa de permisos Firebase...');
    
    // Verificar autenticación
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        message: 'No hay usuario autenticado. Inicia sesión primero.'
      };
    }

    console.log('👤 Usuario actual:', currentUser.uid);

    // 1. Limpiar caché de Firebase/Firestore
    console.log('🧹 Limpiando caché...');
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
    console.log('🔄 Refrescando token de autenticación...');
    await currentUser.getIdToken(true);
    
    // 3. Corregir permisos de admin
    console.log('⚙️ Corrigiendo permisos de administrador...');
    const adminResult = await autoFixAdminPermissions();
    
    if (!adminResult.success) {
      return {
        success: false,
        message: `Error corrigiendo permisos de admin: ${adminResult.message}`
      };
    }

    // 4. Mostrar las reglas de Firestore que necesitan aplicarse
    console.log('📋 Mostrando reglas de Firestore...');
    const rulesResult = await updateFirestoreRules();
    
    // 5. Esperar un momento para que los cambios se propaguen
    console.log('⏳ Esperando propagación de cambios...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      message: `Permisos corregidos. ${rulesResult.success ? rulesResult.message : 'Revisa las reglas de Firestore manualmente.'}`
    };

  } catch (error: any) {
    console.error('❌ Error en corrección completa:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
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
    console.log('🚀 AUTO-FIX DE PERMISOS CARGADO');
    console.log('🎯 Ejecuta: fixAllFirebasePermissions()');
    console.log('📋 Para ver reglas: showFirestoreRules()');
    console.log('🔧 O espera 3 segundos para auto-ejecución...');
    
    // Auto-ejecutar después de 3 segundos
    setTimeout(async () => {
      try {
        const result = await fixAllFirebasePermissions();
        console.log('✅ Auto-fix completado:', result.message);
      } catch (error) {
        console.log('⚠️ Auto-fix falló:', error);
      }
    }, 3000);
  }
};

// Hacer la función disponible globalmente para debug
(window as any).fixAllFirebasePermissions = fixAllFirebasePermissions;