import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { lpgFirestore, FirebaseLpgUser } from './lpgFirestore';
import { Role, StaffUser } from '../types/lpg';

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
  staffId?: string;
  phone: string;
}

export interface AuthSession {
  firebaseUser: FirebaseUser | null;
  profile: FirebaseLpgUser | null;
  currentUser: CurrentUser | null;
  loading: boolean;
  error: string | null;
}

class FirebaseAuthService {
  private listeners: ((session: AuthSession) => void)[] = [];
  private session: AuthSession = {
    firebaseUser: null,
    profile: null,
    currentUser: null,
    loading: true,
    error: null
  };

  constructor() {
    this.init();
  }

  private init() {
    // Attempt anonymous connection on boot for instant public reading if enabled
    if (!auth.currentUser) {
      signInAnonymously(auth).catch(() => {
        // Handled silently if anonymous login is not activated in project console
      });
    }

    onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && !fbUser.isAnonymous) {
        try {
          const profile = await lpgFirestore.syncUserToFirestore({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            phoneNumber: fbUser.phoneNumber
          });

          this.session = {
            firebaseUser: fbUser,
            profile,
            currentUser: {
              id: profile.uid,
              name: profile.name,
              role: profile.role,
              staffId: profile.staffId,
              phone: profile.phone || fbUser.phoneNumber || ''
            },
            loading: false,
            error: null
          };
        } catch (e) {
          console.error('Error syncing user profile on auth change:', e);
          this.session = {
            ...this.session,
            firebaseUser: fbUser,
            loading: false,
            error: 'Failed to synchronize profile'
          };
        }
      } else {
        // Unauthenticated or anonymous visitor
        this.session = {
          firebaseUser: fbUser || null,
          profile: null,
          currentUser: null,
          loading: false,
          error: null
        };
      }
      this.notify();
    });
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.session));
  }

  public subscribe(cb: (session: AuthSession) => void): () => void {
    this.listeners.push(cb);
    cb(this.session);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public getSession(): AuthSession {
    return this.session;
  }

  /**
   * Verified Google Sign In for Admin
   */
  public async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      this.session.loading = true;
      this.notify();
      const res = await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      this.session.error = msg;
      this.session.loading = false;
      this.notify();
      return { success: false, error: msg };
    }
  }

  /**
   * Secure Staff Phone & PIN Login verified directly against Firestore
   */
  public async loginStaffWithPin(phone: string, pin: string): Promise<{ success: boolean; user?: StaffUser; error?: string }> {
    if (!phone || phone.trim().length < 8) {
      return { success: false, error: 'Please enter a valid mobile number.' };
    }
    if (!pin || pin.trim().length < 4) {
      return { success: false, error: 'Staff access PIN must be at least 4 digits.' };
    }

    this.session.loading = true;
    this.notify();

    const verification = await lpgFirestore.verifyStaffPin(phone, pin);
    this.session.loading = false;

    if (!verification.success || !verification.user) {
      this.session.error = verification.error || 'Authentication failed';
      this.notify();
      return { success: false, error: verification.error };
    }

    const staff = verification.user;
    const staffUser: CurrentUser = {
      id: staff.id,
      name: staff.name,
      role: 'STAFF',
      staffId: staff.id,
      phone: staff.phone
    };

    this.session = {
      ...this.session,
      currentUser: staffUser,
      profile: {
        uid: staff.id,
        name: staff.name,
        phone: staff.phone,
        role: 'STAFF',
        staffId: staff.id,
        createdAt: new Date().toISOString()
      },
      error: null
    };

    this.notify();
    return { success: true, user: staff };
  }

  /**
   * Sign Out
   */
  public async signOut(): Promise<void> {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    this.session = {
      firebaseUser: null,
      profile: null,
      currentUser: null,
      loading: false,
      error: null
    };
    this.notify();
  }
}

export const firebaseAuth = new FirebaseAuthService();
