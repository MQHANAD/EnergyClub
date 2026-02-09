'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Committee, Member } from '@/types';
import { HybridMember, getCommitteeMembersDirect, getMembersUltraOptimized } from '@/lib/hybridMembers';
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
  const searchParams = useSearchParams();
  const committeeId = params.id as string;
  const region = searchParams.get('region');

  const [committee, setCommittee] = useState<Committee | null>(null);
  const [members, setMembers] = useState<HybridMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommittee = async () => {
      try {
        setLoading(true);
        setError(null);

        if (committeeId === 'leaders') {
          // ... (existing leaders logic remains same)
          const [leadershipPositions, allMembers] = await Promise.all([
            teamApi.getLeadershipPositions(),
            getMembersUltraOptimized()
          ]);

          setCommittee({
            id: 'leaders',
            name: 'Leaders',
            order: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            members: [],
            regionId: 'all'
          });

          const president = leadershipPositions.find((p: any) => p.title === 'president');
          const vicePresident = leadershipPositions.find((p: any) => p.title === 'vice_president');

          const leaders: HybridMember[] = [];

          if (president && president.member) {
            leaders.push({
              ...president.member,
              role: 'President',
              committeeName: 'Leaders',
              status: 'active'
            } as HybridMember);
          }

          if (vicePresident && vicePresident.member) {
            leaders.push({
              ...vicePresident.member,
              role: 'Vice President',
              committeeName: 'Leaders',
              status: 'active'
            } as HybridMember);
          }

          const normalizeRegionId = (regionName?: string | null) => {
            if (!regionName) return 'eastern_province';
            const lower = regionName.toLowerCase();
            if (lower.includes('riyadh')) return 'riyadh_region';
            if (lower.includes('western') || lower.includes('jeddah')) return 'western_region';
            return 'eastern_province';
          };

          const targetRegionId = normalizeRegionId(region);

          const committeeLeaders = allMembers.filter((member: HybridMember) => {
            const role = member.role?.trim().toLowerCase();
            const matchesRole = role === "leader" || role === "team leader" || role === "committee leader";

            // Check region match
            const memberRegionId = member.regionId || normalizeRegionId(member.region);
            const matchesRegion = memberRegionId === targetRegionId;

            return matchesRole && matchesRegion;
          });

          const uniqueCommitteeLeaders = committeeLeaders.filter((l: HybridMember) =>
            !leaders.some(existing => existing.email === l.email)
          );

          setMembers([...leaders, ...uniqueCommitteeLeaders]);
          logCommitteeView('leaders', 'Leaders');
        } else {
          // Standard committee fetching with regional support and fuzzy matching
          const [committeeData, allMembers] = await Promise.all([
            teamApi.getCommitteeLight(committeeId),
            getMembersUltraOptimized() // All members (cached) to use fuzzy logic
          ]);

          if (committeeData) {
            setCommittee(committeeData);

            // 1. Regional matching helper
            // 1. Regional matching helper
            const normalizeRegionId = (regionName?: string | null) => {
              if (!regionName) return 'eastern_province';
              const lower = regionName.toLowerCase();
              if (lower.includes('riyadh')) return 'riyadh_region';
              if (lower.includes('western') || lower.includes('jeddah')) return 'western_region';
              return 'eastern_province';
            };

            const targetRegionId = normalizeRegionId(region);

            const matchesRegion = (member: HybridMember) => {
              // Use regionId if available (it's populated in getMembersUltraOptimized)
              if (member.regionId) {
                return member.regionId === targetRegionId;
              }
              // Fallback for members without regionId (should be rare/none with optimized fetch)
              return normalizeRegionId(member.region) === targetRegionId;
            };

            // Apply fuzzy filtering client-side for consistency with main page
            const filteredMembers = allMembers.filter(m => {
              // 1. Filter by region
              if (!matchesRegion(m)) return false;

              // 2. Fuzzy match committee name
              if (!m.committeeName) return false;
              const mComm = m.committeeName.toLowerCase();
              const cName = committeeData.name.toLowerCase();

              return mComm === cName || mComm.includes(cName) || cName.includes(mComm);
            });

            // Get regional managers and organizers for this region (not tied to specific committee)
            const regionalLeaders = allMembers.filter(m => {
              // Must match region
              if (!matchesRegion(m)) return false;

              // Must be a regional leader (no specific committee)
              const role = m.role?.trim().toLowerCase() || '';
              const isRegionalManager = role.includes('regional manager') || role.includes('regional leader');
              const isRegionalOrganizer = role.includes('regional organizer');
              
              // Should not be a president/VP (global leaders)
              const isGlobalLeader = m.roleType === 'global_leader';
              
              return (isRegionalManager || isRegionalOrganizer) && !isGlobalLeader;
            });

            // Combine regional leaders with committee members
            const allCommitteeMembers = [...regionalLeaders, ...filteredMembers];

            setMembers(allCommitteeMembers);
            logCommitteeView(committeeId, committeeData.name);
          } else {
            setError('Committee not found');
          }
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
  }, [committeeId, region]);

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
            <div className="flex flex-col items-center justify-center mb-6">
              <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-2">
                {committee.name}
              </h1>
              {region && (
                <p className="text-xl text-blue-600 font-light tracking-wide uppercase">
                  {region.replace(' Regional Team', '')}
                </p>
              )}
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
                  const aRole = a.role?.trim().toLowerCase() || '';
                  const bRole = b.role?.trim().toLowerCase() || '';

                  // Define role priorities (lower = displayed first)
                  const getRolePriority = (role: string) => {
                    if (role.includes('regional manager') || role.includes('regional leader')) return 1;
                    if (role.includes('regional organizer')) return 2;
                    if (role === 'leader' || role === 'team leader' || role === 'committee leader') return 3;
                    return 4; // Regular members
                  };

                  const aPriority = getRolePriority(aRole);
                  const bPriority = getRolePriority(bRole);

                  // Sort by role priority first
                  if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                  }

                  // Within same role priority, sort by order (lower = first)
                  return (a.order ?? 0) - (b.order ?? 0);
                })
                .map((member) => {
                  const role = member.role?.trim().toLowerCase() || '';
                  const isLeader = role === "leader" ||
                    role === "team leader" ||
                    role === "committee leader" ||
                    role.includes('regional manager') ||
                    role.includes('regional leader') ||
                    role.includes('regional organizer');

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
                    updatedAt: new Date(),
                    roleType: member.roleType || 'member',
                    regionId: member.regionId || 'eastern_province'
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
