'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';


interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOrganizer?: boolean;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

export default function AuthGuard({
  children,
  requireAuth = false,
  requireOrganizer = false,
  requireAdmin = false,
  fallback = null
}: AuthGuardProps) {
  const { user, userProfile, loading, isOrganizer, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <span className="loading loading-infinity loading-xl"></span>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Check authentication requirements
  if (requireAuth && !user) {
    if (fallback) return <>{fallback}</>;
    // Append current path as 'from' parameter
    const loginUrl = `/login?from=${encodeURIComponent(pathname)}`;
    router.push(loginUrl);
    return null;
  }

  // Check organizer requirements
  if (requireOrganizer && !isOrganizer) {
    if (fallback) return <>{fallback}</>;
    router.push('/');
    return null;
  }

  // Check admin requirements
  if (requireAdmin && !isAdmin) {
    if (fallback) return <>{fallback}</>;
    router.push('/');
    return null;
  }

  return <>{children}</>;
}