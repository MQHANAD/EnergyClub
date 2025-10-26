'use client';

import React from 'react';
import { Member } from '@/types';
import { useI18n } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, User, Crown } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

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

  // Safety check for undefined member
  if (!member) {
    console.warn('MemberCard: member is undefined');
    return null;
  }

  return (
    <Card className={`group overflow-visible transition-all duration-500 ease-out hover:shadow-xl hover:scale-[1.03] bg-white border border-gray-200 ${className}`}>
      <div className="relative">
        {/* Leadership Badge */}
        {isLeadership && (
          <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg z-10">
            <Crown className="w-5 h-5 text-white" />
          </div>
        )}
        
        {/* Full-size Image */}
        <div className="relative h-96 w-full overflow-hidden md:filter md:grayscale md:saturate-0 transition-all duration-1000 ease-in-out md:group-hover:grayscale-0 md:group-hover:saturate-100">
          <OptimizedImage
            src={member.profilePicture || '/avatar.png'}
            alt={member.fullName}
            className="w-full h-full object-cover"
            fallbackText={member.fullName}
            size={150}
            loading="lazy"
          />

          {/* Overlay with Member Info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-1000 ease-in-out group-hover:opacity-100">
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-lg font-light text-white mb-1">
                {member.fullName}
              </h3>
              <p className="text-sm text-gray-200 font-light mb-3">
                {(() => {
                  const role = (member.role || '').trim();
                  const isLeader = role.toLowerCase() === 'leader' || role.toLowerCase() === 'committee leader' || role.toLowerCase() === 'team leader';
                  if (isLeader) {
                    const committeeName = (member as any).committeeName as string | undefined;
                    return committeeName ? `Leader of ${committeeName}` : 'Leader';
                  }
                  return role || 'Member';
                })()}
              </p>
              
              {/* LinkedIn Link */}
              <div className="flex gap-2">
                {member.linkedInUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30 hover:border-white/60 hover:text-white"
                    onClick={() => window.open(member.linkedInUrl as string, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t('team.member.linkedIn')}
                  </Button>
                )}
                {member.portfolioUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30 hover:border-white/60 hover:text-white"
                    onClick={() => window.open(member.portfolioUrl as string, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t('team.member.portfolio')}
                  </Button>
                )}
              </div>

              {/* Fallback for no LinkedIn */}
              {!member.linkedInUrl && !member.portfolioUrl && (
                <div className="flex items-center text-gray-300 text-sm">
                  <User className="w-4 h-4 mr-2" />
                  {t('team.member.noLinks')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};