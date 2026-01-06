'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Committee } from '@/types';
import { HybridMember } from '@/lib/hybridMembers';
import { useI18n } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MemberCard } from './MemberCard';
import { Users, Building2, ArrowRight } from 'lucide-react';

// Function to get unique colors and styles for each committee 
const getCommitteeStyle = (committeeName: string) => {
  const styles = {
    'Leaders': {
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      textColor: 'text-blue-900',
      hoverTextColor: 'group-hover:text-blue-700',
      iconColor: 'text-blue-600',
      hoverIconColor: 'group-hover:text-blue-800',
      buttonBg: 'bg-blue-100',
      buttonHover: 'hover:bg-blue-200',
      buttonText: 'text-blue-700'
    },
    'Tech Team': {
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      border: 'border-purple-200',
      textColor: 'text-purple-900',
      hoverTextColor: 'group-hover:text-purple-700',
      iconColor: 'text-purple-600',
      hoverIconColor: 'group-hover:text-purple-800',
      buttonBg: 'bg-purple-100',
      buttonHover: 'hover:bg-purple-200',
      buttonText: 'text-purple-700'
    },
    'Event Planning Team': {
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      border: 'border-green-200',
      textColor: 'text-green-900',
      hoverTextColor: 'group-hover:text-green-700',
      iconColor: 'text-green-600',
      hoverIconColor: 'group-hover:text-green-800',
      buttonBg: 'bg-green-100',
      buttonHover: 'hover:bg-green-200',
      buttonText: 'text-green-700'
    },
    'Project Management Team': {
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      textColor: 'text-blue-900',
      hoverTextColor: 'group-hover:text-blue-700',
      iconColor: 'text-blue-600',
      hoverIconColor: 'group-hover:text-blue-800',
      buttonBg: 'bg-blue-100',
      buttonHover: 'hover:bg-blue-200',
      buttonText: 'text-blue-700'
    },
    'Public Relations Team': {
      gradient: 'from-pink-500 to-pink-600',
      bgGradient: 'from-pink-50 to-pink-100',
      border: 'border-pink-200',
      textColor: 'text-pink-900',
      hoverTextColor: 'group-hover:text-pink-700',
      iconColor: 'text-pink-600',
      hoverIconColor: 'group-hover:text-pink-800',
      buttonBg: 'bg-pink-100',
      buttonHover: 'hover:bg-pink-200',
      buttonText: 'text-pink-700'
    },
    'Marketing Team': {
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      border: 'border-orange-200',
      textColor: 'text-orange-900',
      hoverTextColor: 'group-hover:text-orange-700',
      iconColor: 'text-orange-600',
      hoverIconColor: 'group-hover:text-orange-800',
      buttonBg: 'bg-orange-100',
      buttonHover: 'hover:bg-orange-200',
      buttonText: 'text-orange-700'
    },
    'Operations & Logistics Team': {
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      border: 'border-indigo-200',
      textColor: 'text-indigo-900',
      hoverTextColor: 'group-hover:text-indigo-700',
      iconColor: 'text-indigo-600',
      hoverIconColor: 'group-hover:text-indigo-800',
      buttonBg: 'bg-indigo-100',
      buttonHover: 'hover:bg-indigo-200',
      buttonText: 'text-indigo-700'
    }
  };

  // Default style for any committee not in the list
  const defaultStyle = {
    gradient: 'from-gray-500 to-gray-600',
    bgGradient: 'from-gray-50 to-gray-100',
    border: 'border-gray-200',
    textColor: 'text-gray-900',
    hoverTextColor: 'group-hover:text-gray-700',
    iconColor: 'text-gray-600',
    hoverIconColor: 'group-hover:text-gray-800',
    buttonBg: 'bg-gray-100',
    buttonHover: 'hover:bg-gray-200',
    buttonText: 'text-gray-700'
  };

  return styles[committeeName as keyof typeof styles] || defaultStyle;
};

interface CommitteeCardProps {
  committee: Committee;
  hybridMembers: HybridMember[];
  className?: string;
}

