"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Award } from "lucide-react";
import { useI18n } from "@/i18n/index";
import Image from "next/image";

interface Member {
  id: string;
  userId: string;
  name: string;
  role?: string;
  committee?: string;
}

export default function MembershipPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { t } = useI18n();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkMembership = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // Check if user is signed in
      if (!user || !userProfile) {
        // User is not signed in, redirect to home
        router.push("/");
        return;
      }

      try {
        // Query members collection for a document with matching userId
        const membersRef = collection(db, "members");
        const q = query(membersRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // User is not a member, redirect away
          router.push("/");
          return;
        }

        // User is a member, get the member data
        const memberDoc = querySnapshot.docs[0];
        const memberData = memberDoc.data();
        setMember({
          id: memberDoc.id,
          userId: memberData.userId || user.uid,
          name: memberData.name || userProfile.displayName || user.email || "Member",
          role: memberData.role,
          committee: memberData.committee,
        });
      } catch (error) {
        console.error("Error checking membership:", error);
        // On error, redirect away for security
        router.push("/");
      } finally {
        setLoading(false);
        setChecking(false);
      }
    };

    checkMembership();
  }, [user, userProfile, authLoading, router]);

  // Show loading state while checking
  if (checking || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#25818a]" />
            <p className="text-slate-600">Loading membership card...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no member data, don't render (redirect is happening)
  if (!member) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          {/* Membership Card Image */}
          <div className="mb-8">
            <div className="relative w-full aspect-[85.6/53.98] max-w-2xl mx-auto">
              <Image
                src="/membership-card.png"
                alt="Membership Card"
                fill
                className="object-contain rounded-lg shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Member Information Card */}
          <Card className="shadow-2xl border-2 border-[#25818a]/20">
            <CardHeader className="bg-gradient-to-r from-[#25818a] to-[#2a9ba5] text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-bold flex items-center gap-3">
                  <Award className="h-8 w-8" />
                  Membership Details
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Member Name */}
                <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#25818a] to-[#2a9ba5] flex items-center justify-center text-white text-2xl font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{member.name}</h2>
                    <p className="text-slate-600 mt-1">Energy Club Member</p>
                  </div>
                </div>

                {/* Role/Committee Information */}
                <div className="space-y-4">
                  {member.role && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-[#25818a]" />
                      <div>
                        <p className="text-sm text-slate-500">Role</p>
                        <Badge variant="secondary" className="mt-1 text-base px-3 py-1">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {member.committee && (
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-[#25818a]" />
                      <div>
                        <p className="text-sm text-slate-500">Committee</p>
                        <Badge variant="outline" className="mt-1 text-base px-3 py-1 border-[#25818a] text-[#25818a]">
                          {member.committee}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {!member.role && !member.committee && (
                    <div className="text-center py-4 text-slate-500">
                      <p>Member information will be updated soon.</p>
                    </div>
                  )}
                </div>

                {/* Decorative Element */}
                <div className="pt-6 border-t border-slate-200">
                  <div className="flex justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#25818a] mb-2">
                        Energy Club
                      </div>
                      <p className="text-sm text-slate-500">
                        Welcome to the Energy Club Community
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

