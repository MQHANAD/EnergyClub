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
  customLeaders?: HybridMember[];
  customTitle?: string;
  hideHeader?: boolean;
}

export const LeadershipSection: React.FC<LeadershipSectionProps> = ({
  leadershipPositions,
  committees,
  hybridMembers,
  className = '',
  customLeaders,
  customTitle,
  hideHeader = false
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

  // Filter to show only specific leaders in exact order
  const allowedNames = ['Layan Iseafan', 'Omar Alsaigh'];

  let finalLeadership = allLeadership;

  if (customLeaders && customLeaders.length > 0) {
    // If custom leaders are provided, use them directly
    finalLeadership = customLeaders.map(leader => ({
      id: `leader-${leader.id}`,
      title: 'leader' as any,
      memberId: leader.id,
      member: {
        ...convertHybridToMember(leader),
        committeeName: leader.committeeName
      },
      committeeName: leader.committeeName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isFormalLeadership: false
    }));
  } else {
    // Default filtering logic: Show accepted leaders
    const filteredLeadership = allLeadership.filter(pos =>
      pos.member && allowedNames.some(name =>
        pos.member.fullName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(pos.member.fullName.toLowerCase())
      )
    );

    // Sort in the exact order specified
    finalLeadership = filteredLeadership.sort((a, b) => {
      const aIndex = allowedNames.findIndex(name =>
        a.member.fullName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(a.member.fullName.toLowerCase())
      );
      const bIndex = allowedNames.findIndex(name =>
        b.member.fullName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(b.member.fullName.toLowerCase())
      );
      return aIndex - bIndex;
    });
  }

  return (
    <section className={`py-6 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}

        {/* Leadership Cards */}
        <div className={`grid grid-cols-1 ${finalLeadership.length === 1 ? 'place-items-center' : 'md:grid-cols-2'} gap-8 max-w-2xl mx-auto`}>
          {finalLeadership.map((position) => (
            <MemberCard
              key={position.id}
              member={position.member}
              isLeadership={true}
              className={`max-w-xs ${finalLeadership.length === 1 ? 'w-full' : ''}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
