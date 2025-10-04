import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import { info, error } from '@/utils/logger';

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export const authService = {
  // Obtener usuario actual
  getCurrentUser() {
    return auth.currentUser;
  },

  async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      info('Creating new user account', { component: 'authService', email });
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      info('User account created successfully', { component: 'authService', userId: firebaseUser.uid });
      
      // Update profile with display name
      await updateProfile(firebaseUser, { displayName: name });
      
      // Create user document in Firestore
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: name,
        photoURL: firebaseUser.photoURL || '',
        bio: '',
        username: '',
        plan: 'FREE',
        planExpirationDate: null,
        stripeConnected: false,
        links: [],
        products: [],
        professionals: [], // Array vacío por defecto
        role: 'user', // Por defecto todos son usuarios normales
        createdAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      info('User document created in Firestore', { component: 'authService', userId: firebaseUser.uid });
      
      return {
        success: true,
        user: userData
      };
    } catch (err) {
      error('Failed to create user account', err as Error, { component: 'authService', email });
      
      const authError = err as AuthError;
      let errorMessage = 'Error al crear la cuenta';
      
      switch (authError.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email ya está registrado';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El email no es válido';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'El registro está deshabilitado';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Revisa tu internet';
          break;
        default:
          errorMessage = `Error: ${authError.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      info('Attempting user sign in', { component: 'authService', email });
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      info('User signed in successfully', { component: 'authService', userId: firebaseUser.uid });
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        info('User data retrieved from Firestore', { component: 'authService', userId: firebaseUser.uid });
        
        return {
          success: true,
          user: userData
        };
      } else {
        // Create user document if it doesn't exist (for existing users)
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'Usuario',
          photoURL: firebaseUser.photoURL || '',
          bio: '',
          username: '',
          plan: 'FREE',
          planExpirationDate: null,
          stripeConnected: false,
          links: [],
          products: [],
          professionals: [], // Array vacío por defecto
          role: 'user', // Por defecto usuarios normales
          createdAt: new Date(),
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        info('User document created for existing user', { component: 'authService', userId: firebaseUser.uid });
        
        return {
          success: true,
          user: userData
        };
      }
    } catch (err) {
      error('Failed to sign in user', err as Error, { component: 'authService', email });
      
      const authError = err as AuthError;
      let errorMessage = 'Error al iniciar sesión';
      
      switch (authError.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El email no es válido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Revisa tu internet';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Email o contraseña incorrectos';
          break;
        default:
          errorMessage = `Error: ${authError.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  async signOut(): Promise<AuthResponse> {
    try {
      await signOut(auth);
      info('User signed out successfully', { component: 'authService' });
      
      return {
        success: true
      };
    } catch (err) {
      error('Failed to sign out user', err as Error, { component: 'authService' });
      
      return {
        success: false,
        error: 'Error al cerrar sesión'
      };
    }
  },

  async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        let userData = userDoc.data() as User;
        
        // 🔥 MIGRACIÓN AUTOMÁTICA: Asegurar campos requeridos
        let needsUpdate = false;
        const updates: any = {};
        
        if (!userData.role) {
          updates.role = 'user';
          needsUpdate = true;
          console.log('🔄 Migrando usuario: agregando rol "user"');
        }
        
        if (!userData.professionals) {
          updates.professionals = [];
          needsUpdate = true;
          console.log('🔄 Migrando usuario: agregando array de profesionales');
        }
        
        if (!userData.displayName) {
          updates.displayName = userData.email?.split('@')[0] || 'Usuario';
          needsUpdate = true;
          console.log('🔄 Migrando usuario: agregando displayName');
        }
        
        // Actualizar en Firestore si es necesario
        if (needsUpdate) {
          await updateDoc(doc(db, 'users', uid), {
            ...updates,
            updatedAt: new Date()
          });
          userData = { ...userData, ...updates };
          console.log('✅ Usuario migrado exitosamente con campos faltantes');
        }
        
        return userData;
      }
      
      return null;
    } catch (err) {
      error('Failed to get user data', err as Error, { component: 'authService', userId: uid });
      return null;
    }
  },

  // ===== GESTIÓN DE PROFESIONALES =====
  
  async createProfessional(email: string, password: string, name: string, calendarColor: string): Promise<AuthResponse> {
    try {
      info('Creating professional account', { component: 'authService', email });
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile with display name
      await updateProfile(firebaseUser, { displayName: name });
      
      // Create professional document in Firestore
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: name,
        photoURL: firebaseUser.photoURL || '',
        bio: '',
        username: '',
        plan: 'FREE',
        planExpirationDate: null,
        stripeConnected: false,
        links: [],
        products: [],
        professionals: [], // Array vacío por defecto
        role: 'professional',
        createdAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      info('Professional account created successfully', { 
        component: 'authService', 
        userId: firebaseUser.uid,
        role: 'professional'
      });
      
      return {
        success: true,
        user: userData
      };
      
    } catch (err) {
      error('Failed to create professional account', err as Error, { component: 'authService', email });
      
      const authError = err as AuthError;
      let errorMessage = 'Error al crear la cuenta de profesional';
      
      switch (authError.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email ya está registrado';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El email no es válido';
          break;
        default:
          errorMessage = `Error: ${authError.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  async updateUserRole(uid: string, newRole: 'admin' | 'professional' | 'user'): Promise<{ success: boolean; error?: string }> {
    try {
      await setDoc(doc(db, 'users', uid), {
        role: newRole,
        updatedAt: new Date()
      }, { merge: true });
      
      info('User role updated', { component: 'authService', uid, newRole });
      
      return { success: true };
      
    } catch (err) {
      error('Failed to update user role', err as Error, { component: 'authService', uid, newRole });
      return { 
        success: false, 
        error: 'Error al actualizar el rol del usuario' 
      };
    }
  },

  async linkUserToCalendar(uid: string, calendarId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await setDoc(doc(db, 'users', uid), {
        linkedCalendarId: calendarId,
        updatedAt: new Date()
      }, { merge: true });
      
      info('User linked to calendar', { component: 'authService', uid, calendarId });
      
      return { success: true };
      
    } catch (err) {
      error('Failed to link user to calendar', err as Error, { component: 'authService', uid, calendarId });
      return { 
        success: false, 
        error: 'Error al vincular usuario al calendario' 
      };
    }
  },

  // Obtener usuarios por email (para invitaciones)
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const userDoc = snapshot.docs[0];
      return userDoc.data() as User;
      
    } catch (err) {
      error('Failed to get user by email', err as Error, { component: 'authService', email });
      return null;
    }
  }
};

export default authService;