export const CommitteeCard: React.FC<CommitteeCardProps> = ({
  committee,
  hybridMembers,
  className = ''
}) => {
  const { t, lang } = useI18n();
  const router = useRouter();
  const style = getCommitteeStyle(committee.name);

  // Count hybrid members for this committee
  const memberCount = hybridMembers.filter(member =>
    member.committeeName === committee.name
  ).length;

  const handleViewCommittee = () => {
    router.push(`/team/committee/${committee.id}`);
  };

  const isArabic = lang === 'ar';
  const formattedCount = new Intl.NumberFormat(isArabic ? 'ar' : 'en').format(memberCount);
  const memberLabel = isArabic ? (memberCount === 1 ? 'عضو' : 'أعضاء') : (memberCount === 1 ? 'member' : 'members');
  const viewDetailsLabel = isArabic ? 'عرض التفاصيل' : 'View Details';

  return (
    <Card className={`group overflow-hidden transition-all duration-500 ease-out hover:shadow-xl hover:scale-[1.03] cursor-pointer bg-gradient-to-br ${style.bgGradient} border ${style.border} md:filter md:grayscale transition-[filter] duration-700 ease-in-out md:hover:grayscale-0 ${className}`} onClick={handleViewCommittee}>
      <div className="p-12 h-80 flex flex-col justify-center items-center text-center">
        {/* Centered Committee Name */}
        <div className="mb-8 flex flex-col items-center justify-center">
          {committee.name === 'Project Management Team' && (
            <div className="relative w-24 h-16 mb-4">
              <Image
                src="/pmo-logo.png"
                alt="PMO Logo"
                fill
                className="object-contain mix-blend-multiply"
              />
            </div>
          )}
          {committee.name === 'Public Relations Team' && (
            <div className="relative w-24 h-16 mb-4">
              <Image
                src="/pr-logo.png"
                alt="PR Logo"
                fill
                className="object-contain mix-blend-multiply"
              />
            </div>
          )}
          {committee.name === 'Operations & Logistics Team' && (
            <div className="relative w-24 h-16 mb-4">
              <Image
                src="/op-logo.png"
                alt="OP Logo"
                fill
                className="object-contain mix-blend-multiply"
              />
            </div>
          )}
          {committee.name === 'Tech Team' && (
            <div className="relative w-24 h-16 mb-4">
              <Image
                src="/tech-logo.png"
                alt="Tech Logo"
                fill
                className="object-contain mix-blend-multiply"
              />
            </div>
          )}
          {committee.name === 'Marketing Team' && (
            <div className="relative w-24 h-16 mb-4">
              <Image
                src="/marketing-logo.png"
                alt="Marketing Logo"
                fill
                className="object-contain mix-blend-multiply"
              />
            </div>
          )}
          {committee.name === 'Event Planning Team' && (
            <div className="relative w-24 h-16 mb-4">
              <Image
                src="/ep-logo.png"
                alt="Event Planning Logo"
                fill
                className="object-contain mix-blend-multiply"
              />
            </div>
          )}
          <h3 className={`text-4xl font-bold ${style.textColor} ${style.hoverTextColor} transition-colors duration-700 ease-in-out`}>
            {committee.name}
          </h3>
        </div>

        {/* Footer Section */}
        <div className="flex items-center justify-between w-full">
          <div className={`flex items-center space-x-2 ${style.iconColor} ${style.hoverIconColor} transition-colors duration-700 ease-in-out`}>
            <Users className="w-7 h-7" />
            <span className="text-lg font-medium">
              {formattedCount} {memberLabel}
            </span>
          </div>
          <div className={`px-4 py-2 ${style.buttonBg} rounded-full ${style.buttonHover} transition-colors duration-700 ease-in-out`}>
            <span className={`text-sm font-medium ${style.buttonText}`}>{viewDetailsLabel}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface CommitteesSectionProps {
  committees: Committee[];
  hybridMembers: HybridMember[];
  className?: string;
  title?: string;
  sectionLogo?: string;
}

export const CommitteesSection: React.FC<CommitteesSectionProps> = ({
  committees,
  hybridMembers,
  className = '',
  title,
  sectionLogo
}) => {
  const { t } = useI18n();

  // Sort committees to put Leaders first, then Tech Team
  const sortedCommittees = [...committees].sort((a, b) => {
    // Put Leaders first
    if (a.name === 'Leaders') return -1;
    if (b.name === 'Leaders') return 1;

    // Put Tech Team second
    if (a.name.toLowerCase().includes('tech')) return -1;
    if (b.name.toLowerCase().includes('tech')) return 1;

    // For other committees, maintain original order
    return 0;
  });

  // Filter out committees with no members
  const committeesWithMembers = sortedCommittees.filter(committee => {
    const memberCount = hybridMembers.filter(member =>
      member.committeeName === committee.name
    ).length;
    return memberCount > 0;
  });

  if (committeesWithMembers.length === 0) {
    return (
      <section className={`py-16 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {sectionLogo ? (
              <div className="relative w-48 h-24 mx-auto mb-4">
                <Image
                  src={sectionLogo}
                  alt={title || "Section Logo"}
                  fill
                  className="object-contain mix-blend-multiply"
                />
              </div>
            ) : (
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {title || t('team.committees.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {t('team.committees.noMembers')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-20 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex flex-col items-center justify-center mb-4">
            {sectionLogo ? (
              <div className="relative w-48 h-24 mb-4">
                <Image
                  src={sectionLogo}
                  alt={title || "Section Logo"}
                  fill
                  className="object-contain mix-blend-multiply"
                />
              </div>
            ) : (
              <Building2 className="w-8 h-8 text-gray-600 mb-3" />
            )}
            <h2 className="text-4xl font-light text-gray-900">
              {title || t('team.committees.title')}
            </h2>
          </div>

        </div>

        {/* Committees Grid */}
        <div className={`gap-8 ${committeesWithMembers.length === 1
          ? 'flex justify-center'
          : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
          {committeesWithMembers.map((committee) => (
            <CommitteeCard
              key={committee.id}
              committee={committee}
              hybridMembers={hybridMembers}
              className={committeesWithMembers.length === 1 ? 'w-full max-w-md' : ''}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
