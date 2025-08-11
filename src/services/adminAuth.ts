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

      // Persist lightweight session for route guard
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('admin_user', JSON.stringify(adminData));

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

      let snapshot = await getDoc(doc(db, ADMIN_COLLECTION, user.uid));
      // Bootstrap: si no existe y estamos en dev o bandera activa, crear doc admin
      const bootstrapEnabled = import.meta.env.MODE !== 'production' || import.meta.env.VITE_ADMIN_BOOTSTRAP_ENABLED === 'true';
      if (!snapshot.exists() && bootstrapEnabled) {
        const adminData: AdminUser = {
          id: user.uid,
          email: user.email || email,
          name: user.displayName || 'Administrador',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await setDoc(doc(db, ADMIN_COLLECTION, user.uid), adminData);
        snapshot = await getDoc(doc(db, ADMIN_COLLECTION, user.uid));
      }

      if (!snapshot.exists()) {
        return { success: false, error: 'No autorizado como administrador' };
      }

      const adminData = snapshot.data() as AdminUser;
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('admin_user', JSON.stringify(adminData));

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
      await signOut(auth);
    } finally {
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_token');
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


