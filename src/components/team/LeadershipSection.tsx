'use client';

import React from 'react';
import { LeadershipPosition, Committee } from '@/types';
import { useI18n } from '@/i18n';
import { MemberCard } from './MemberCard';
import { Crown, Users, Star } from 'lucide-react';

interface LeadershipSectionProps {
  leadershipPositions: LeadershipPosition[];
  committees: Committee[];
  className?: string;
}

export const LeadershipSection: React.FC<LeadershipSectionProps> = ({ 
  leadershipPositions,
  committees,
  className = '' 
}) => {
  const { t } = useI18n();

  const president = leadershipPositions.find(pos => pos.title === 'president');
  const vicePresident = leadershipPositions.find(pos => pos.title === 'vice_president');

  // Find all members with "Leader" role (flexible matching)
  const leaders = committees.flatMap(committee => 
    committee.members
      .filter(member => {
        const role = member.role?.trim().toLowerCase();
        return role === "leader" || role === "team leader" || role === "committee leader";
      })
      .map(member => ({
        ...member,
        committeeName: committee.name
      }))
  );

  // Get member IDs that are already in formal leadership positions
  const formalLeadershipMemberIds = leadershipPositions.map(pos => pos.memberId);

  // Filter out leaders who are already in formal leadership positions
  const uniqueLeaders = leaders.filter(leader => !formalLeadershipMemberIds.includes(leader.id));

  // Combine leadership positions and unique leaders
  const allLeadership = [
    ...leadershipPositions.map(pos => ({ ...pos, isFormalLeadership: true, committeeName: undefined })),
    ...uniqueLeaders.map(leader => ({ 
      id: `leader-${leader.id}`, 
      title: 'leader' as any, 
      memberId: leader.id, 
      member: leader, 
      isActive: true, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      isFormalLeadership: false,
      committeeName: leader.committeeName
    }))
  ];

  if (allLeadership.length === 0) {
    return null;
  }

  return (
    <section className={`py-10 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-yellow-500 mr-3" />
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
          {allLeadership
            .filter(pos => pos.title !== 'president' && pos.title !== 'vice_president')
            .filter(position => position.member) // Only render if member exists
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
