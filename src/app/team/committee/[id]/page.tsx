'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Committee, Member } from '@/types';
import { useI18n } from '@/i18n';
import { teamApi } from '@/lib/firestore';
import LoadingSpinner from '@/components/register/LoadingSpinner';
import { MemberCard } from '@/components/team/MemberCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Users, AlertCircle } from 'lucide-react';

export default function CommitteePage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const committeeId = params.id as string;
  
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommittee = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const committeeData = await teamApi.getCommittee(committeeId);
        if (committeeData) {
          setCommittee(committeeData);
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
          <p className="mt-4 text-gray-600 font-light">
            {t('common.loading')}
          </p>
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
      {/* Header */}
      <section className="bg-white pt-16 md:pt-24 py-20">
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
              <Building2 className="w-12 h-12 mr-4 text-blue-600" />
              <h1 className="text-4xl md:text-5xl font-light text-gray-900">
                {committee.name}
              </h1>
            </div>
            {committee.description && (
              <p className="bg-[#25818a10] px-16 py-12 text-gray-700 text-center max-w-5xl mx-auto text-xl font-light rounded-3xl border border-gray-200">
                {committee.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Members Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <h2 className="text-4xl font-light text-gray-900">
                Committee Members
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
              Meet the dedicated members of the {committee.name} committee
            </p>
          </div>

          {/* Members Grid */}
          {committee.members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {committee.members.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
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
