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
    <section className={`py-20 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-yellow-500 mr-3" />
            <h2 className="text-4xl font-light text-gray-900">
              {t('team.leadership.title')}
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
            {t('team.leadership.subtitle')}
          </p>
        </div>

        {/* Leadership Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* President */}
          {president && (
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg z-10">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="bg-gray-50 rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-light text-yellow-600 mb-2">
                    {t('team.leadership.president')}
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full"></div>
                </div>
                <MemberCard 
                  member={president.member} 
                  isLeadership={true}
                  className="border-0 shadow-none hover:shadow-none hover:scale-100"
                />
              </div>
            </div>
          )}

          {/* Vice President */}
          {vicePresident && (
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg z-10">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="bg-gray-50 rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-light text-blue-600 mb-2">
                    {t('team.leadership.vicePresident')}
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto rounded-full"></div>
                </div>
                <MemberCard 
                  member={vicePresident.member} 
                  isLeadership={true}
                  className="border-0 shadow-none hover:shadow-none hover:scale-100"
                />
              </div>
            </div>
          )}

          {/* Other Leadership Positions */}
          {allLeadership
            .filter(pos => pos.title !== 'president' && pos.title !== 'vice_president')
            .map((position) => (
              <div key={position.id} className="relative">
                {position.isFormalLeadership ? (
                  <div className="relative">
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg z-10">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-8 shadow-lg border border-gray-200">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-light text-purple-600 mb-2">
                          {position.title === 'leader' ? 'Leader' : position.title}
                        </h3>
                        <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-purple-600 mx-auto rounded-full"></div>
                      </div>
                      <MemberCard 
                        member={position.member} 
                        isLeadership={true}
                        className="border-0 shadow-none hover:shadow-none hover:scale-100"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg z-10">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-8 shadow-lg border border-gray-200">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-light text-green-600 mb-2">
                          Leader of "{position.committeeName}"
                        </h3>
                        <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-green-600 mx-auto rounded-full"></div>
                      </div>
                      <MemberCard 
                        member={position.member} 
                        isLeadership={true}
                        className="border-0 shadow-none hover:shadow-none hover:scale-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};
