'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useMember } from '@/hooks/useMember';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/register/LoadingSpinner';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Users, Award, User as UserIcon, AlertCircle } from 'lucide-react';

function MembershipCardContent() {
  const { user } = useAuth();
  const { memberInfo, isMember, loading } = useMember();
  const router = useRouter();

  // Redirect if not a member (this handles the case where user tries to access manually)
  useEffect(() => {
    if (!loading && (!user || !isMember)) {
      router.push('/');
    }
  }, [loading, user, isMember, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // If not a member, show nothing (redirect is in progress)
  if (!user || !isMember || !memberInfo) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-24 pb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-light text-gray-900 mb-2">
                Access Denied
              </h1>
              <p className="text-gray-600">
                This page is only available to members.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <div className="pt-24 pb-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-light text-gray-900 mb-2">
              Membership Card
            </h1>
            <p className="text-gray-600 font-light">
              Your official Energy Club membership badge
            </p>
          </div>

          {/* Membership Card */}
          <Card className="p-8 bg-white border-2 border-gray-200 shadow-xl relative overflow-hidden">
            {/* SVG Background - uncomment and update path if you want a background SVG */}
            {/* <img 
              src="/membership-card.svg" 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none"
            /> */}
            <div className="flex flex-col items-center relative z-10">
              {/* Badge Icon/Logo Area */}
              <div className="mb-6 relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg relative">
                  {memberInfo.profilePicture ? (
                    <OptimizedImage
                      src={memberInfo.profilePicture}
                      alt={memberInfo.fullName}
                      className="w-full h-full object-cover"
                      fallbackText={memberInfo.fullName}
                      size={128}
                    />
                  ) : (
                    <Award className="w-16 h-16 text-white" />
                  )}
                </div>
                {/* SVG Badge - uncomment and update path to use your SVG */}
                {/* <img 
                  src="/membership-badge.svg" 
                  alt="Membership Badge" 
                  className="absolute -top-2 -right-2 w-16 h-16"
                /> */}
              </div>

              {/* Member Name */}
              <div className="mb-6 text-center">
                <h2 className="text-3xl font-light text-gray-900 mb-2">
                  {memberInfo.fullName}
                </h2>
                <p className="text-gray-500 font-light text-sm">
                  {memberInfo.email}
                </p>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gray-200 mb-6"></div>

              {/* Member Details */}
              <div className="w-full space-y-4">
                {/* Role */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center text-gray-600">
                    <UserIcon className="w-5 h-5 mr-3" />
                    <span className="font-medium">Role</span>
                  </div>
                  <span className="text-gray-900 font-light">
                    {memberInfo.role}
                  </span>
                </div>

                {/* Committee */}
                {memberInfo.committeeName && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center text-gray-600">
                      <Users className="w-5 h-5 mr-3" />
                      <span className="font-medium">Committee</span>
                    </div>
                    <span className="text-gray-900 font-light">
                      {memberInfo.committeeName}
                    </span>
                  </div>
                )}

                {/* Membership Status */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center text-gray-600">
                    <Award className="w-5 h-5 mr-3" />
                    <span className="font-medium">Status</span>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Active Member
                  </span>
                </div>
              </div>

              {/* Footer Message */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500 font-light italic">
                  Thank you for being part of the Energy Club
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function MembershipCardPage() {
  return (
    <AuthGuard requireAuth={true} fallback={null}>
      <MembershipCardContent />
    </AuthGuard>
  );
}

