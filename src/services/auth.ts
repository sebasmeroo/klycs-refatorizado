import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import { info, error } from '@/utils/logger';

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export const authService = {
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
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: name,
        createdAt: new Date(),
        updatedAt: new Date(),
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
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || 'Usuario',
          createdAt: new Date(),
          updatedAt: new Date(),
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

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      
      return null;
    } catch (err) {
      error('Failed to get user data', err as Error, { component: 'authService', userId: uid });
      return null;
    }
  }
};

export default authService;