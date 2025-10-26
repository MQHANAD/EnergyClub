'use client';

import React from 'react';
import { LeadershipPosition, Committee } from '@/types';
import { HybridMember } from '@/lib/hybridMembers';
import { useI18n } from '@/i18n';
import { MemberCard } from './MemberCard';
import { Crown, Users, Star } from 'lucide-react';

interface LeadershipSectionProps {
  leadershipPositions: LeadershipPosition[];
  committees: Committee[];
  hybridMembers: HybridMember[];
  className?: string;
}

export const LeadershipSection: React.FC<LeadershipSectionProps> = ({ 
  leadershipPositions,
  committees,
  hybridMembers,
  className = '' 
}) => {
  const { t } = useI18n();

  const president = leadershipPositions.find(pos => pos.title === 'president');
  const vicePresident = leadershipPositions.find(pos => pos.title === 'vice_president');

  // Find all hybrid members with "Leader" role (flexible matching)
  const leaders = hybridMembers.filter(member => {
    const role = member.role?.trim().toLowerCase();
    return role === "leader" || role === "team leader" || role === "committee leader";
  });

  // Get emails that are already in formal leadership positions (safer than ID, since hybrid id may differ)
  const formalLeadershipEmails = leadershipPositions
    .map(pos => pos.member?.email)
    .filter((e): e is string => Boolean(e));

  // Filter out leaders who are already in formal leadership positions by email
  const uniqueLeaders = leaders
    .filter(leader => !formalLeadershipEmails.includes(leader.email))
    // Deduplicate by email in case of duplicates in hybridMembers
    .filter((leader, index, self) => index === self.findIndex(l => l.email === leader.email));

  // Convert hybrid members to the format expected by MemberCard
  const convertHybridToMember = (hybridMember: HybridMember) => ({
    id: hybridMember.id,
    fullName: hybridMember.fullName,
    role: hybridMember.role,
    committeeId: hybridMember.committeeId,
    committeeName: hybridMember.committeeName,
    profilePicture: hybridMember.profilePicture || undefined,
    linkedInUrl: hybridMember.linkedInUrl || undefined,
    email: hybridMember.email,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Combine leadership positions and unique leaders
  const allLeadership = [
    ...leadershipPositions.map(pos => ({ ...pos, isFormalLeadership: true, committeeName: undefined })),
    ...uniqueLeaders.map(leader => ({ 
      id: `leader-${leader.id}`, 
      title: 'leader' as any, 
      memberId: leader.id, 
      member: convertHybridToMember(leader), 
      isActive: true, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      isFormalLeadership: false,
      committeeName: leader.committeeName
    }))
  ];

  // Prioritize specific leadership id to appear first among non-president/vice
  const PRIORITY_LEADERSHIP_ID = 'Z6XUlCj1HMEP41dtUEA7';
  const sortedOtherLeadership = allLeadership
    .filter(pos => pos.title !== 'president' && pos.title !== 'vice_president' && pos.member)
    .sort((a, b) => {
      const aPri = a.id === PRIORITY_LEADERSHIP_ID ? -1 : 0;
      const bPri = b.id === PRIORITY_LEADERSHIP_ID ? -1 : 0;
      return aPri - bPri;
    });

  if (allLeadership.length === 0) {
    return null;
  }

  return (
    <section className={`py-10 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-gray-600 mr-3" />
            <h2 className="text-4xl font-light text-gray-900">
              {t('team.leadership.title')}
            </h2>
          </div>
        </div>

        {/* Leadership Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* President */}
          {president && president.member && (
            <MemberCard 
              member={president.member} 
              isLeadership={true}
            />
          )}

          {/* Vice President */}
          {vicePresident && vicePresident.member && (
            <MemberCard 
              member={vicePresident.member} 
              isLeadership={true}
            />
          )}

          {/* Other Leadership Positions */}
          {sortedOtherLeadership
            .map((position) => (
              <MemberCard 
                key={position.id}
                member={position.member} 
                isLeadership={true}
              />
            ))}
        </div>
      </div>
    </section>
  );
};
