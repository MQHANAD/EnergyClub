'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Committee } from '@/types';
import { useI18n } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MemberCard } from './MemberCard';
import { Users, Building2, ArrowRight } from 'lucide-react';

interface CommitteeCardProps {
  committee: Committee;
  className?: string;
}

export const CommitteeCard: React.FC<CommitteeCardProps> = ({ 
  committee,
  className = '' 
}) => {
  const { t } = useI18n();
  const router = useRouter();

  const handleViewCommittee = () => {
    router.push(`/team/committee/${committee.id}`);
  };

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer ${className}`} onClick={handleViewCommittee}>
      <div className="p-6 bg-white border border-gray-200 hover:bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-light text-gray-900">{committee.name}</h3>
            <div className="flex items-center space-x-2 text-gray-600 mt-1">
              <Users className="w-4 h-4" />
              <span className="text-sm font-light">
                {committee.members.length} {committee.members.length === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </Card>
  );
};

interface CommitteesSectionProps {
  committees: Committee[];
  className?: string;
}

export const CommitteesSection: React.FC<CommitteesSectionProps> = ({ 
  committees,
  className = '' 
}) => {
  const { t } = useI18n();

  if (committees.length === 0) {
    return (
      <section className={`py-16 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('team.committees.title')}
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
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-4xl font-light text-gray-900">
              {t('team.committees.title')}
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
            {t('team.committees.subtitle')}
          </p>
        </div>

        {/* Committees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {committees.map((committee) => (
            <CommitteeCard
              key={committee.id}
              committee={committee}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
