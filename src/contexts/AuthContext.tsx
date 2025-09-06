'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  updateProfile
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
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  isOrganizer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
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
      // Update last login
      await updateDoc(userRef, {
        lastLogin: now,
        displayName: firebaseUser.displayName || userSnap.data().displayName,
        photoURL: firebaseUser.photoURL || userSnap.data().photoURL,
        email: firebaseUser.email || userSnap.data().email
      });

      const existingData = userSnap.data();
      return {
        id: firebaseUser.uid,
        email: existingData.email,
        displayName: existingData.displayName,
        photoURL: existingData.photoURL,
        role: existingData.role || 'user',
        createdAt: existingData.createdAt?.toDate() || now,
        lastLogin: now,
        preferences: existingData.preferences || {
          emailNotifications: true,
          eventReminders: true
        }
      };
    } else {
      // Create new user profile
      const newUserProfile: UserProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || undefined,
        role: 'user',
        createdAt: now,
        lastLogin: now,
        preferences: {
          emailNotifications: true,
          eventReminders: true
        }
      };

      await setDoc(userRef, {
        ...newUserProfile,
        createdAt: now,
        lastLogin: now
      });

      return newUserProfile;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithRedirect(auth, googleProvider);
      // User profile will be handled by the onAuthStateChanged listener
    } catch (error) {
      console.error('Error signing in with Google:', error);
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

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);

      setUserProfile(prev => prev ? { ...prev, ...updates } : null);

      // Update Firebase Auth profile if display name or photo URL changed
      if (updates.displayName || updates.photoURL) {
        await updateProfile(user, {
          displayName: updates.displayName,
          photoURL: updates.photoURL
        });
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
        try {
          const profile = await createOrUpdateUserProfile(firebaseUser);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Still set the user even if profile loading fails
          setUserProfile(null);
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
    logout,
    updateUserProfile,
    isAdmin: userProfile?.role === 'admin',
    isOrganizer: userProfile?.role === 'organizer' || userProfile?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};