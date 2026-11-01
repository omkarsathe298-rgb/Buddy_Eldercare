import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole, AppLanguage, FontSize } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string, role?: UserRole, preferredLanguage?: AppLanguage) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  isCaregiver: boolean;
  isElderly: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'omkarsathe298@gmail.com';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile from Firestore or create initial record
  const syncUserProfile = async (user: FirebaseUser): Promise<UserProfile> => {
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        return data;
      } else {
        const isDefaultAdmin = user.email === ADMIN_EMAIL;
        const initialProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Elderly Learner',
          email: user.email || '',
          role: isDefaultAdmin ? 'admin' : 'elderly_user',
          preferredLanguage: 'en',
          fontSize: 'large',
          highContrast: false,
          speechSpeed: 0.85,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userRef, initialProfile);
        
        // If admin, also write to admins collection
        if (isDefaultAdmin) {
          try {
            await setDoc(doc(db, 'admins', user.uid), {
              uid: user.uid,
              email: user.email,
              assignedAt: new Date().toISOString()
            });
          } catch (e) {
            console.warn('Admin record write check:', e);
          }
        }
        
        setUserProfile(initialProfile);
        return initialProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await syncUserProfile(user);
        } catch (err) {
          console.error('Failed to sync user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await syncUserProfile(cred.user);
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    pass: string,
    role: UserRole = 'elderly_user',
    preferredLanguage: AppLanguage = 'en'
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    
    const isDefaultAdmin = email === ADMIN_EMAIL;
    const initialProfile: UserProfile = {
      uid: cred.user.uid,
      name,
      email,
      role: isDefaultAdmin ? 'admin' : role,
      preferredLanguage,
      fontSize: 'large',
      highContrast: false,
      speechSpeed: 0.85,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), initialProfile);
      if (isDefaultAdmin) {
        await setDoc(doc(db, 'admins', cred.user.uid), {
          uid: cred.user.uid,
          email,
          assignedAt: new Date().toISOString()
        });
      }
      setUserProfile(initialProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${cred.user.uid}`);
    }
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(cred.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserPreferences = async (prefs: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const updated = {
      ...prefs,
      updatedAt: new Date().toISOString()
    };
    try {
      await updateDoc(userRef, updated);
      setUserProfile(prev => prev ? { ...prev, ...updated } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const isAdmin = userProfile?.role === 'admin' || currentUser?.email === ADMIN_EMAIL;
  const isCaregiver = userProfile?.role === 'caregiver';
  const isElderly = userProfile?.role === 'elderly_user' || (!isAdmin && !isCaregiver);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        updateUserPreferences,
        isAdmin,
        isCaregiver,
        isElderly
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
