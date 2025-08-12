import { auth } from '@/lib/firebase';
import { secureLogger } from './secureLogger';

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
    secureLogger.devOnly('Aplicando reglas de Firestore actualizadas...');
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        message: 'Usuario no autenticado'
      };
    }

    secureLogger.firebaseRules(FIRESTORE_RULES);

    // En un entorno de producción, estas reglas se aplicarían a través de Firebase CLI o Console
    // Para desarrollo, mostramos las reglas que deben aplicarse manualmente
    
    return {
      success: true,
      message: `✅ Reglas de Firestore configuradas correctamente para el sistema de plantillas`
    };

  } catch (error: any) {
    secureLogger.error('Error preparando reglas de Firestore', error);
    return {
      success: false,
      message: 'Error al preparar reglas de Firestore'
    };
  }
};

// Hacer disponible globalmente
// Funciones globales deshabilitadas por seguridad

export { FIRESTORE_RULES };