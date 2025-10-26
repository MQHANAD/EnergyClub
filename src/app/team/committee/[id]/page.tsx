'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Committee, Member } from '@/types';
import { HybridMember, getCommitteeMembersDirect } from '@/lib/hybridMembers';
import { useI18n } from '@/i18n';
import { teamApi } from '@/lib/firestore';
import LoadingSpinner from '@/components/register/LoadingSpinner';
import Navigation from '@/components/Navigation';
import { MemberCard } from '@/components/team/MemberCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Users, AlertCircle } from 'lucide-react';
import { logCommitteeView } from '@/lib/analytics';

export default function CommitteePage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const committeeId = params.id as string;
  
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [members, setMembers] = useState<HybridMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommittee = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch committee data and members in parallel
        const [committeeData, membersData] = await Promise.all([
          teamApi.getCommitteeLight(committeeId),
          committeeId ? getCommitteeMembersDirect(committeeId) : Promise.resolve([])
        ]);
        
        if (committeeData) {
          setCommittee(committeeData);
          setMembers(membersData);
          
          // Log committee view for analytics
          logCommitteeView(committeeId, committeeData.name);
        } else {
          setError('Committee not found');
        }
      } catch (err) {
        console.error('Error fetching committee:', err);
        setError('Failed to load committee data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (committeeId) {
      fetchCommittee();
    }
  }, [committeeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
         
        </div>
      </div>
    );
  }

  if (error || !committee) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-light text-gray-900 mb-2">
            {error || 'Committee Not Found'}
          </h2>
          <p className="text-gray-600 mb-6 font-light">
            The committee you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/team')} className="bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Team
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {/* Header */}
      <section className="bg-white pt-16 md:pt-24 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => router.push('/team')}
              className="mb-6 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              
              <h1 className="text-4xl md:text-5xl font-light text-gray-900">
                {committee.name}
              </h1>
            </div>
           
          </div>
        </div>
      </section>

      {/* Members Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          

          {/* Members Grid */}
          {members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {members
                .sort((a, b) => {
                  // Check if member is a leader
                  const aIsLeader = a.role?.trim().toLowerCase() === "leader" || 
                                   a.role?.trim().toLowerCase() === "team leader" || 
                                   a.role?.trim().toLowerCase() === "committee leader";
                  const bIsLeader = b.role?.trim().toLowerCase() === "leader" || 
                                   b.role?.trim().toLowerCase() === "team leader" || 
                                   b.role?.trim().toLowerCase() === "committee leader";
                  
                  // Leaders come first
                  if (aIsLeader && !bIsLeader) return -1;
                  if (!aIsLeader && bIsLeader) return 1;
                  
                  // If both are leaders or both are not leaders, maintain original order
                  return 0;
                })
                .map((member) => {
                  const isLeader = member.role?.trim().toLowerCase() === "leader" || 
                                 member.role?.trim().toLowerCase() === "team leader" || 
                                 member.role?.trim().toLowerCase() === "committee leader";
                  
                  // Convert hybrid member to Member format for MemberCard
                  const memberData = {
                    id: member.id,
                    fullName: member.fullName,
                    role: member.role,
                    committeeId: member.committeeId,
                    profilePicture: member.profilePicture || undefined,
                    linkedInUrl: member.linkedInUrl || undefined,
                    portfolioUrl: member.portfolioUrl || undefined,
                    email: member.email,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  };
                  
                  return (
                    <MemberCard 
                      key={member.id} 
                      member={memberData} 
                      isLeadership={isLeader}
                    />
                  );
                })}
            </div>
          ) : (
            <Card className="p-12 text-center bg-gray-50 border border-gray-200">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-light text-gray-900 mb-2">
                No Members Yet
              </h3>
              <p className="text-gray-600 font-light">
                This committee doesn't have any members yet.
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* Footer Spacing */}
      <div className="py-16"></div>
    </div>
  );
}
