declare global {
  interface Window {
    checkAdminPermissions: () => Promise<void>;
    showCurrentUser: () => Promise<void>;
    testFirebaseConnection: () => Promise<void>;
    fixAdminPermissions: () => Promise<void>;
  }
}

window.checkAdminPermissions = async () => {
  console.log('🔍 Verificando permisos de administrador...');
  
  try {
    const { auth } = await import('@/lib/firebase');
    // 1. Verificar usuario actual
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ No hay usuario autenticado');
      console.log('💡 Debes estar logueado para usar el admin');
      return;
    }
    
    console.log('👤 Usuario actual:');
    console.log('  UID:', currentUser.uid);
    console.log('  Email:', currentUser.email);
    console.log('  Verificado:', currentUser.emailVerified);
    
    // 2. Verificar token de autenticación
    const token = await currentUser.getIdToken(true); // Force refresh
    console.log('🎫 Token obtenido exitosamente (longitud):', token.length);
    
    // 3. Verificar claims del token
    const tokenResult = await currentUser.getIdTokenResult();
    console.log('🔐 Claims del token:', tokenResult.claims);
    
    // 4. Verificar si el UID está en la lista de admins conocida
    const knownAdmins = [
      '6n69apb5GMb7NxReTd1LTZZzTpg2', // Admin original
      'GJTpethV5XeF7SM0imVjNzofcg1'  // UID del usuario
    ];
    
    const isKnownAdmin = knownAdmins.includes(currentUser.uid);
    console.log('👑 ¿Es admin conocido?', isKnownAdmin);
    
    if (!isKnownAdmin) {
      console.warn('⚠️ Tu UID no está en la lista de admins');
      console.log('📝 UID actual:', currentUser.uid);
      console.log('📋 UIDs de admins en reglas:', knownAdmins);
      console.log('');
      console.log('🔧 Para solucionarlo:');
      console.log('   1. Copia tu UID:', currentUser.uid);
      console.log('   2. Ejecuta: fixAdminPermissions()');
    } else {
      console.log('✅ Tu UID está en la lista de admins');
    }
    
  } catch (error) {
    console.error('❌ Error verificando permisos:', error);
  }
};

window.showCurrentUser = async () => {
  try {
    const { auth } = await import('@/lib/firebase');
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('👤 Usuario actual:', {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        emailVerified: currentUser.emailVerified,
        creationTime: currentUser.metadata.creationTime,
        lastSignInTime: currentUser.metadata.lastSignInTime
      });
    } else {
      console.log('❌ No hay usuario autenticado');
    }
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
  }
};

window.testFirebaseConnection = async () => {
  console.log('🔗 Probando conexión con Firebase...');
  
  try {
    const { auth } = await import('@/lib/firebase');
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ No hay usuario para probar');
      return;
    }
    
    // Forzar refresh del token
    console.log('🔄 Refrescando token...');
    const token = await currentUser.getIdToken(true);
    console.log('✅ Token refrescado');
    
    // Probar acceso básico
    console.log('🧪 Probando acceso a Firestore...');
    
    // Simular una operación de lectura simple
    const { templateDistributionService } = await import('@/services/templateDistribution');
    const templates = await templateDistributionService.getTemplates();
    console.log('✅ Lectura exitosa. Plantillas encontradas:', templates.length);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    console.log('💡 Puede ser un problema de autenticación o reglas');
  }
};

window.fixAdminPermissions = async () => {
  console.log('🔧 Intentando arreglar permisos de admin...');
  
  try {
    const { auth } = await import('@/lib/firebase');
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ Debes estar logueado');
      return;
    }
    
    console.log('👤 UID del usuario:', currentUser.uid);
    
    // Forzar refresh completo de autenticación
    console.log('🔄 Refrescando autenticación...');
    await currentUser.getIdToken(true);
    
    // Intentar re-autenticar si es necesario
    console.log('🔐 Re-validando sesión...');
    await currentUser?.reload();
    
    console.log('✅ Autenticación refrescada');
    console.log('');
    console.log('🎯 SIGUIENTE PASO:');
    console.log('   1. Tu UID es:', currentUser.uid);
    console.log('   2. Verifica que esté en firestore.rules');
    console.log('   3. Si no está, agrégalo y redeploya las reglas');
    console.log('');
    console.log('📝 Comando para firestore.rules:');
    console.log(`return userId in [
  '6n69apb5GMb7NxReTd1LTZZzTpg2', // Admin original
  'GJTpethV5XeF7SM0imVjNzofcg1', // UID anterior
  '${currentUser.uid}' // Tu UID actual
];`);
    
  } catch (error) {
    console.error('❌ Error arreglando permisos:', error);
  }
};

console.log('🔐 Admin Debug Tools cargadas:');
console.log('  - checkAdminPermissions() - Verifica permisos de admin');
console.log('  - showCurrentUser() - Muestra info del usuario actual');
console.log('  - testFirebaseConnection() - Prueba conexión Firebase');
console.log('  - fixAdminPermissions() - Intenta arreglar permisos');
console.log('');
console.log('🎯 EJECUTA: checkAdminPermissions()');

export {};
