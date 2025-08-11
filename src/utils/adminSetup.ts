import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { adminAuthService } from '@/services/adminAuth';

export interface AdminSetupResult {
  success: boolean;
  message: string;
  isAdmin: boolean;
}

/**
 * Función de utilidad para asegurar que el usuario actual tenga permisos de administrador
 * Útil para bootstrap y resolución de problemas de permisos
 */
export async function ensureCurrentUserIsAdmin(): Promise<AdminSetupResult> {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return {
        success: false,
        message: 'No hay usuario autenticado. Por favor, inicia sesión primero.',
        isAdmin: false
      };
    }

    console.log('🔍 Verificando permisos de admin para usuario:', currentUser.uid);

    // Verificar si ya existe documento de admin
    const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
    
    if (adminDoc.exists()) {
      console.log('✅ Usuario ya es administrador');
      return {
        success: true,
        message: 'Usuario ya tiene permisos de administrador',
        isAdmin: true
      };
    }

    console.log('⚠️ Usuario no es administrador, creando documento...');

    // Crear documento de administrador para el usuario actual
    const adminData = {
      id: currentUser.uid,
      email: currentUser.email || 'admin@klycs.com',
      name: currentUser.displayName || 'Administrador',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'admins', currentUser.uid), adminData);
    
    // Actualizar localStorage para mantener consistencia
    localStorage.setItem('adminAuth', 'true');
    localStorage.setItem('admin_user', JSON.stringify(adminData));

    console.log('✅ Documento de administrador creado exitosamente');

    return {
      success: true,
      message: 'Permisos de administrador otorgados exitosamente',
      isAdmin: true
    };

  } catch (error: any) {
    console.error('❌ Error configurando permisos de admin:', error);
    return {
      success: false,
      message: `Error: ${error.message || 'No se pudieron otorgar permisos de administrador'}`,
      isAdmin: false
    };
  }
}

/**
 * Función para verificar rápidamente si el usuario actual es administrador
 */
export async function checkCurrentUserAdminStatus(): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    return await adminAuthService.isAdmin(currentUser.uid);
  } catch (error) {
    console.error('Error verificando estado de admin:', error);
    return false;
  }
}

/**
 * Función para solucionar problemas de permisos automáticamente
 */
export async function autoFixAdminPermissions(): Promise<AdminSetupResult> {
  console.log('🔧 Ejecutando auto-corrección de permisos de administrador...');
  
  const result = await ensureCurrentUserIsAdmin();
  
  if (result.success) {
    console.log('✅ Auto-corrección completada exitosamente');
  } else {
    console.error('❌ Auto-corrección falló:', result.message);
  }
  
  return result;
}
