import { auth } from '@/lib/firebase';

/**
 * Reglas de Firestore actualizadas para permitir:
 * 1. Usuarios normales: Leer plantillas públicas y gestionar sus instancias
 * 2. Administradores: Crear y publicar plantillas
 */
const FIRESTORE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // === PLANTILLAS DE ADMINISTRADOR ===
    // Solo admins pueden crear/editar plantillas
    // Todos los usuarios autenticados pueden leer plantillas públicas
    match /adminTemplates/{templateId} {
      // Lectura: Usuarios autenticados pueden leer plantillas públicas
      allow read: if request.auth != null && resource.data.isPublic == true;
      
      // Escritura: Solo administradores
      allow create, update, delete: if request.auth != null && 
        (request.auth.uid in ['6n69apb5GMb7NxReTd1LTZZzTpg2', 'ADMIN_UID_2', 'ADMIN_UID_3'] ||
         exists(/databases/$(database)/documents/admins/$(request.auth.uid)));
    }
    
    // === INSTANCIAS DE PLANTILLAS DE USUARIOS ===
    // Los usuarios pueden crear y gestionar sus propias instancias de plantillas
    match /templateInstances/{instanceId} {
      // Lectura: El usuario puede leer sus propias instancias
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || request.auth.uid == resource.data.cardOwner);
      
      // Escritura: El usuario puede crear/editar sus propias instancias
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
        
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || request.auth.uid == resource.data.cardOwner);
        
      allow delete: if request.auth != null && 
        (request.auth.uid == resource.data.userId || request.auth.uid == resource.data.cardOwner);
    }
    
    // === PLANTILLAS PÚBLICAS ===
    // Plantillas que los usuarios pueden usar (copia de adminTemplates)
    match /userTemplates/{templateId} {
      // Lectura: Todos los usuarios autenticados
      allow read: if request.auth != null;
      
      // Escritura: Solo administradores (sincronizado desde adminTemplates)
      allow create, update, delete: if request.auth != null && 
        (request.auth.uid in ['6n69apb5GMb7NxReTd1LTZZzTpg2', 'ADMIN_UID_2', 'ADMIN_UID_3'] ||
         exists(/databases/$(database)/documents/admins/$(request.auth.uid)));
    }
    
    // === REGISTRO DE ADMINISTRADORES ===
    match /admins/{userId} {
      // Lectura: El propio usuario y otros admins
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         request.auth.uid in ['6n69apb5GMb7NxReTd1LTZZzTpg2', 'ADMIN_UID_2', 'ADMIN_UID_3']);
      
      // Escritura: Cualquier usuario autenticado puede registrarse como admin
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Actualización/eliminación: Solo el propio usuario
      allow update, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // === TARJETAS DE USUARIOS ===
    match /cards/{cardId} {
      // Los usuarios pueden leer y escribir sus propias tarjetas
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || request.auth.uid == resource.data.owner);
      
      // Permitir creación si el usuario es el propietario
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // === OTRAS COLECCIONES ===
    // Permitir acceso a otras colecciones existentes
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /profiles/{profileId} {
      allow read, write: if request.auth != null;
    }
    
    // Regla catch-all para colecciones no especificadas
    match /{document=**} {
      allow read, write: if false; // Denegar por defecto, requiere reglas específicas
    }
  }
}`;

/**
 * Aplica las reglas de Firestore actualizadas
 */
export const updateFirestoreRules = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🔧 Aplicando reglas de Firestore actualizadas...');
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        message: 'Usuario no autenticado'
      };
    }

    console.log('📋 Reglas de Firestore preparadas:');
    console.log(FIRESTORE_RULES);

    // En un entorno de producción, estas reglas se aplicarían a través de Firebase CLI o Console
    // Para desarrollo, mostramos las reglas que deben aplicarse manualmente
    
    return {
      success: true,
      message: `
✅ Reglas preparadas para aplicar manualmente:

🔧 Copia estas reglas a la consola de Firebase:
1. Ve a https://console.firebase.google.com
2. Selecciona tu proyecto
3. Ve a Firestore Database > Rules
4. Pega las reglas mostradas en la consola
5. Clic en "Publish"

📋 UID de admin actual: ${currentUser.uid}

⚠️ IMPORTANTE: Asegúrate de incluir tu UID en la lista de administradores en las reglas.
      `
    };

  } catch (error: any) {
    console.error('❌ Error preparando reglas:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
};

// Hacer disponible globalmente
(window as any).updateFirestoreRules = updateFirestoreRules;
(window as any).showFirestoreRules = () => {
  console.log('📋 REGLAS DE FIRESTORE PARA COPIAR:');
  console.log('=====================================');
  console.log(FIRESTORE_RULES);
  console.log('=====================================');
  console.log('💡 Ejecuta: updateFirestoreRules() para más instrucciones');
};

export { FIRESTORE_RULES };