import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { info, error as logError } from '@/utils/logger';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminAuthResponse {
  success: boolean;
  admin?: AdminUser;
  error?: string;
}

const ADMIN_COLLECTION = 'admins';

export const adminAuthService = {
  async register(email: string, password: string, name: string): Promise<AdminAuthResponse> {
    try {
      info('Registering admin', { component: 'adminAuthService', email });

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = cred;

      const adminData: AdminUser = {
        id: user.uid,
        email: user.email || email,
        name,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, ADMIN_COLLECTION, user.uid), adminData);

      // No usar localStorage - Firebase Auth maneja la sesión de forma segura
      info('Admin registered successfully', { component: 'adminAuthService', adminId: user.uid });

      return { success: true, admin: adminData };
    } catch (err: any) {
      logError('Failed to register admin', err as Error, { component: 'adminAuthService', email });
      let message = 'No se pudo registrar el admin';
      if (typeof err?.code === 'string') {
        switch (err.code) {
          case 'auth/email-already-in-use':
            message = 'Este email ya tiene cuenta. Usa "Iniciar sesión" para promoverlo a admin.';
            break;
          case 'auth/weak-password':
            message = 'La contraseña debe tener al menos 6 caracteres';
            break;
          case 'auth/invalid-email':
            message = 'Email inválido';
            break;
          default:
            message = err.message || message;
        }
      }
      return { success: false, error: message };
    }
  },

  async login(email: string, password: string): Promise<AdminAuthResponse> {
    try {
      info('Admin login attempt', { component: 'adminAuthService', email });
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const { user } = cred;

      const snapshot = await getDoc(doc(db, ADMIN_COLLECTION, user.uid));
      // Bootstrap: SOLO en desarrollo y con flag explícito
      const bootstrapEnabled = import.meta.env.MODE === 'development' &&
                               import.meta.env.VITE_ADMIN_BOOTSTRAP_ENABLED === 'true';

      if (!snapshot.exists() && bootstrapEnabled) {
        info('Creating admin user in development mode', { component: 'adminAuthService', email });
        const adminData: AdminUser = {
          id: user.uid,
          email: user.email || email,
          name: user.displayName || 'Administrador',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await setDoc(doc(db, ADMIN_COLLECTION, user.uid), adminData);
      }

      if (!snapshot.exists()) {
        return { success: false, error: 'No autorizado como administrador' };
      }

      const adminData = snapshot.data() as AdminUser;

      // Firebase Auth maneja la sesión automáticamente con tokens JWT seguros
      info('Admin logged in successfully', { component: 'adminAuthService', adminId: user.uid });

      return { success: true, admin: adminData };
    } catch (err: any) {
      logError('Admin login failed', err as Error, { component: 'adminAuthService', email });
      let message = 'No se pudo iniciar sesión';
      if (typeof err?.code === 'string') {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            message = 'Email o contraseña incorrectos';
            break;
          case 'permission-denied':
            message = 'Permisos insuficientes para leer admins. Despliega reglas de Firestore.';
            break;
          default:
            message = err.message || message;
        }
      }
      return { success: false, error: message };
    }
  },

  async logout(): Promise<void> {
    try {
      info('Admin logout', { component: 'adminAuthService' });
      await signOut(auth);
      // Firebase Auth limpia automáticamente la sesión
    } catch (error) {
      logError('Error during logout', error as Error, { component: 'adminAuthService' });
      throw error;
    }
  },

  async isAdmin(uid: string): Promise<boolean> {
    try {
      const snapshot = await getDoc(doc(db, ADMIN_COLLECTION, uid));
      return snapshot.exists();
    } catch (err) {
      logError('Failed checking admin role', err as Error, { component: 'adminAuthService', uid });
      return false;
    }
  }
};

export default adminAuthService;


