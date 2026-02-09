'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInAnonymously as firebaseSignInAnonymously,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { logUserLogin, logUserSignup, setAnalyticsUserId, setAnalyticsUserProperties } from '@/lib/analytics';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'user' | 'organizer' | 'admin' | 'eventManager';
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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  isOrganizer: boolean;
  isEventManager: boolean;
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

      const normalizedRole = (existingData.role || 'user') as UserProfile['role'];

      return {
        id: firebaseUser.uid,
        email: existingData.email || firebaseUser.email || '',
        displayName: existingData.displayName || firebaseUser.displayName || '',
        photoURL: existingData.photoURL || firebaseUser.photoURL || 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=User',
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
        photoURL: firebaseUser.photoURL || 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png',
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

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;
      setUser(firebaseUser);
      const profile = await createOrUpdateUserProfile(firebaseUser);
      setUserProfile(profile);

      // Log login event for analytics
      logUserLogin('email');
      setAnalyticsUserId(firebaseUser.uid);
      setAnalyticsUserProperties({
        user_role: profile.role,
      });
    } catch (error: any) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;

      // Update the user's display name
      await updateProfile(firebaseUser, { displayName });

      setUser(firebaseUser);
      const profile = await createOrUpdateUserProfile(firebaseUser);
      setUserProfile(profile);

      // Log signup event for analytics
      logUserSignup('email');
      setAnalyticsUserId(firebaseUser.uid);
      setAnalyticsUserProperties({
        user_role: profile.role,
      });
    } catch (error: any) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
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
                  photoURL: data?.photoURL || firebaseUser.photoURL || 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=User',
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
    signInWithEmail,
    signUpWithEmail,
    signInAnonymously,
    resetPassword,
    logout,
    updateUserProfile,
    isAdmin: userProfile?.role === 'admin',
    isOrganizer: userProfile?.role === 'organizer' || userProfile?.role === 'admin',
    isEventManager: userProfile?.role === 'eventManager',
    isAnonymous: user?.isAnonymous || false
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
