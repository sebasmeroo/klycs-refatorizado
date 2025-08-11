declare global {
  interface Window {
    getCurrentUID: () => Promise<string | null>;
    generateFirestoreRules: () => Promise<void>;
    checkUIDMatch: () => Promise<void>;
    forceAuthRefresh: () => Promise<void>;
    emergencyUIDCheck: () => Promise<void>;
  }
}

window.getCurrentUID = async () => {
  try {
    const { auth } = await import('@/lib/firebase');
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      console.log('🎯 UID actual:', currentUser.uid);
      console.log('📧 Email:', currentUser.email);
      return currentUser.uid;
    } else {
      console.log('❌ No hay usuario autenticado');
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo UID:', error);
    return null;
  }
};

window.checkUIDMatch = async () => {
  const currentUID = await window.getCurrentUID();
  if (!currentUID) return;
  
  // UIDs conocidos en las reglas actuales
  const knownUIDs = [
    '6n69apb5GMb7NxReTd1LTZZzTpg2', // Admin original
    'GJTpethV5XeF7SM0imVjNzofcg1'  // UID anterior
  ];
  
  console.log('🔍 Verificando coincidencia de UID...');
  console.log('🎯 UID actual:', currentUID);
  console.log('📋 UIDs en reglas:', knownUIDs);
  
  if (knownUIDs.includes(currentUID)) {
    console.log('✅ Tu UID está en las reglas de Firestore');
    console.log('💡 El problema puede ser de caché o autenticación');
    console.log('🔧 Ejecuta: forceAuthRefresh()');
  } else {
    console.log('❌ Tu UID NO está en las reglas de Firestore');
    console.log('🔧 Ejecuta: generateFirestoreRules()');
  }
};

window.generateFirestoreRules = async () => {
  const currentUID = await window.getCurrentUID();
  if (!currentUID) return;
  
  console.log('📝 REGLAS DE FIRESTORE ACTUALIZADAS:');
  console.log('====================================');
  console.log('');
  console.log('Reemplaza la función isAdmin en firestore.rules con:');
  console.log('');
  console.log('```firestore');
  console.log('function isAdmin(userId) {');
  console.log('  // Lista de UIDs de administradores - actualizar según sea necesario');
  console.log('  return userId in [');
  console.log('    \'6n69apb5GMb7NxReTd1LTZZzTpg2\', // Admin original');
  console.log('    \'GJTpethV5XeF7SM0imVjNzofcg1\', // UID anterior');
  console.log(`    '${currentUID}' // Tu UID actual`);
  console.log('  ];');
  console.log('}');
  console.log('```');
  console.log('');
  console.log('🚀 DESPUÉS DE ACTUALIZAR LAS REGLAS:');
  console.log('1. Guarda el archivo firestore.rules');
  console.log('2. Ejecuta: firebase deploy --only firestore:rules');
  console.log('3. Espera a que se despliegue');
  console.log('4. Ejecuta: forceAuthRefresh()');
};

window.forceAuthRefresh = async () => {
  console.log('🔄 Forzando refresh completo de autenticación...');
  
  try {
    const { auth } = await import('@/lib/firebase');
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('❌ No hay usuario autenticado');
      return;
    }
    
    // 1. Forzar refresh del token
    console.log('🎫 Refrescando token de autenticación...');
    await currentUser.getIdToken(true);
    console.log('✅ Token refrescado');
    
    // 2. Reload del usuario
    console.log('👤 Recargando datos del usuario...');
    await currentUser.reload();
    console.log('✅ Usuario recargado');
    
    // 3. Limpiar caché de Firebase
    console.log('🗑️ Limpiando caché...');
    
    // Limpiar localStorage relacionado con Firebase
    Object.keys(localStorage).forEach(key => {
      if (key.includes('firebase') || key.includes('Firebase')) {
        localStorage.removeItem(key);
        console.log('🗑️ Removed:', key);
      }
    });
    
    // 4. Verificar nuevo estado
    console.log('🔍 Verificando nuevo estado...');
    const newToken = await currentUser.getIdToken();
    console.log('✅ Nuevo token obtenido (longitud):', newToken.length);
    
    console.log('');
    console.log('✅ Refresh completo terminado');
    console.log('🧪 Ahora intenta guardar en el admin otra vez');
    
  } catch (error) {
    console.error('❌ Error durante refresh:', error);
  }
};

window.emergencyUIDCheck = async () => {
  console.log('🚨 VERIFICACIÓN DE EMERGENCIA DE UID');
  console.log('=====================================');
  
  try {
    const { auth } = await import('@/lib/firebase');
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('❌ NO HAY USUARIO AUTENTICADO');
      console.log('🔧 ACCIÓN: Hacer login nuevamente');
      return;
    }
    
    console.log('👤 USUARIO ACTUAL:');
    console.log('   UID:', currentUser.uid);
    console.log('   Email:', currentUser.email);
    console.log('   Verificado:', currentUser.emailVerified);
    
    // UIDs en las reglas
    const knownUIDs = [
      '6n69apb5GMb7NxReTd1LTZZzTpg2', 
      'GJTpethV5XeF7SM0imVjNzofcg1'
    ];
    
    console.log('');
    console.log('📋 UIDs EN LAS REGLAS:');
    knownUIDs.forEach((uid, index) => {
      console.log(`   ${index + 1}. ${uid}`);
    });
    
    console.log('');
    console.log('🎯 DIAGNÓSTICO:');
    
    if (knownUIDs.includes(currentUser.uid)) {
      console.log('✅ TU UID ESTÁ EN LAS REGLAS');
      console.log('💡 Problema: Caché o token expirado');
      console.log('🔧 SOLUCIÓN: forceAuthRefresh()');
    } else {
      console.log('❌ TU UID NO ESTÁ EN LAS REGLAS');
      console.log('💡 Problema: UID cambió o falta en firestore.rules');
      console.log('🔧 SOLUCIÓN: generateFirestoreRules()');
    }
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
};

console.log('🔧 Firestore Rules Debug Tools (VERSIÓN CORREGIDA):');
console.log('  - getCurrentUID() - Muestra tu UID actual');
console.log('  - checkUIDMatch() - Verifica si tu UID está en las reglas');
console.log('  - generateFirestoreRules() - Genera reglas actualizadas');
console.log('  - forceAuthRefresh() - Refresca autenticación completa');
console.log('  - emergencyUIDCheck() - Diagnóstico completo de emergencia');
console.log('');
console.log('🚨 PARA SOLUCIONAR EL PROBLEMA:');
console.log('   1. emergencyUIDCheck() // Diagnóstico completo');
console.log('   2. Si UID no coincide: generateFirestoreRules()');
console.log('   3. Si UID coincide: forceAuthRefresh()');

export {};