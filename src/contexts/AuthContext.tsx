'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,  // استخدم البوب اب بدل الريدايركت
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInAnonymously as firebaseSignInAnonymously,
  linkWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'organizer' | 'admin';
  createdAt: Date;
  lastLogin: Date;
  preferences: {
    emailNotifications: boolean;
    eventReminders: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  isOrganizer: boolean;
  isAnonymous: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const createOrUpdateUserProfile = async (firebaseUser: User): Promise<UserProfile> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    const now = new Date();

    if (userSnap.exists()) {
      const existingData = userSnap.data();
      try {
        await updateDoc(userRef, {
          lastLogin: now,
          displayName: firebaseUser.displayName || existingData.displayName,
          photoURL: firebaseUser.photoURL || existingData.photoURL,
          email: firebaseUser.email || existingData.email
        });
      } catch (err) {
        console.warn('User profile updateDoc failed; proceeding with read-only data', err);
      }

      const normalizedRole = (String(existingData.role || 'user').toLowerCase() as UserProfile['role']);

      return {
        id: firebaseUser.uid,
        email: existingData.email || firebaseUser.email || '',
        displayName: existingData.displayName || firebaseUser.displayName || '',
        photoURL: existingData.photoURL || firebaseUser.photoURL || undefined,
        role: normalizedRole,
        createdAt: (existingData.createdAt?.toDate ? existingData.createdAt.toDate() : now),
        lastLogin: now,
        preferences: existingData.preferences || { emailNotifications: true, eventReminders: true }
      };
    } else {
      const newUserProfile: UserProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || undefined,
        role: 'user',
        createdAt: now,
        lastLogin: now,
        preferences: { emailNotifications: true, eventReminders: true }
      };

      try {
        await setDoc(userRef, { ...newUserProfile, createdAt: now, lastLogin: now });
      } catch (err) {
        console.warn('User profile setDoc failed; returning local profile only', err);
      }
      return newUserProfile;
    }
  };

  const signInAnonymously = async () => {
    try {
      const result = await firebaseSignInAnonymously(auth);
      const firebaseUser = result.user;
      setUser(firebaseUser);

      // Do not create or persist userProfile for anonymous sessions
      if (firebaseUser.isAnonymous) {
        setUserProfile(null);
      } else {
        const profile = await createOrUpdateUserProfile(firebaseUser);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Check if there's an anonymous user that needs to be linked
      if (auth.currentUser?.isAnonymous) {
        // Link anonymous user with Google credential
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential) {
          await linkWithCredential(auth.currentUser, credential);
          const firebaseUser = result.user;
          setUser(firebaseUser);
          const profile = await createOrUpdateUserProfile(firebaseUser);
          setUserProfile(profile);
        }
      } else {
        // Normal Google sign-in
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        setUser(firebaseUser);
        const profile = await createOrUpdateUserProfile(firebaseUser);
        setUserProfile(profile);
      }
    } catch (error: any) {
      console.error('Error signing in with Google (popup):', error);
      // Handle specific error cases
      if (error.code === 'auth/credential-already-in-use') {
        console.warn('Google account already linked to another user');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return;

    // Never mutate Firebase Auth profile for anonymous sessions
    if (user.isAnonymous) {
      console.warn('Skipping Auth profile updates for anonymous user');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);

      // Only update Firebase Auth displayName/photo for non-anonymous users
      if (updates.displayName || updates.photoURL) {
        await updateProfile(user, { displayName: updates.displayName, photoURL: updates.photoURL });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        if (firebaseUser.isAnonymous) {
          // Never create/update Firestore profile for ephemeral anonymous sessions
          setUserProfile(null);
        } else {
          try {
            const profile = await createOrUpdateUserProfile(firebaseUser);
            setUserProfile(profile);
          } catch (err) {
            console.warn('Failed to update user profile; attempting read-only fetch', err);
            try {
              const ref = doc(db, 'users', firebaseUser.uid);
              const snap = await getDoc(ref);
              if (snap.exists()) {
                const data = snap.data() as any;
                const normalizedRole = (String(data?.role || 'user').toLowerCase() as UserProfile['role']);
                const profileRO: UserProfile = {
                  id: firebaseUser.uid,
                  email: data?.email || firebaseUser.email || '',
                  displayName: data?.displayName || firebaseUser.displayName || '',
                  photoURL: data?.photoURL || firebaseUser.photoURL || undefined,
                  role: normalizedRole,
                  createdAt: (data?.createdAt?.toDate ? data.createdAt.toDate() : new Date()),
                  lastLogin: new Date(),
                  preferences: data?.preferences || { emailNotifications: true, eventReminders: true }
                };
                setUserProfile(profileRO);
              } else {
                setUserProfile(null);
              }
            } catch (readErr) {
              console.error('Failed to read user profile', readErr);
              setUserProfile(null);
            }
          }
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    signInAnonymously,
    logout,
    updateUserProfile,
    isAdmin: userProfile?.role === 'admin',
    isOrganizer: userProfile?.role === 'organizer' || userProfile?.role === 'admin',
    isAnonymous: user?.isAnonymous || false
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
