'use client';

import React from 'react';
import { Member } from '@/types';
import { useI18n } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, User } from 'lucide-react';

interface MemberCardProps {
  member: Member;
  isLeadership?: boolean;
  className?: string;
}

export const MemberCard: React.FC<MemberCardProps> = ({ 
  member, 
  isLeadership = false,
  className = '' 
}) => {
  const { t } = useI18n();

  const defaultProfilePicture = 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=' + 
    member.fullName.split(' ').map(name => name[0]).join('').toUpperCase();

  return (
    <Card className={`p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white border border-gray-200 ${className}`}>
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Profile Picture */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
            <img
              src={member.profilePicture || defaultProfilePicture}
              alt={member.fullName}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = defaultProfilePicture;
              }}
            />
          </div>
          {isLeadership && (
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold">★</span>
            </div>
          )}
        </div>

        {/* Member Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-light text-gray-900">
            {member.fullName}
          </h3>
          <p className="text-sm text-gray-600 font-light">
            {member.role}
          </p>
        </div>

        {/* LinkedIn Link */}
        {member.linkedInUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => window.open(member.linkedInUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {t('team.member.linkedIn')}
          </Button>
        )}

        {/* Fallback for no LinkedIn */}
        {!member.linkedInUrl && (
          <div className="flex items-center justify-center text-gray-400 text-sm">
            <User className="w-4 h-4 mr-2" />
            {t('team.member.noProfilePicture')}
          </div>
        )}
      </div>
    </Card>
  );
};