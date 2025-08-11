import { auth } from '@/lib/firebase';

declare global {
  interface Window {
    autoFixAdminNow: () => Promise<void>;
    clearAllFirebaseCache: () => void;
  }
}

window.autoFixAdminNow = async () => {
  console.log('🔧 AUTO-ARREGLANDO PERMISOS DE ADMIN...');
  console.log('=====================================');
  
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('❌ No hay usuario autenticado');
      console.log('🔄 Recargando página para forzar login...');
      window.location.reload();
      return;
    }
    
    console.log('👤 Usuario detectado:', currentUser.email);
    console.log('🎯 UID:', currentUser.uid);
    
    // 1. Limpiar toda la caché
    console.log('🗑️ Limpiando caché completa...');
    window.clearAllFirebaseCache();
    
    // 2. Forzar refresh del token
    console.log('🎫 Refrescando token de autenticación...');
    await currentUser.getIdToken(true);
    console.log('✅ Token refrescado');
    
    // 3. Recargar usuario
    console.log('👤 Recargando datos del usuario...');
    await currentUser.reload();
    console.log('✅ Usuario recargado');
    
    // 4. Verificar token actualizado
    console.log('🔍 Verificando nuevo token...');
    const newToken = await currentUser.getIdToken();
    console.log('✅ Nuevo token obtenido (longitud):', newToken.length);
    
    console.log('');
    console.log('🎉 ¡ARREGLO AUTOMÁTICO COMPLETADO!');
    console.log('📝 Las reglas de Firestore ya fueron actualizadas');
    console.log('🔐 Tu autenticación ya fue refrescada');
    console.log('');
    console.log('🧪 AHORA INTENTA GUARDAR LA PLANTILLA OTRA VEZ');
    console.log('   - Ve al editor de admin');
    console.log('   - Haz clic en "Guardar Plantilla"');
    console.log('   - ¡Debería funcionar!');
    
  } catch (error) {
    console.error('❌ Error durante auto-arreglo:', error);
    console.log('');
    console.log('🔄 FALLBACK: Recargando página completa...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
};

window.clearAllFirebaseCache = () => {
  console.log('🗑️ Limpiando caché...');
  
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
    console.log('🗑️ Removed:', key);
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
    console.log('🗑️ Session removed:', key);
  });
  
  console.log('✅ Caché limpiada');
};

// Auto-ejecutar el arreglo al cargar
setTimeout(() => {
  console.log('🚀 AUTO-FIX CARGADO');
  console.log('🎯 Ejecuta: autoFixAdminNow()');
  console.log('🔧 O simplemente espera 3 segundos para auto-ejecución...');
  
  // Auto-ejecutar en 3 segundos
  setTimeout(() => {
    console.log('⚡ EJECUTANDO AUTO-FIX AUTOMÁTICAMENTE...');
    window.autoFixAdminNow();
  }, 3000);
}, 1000);

export {};
