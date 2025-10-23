'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Committee, LeadershipPosition } from '@/types';
import { useI18n } from '@/i18n';
import { teamApi } from '@/lib/firestore';
import LoadingSpinner from '@/components/register/LoadingSpinner';
import { Users, AlertCircle } from 'lucide-react';

// Lazy load heavy components for better performance
const LeadershipSection = React.lazy(() => 
  import('@/components/team/LeadershipSection').then(module => ({ default: module.LeadershipSection }))
);
const CommitteesSection = React.lazy(() => 
  import('@/components/team/CommitteesSection').then(module => ({ default: module.CommitteesSection }))
);

export default function TeamPage() {
  const { t } = useI18n();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [leadershipPositions, setLeadershipPositions] = useState<LeadershipPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch committees and leadership positions in parallel
        const [committeesData, leadershipData] = await Promise.all([
          teamApi.getCommittees(),
          teamApi.getLeadershipPositions()
        ]);

        setCommittees(committeesData);
        setLeadershipPositions(leadershipData);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 font-light">
              {t('common.loading')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-light text-gray-900 mb-2">
              Error Loading Team
            </h2>
            <p className="text-gray-600 mb-6 font-light">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-white pt-16 md:pt-24 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Users className="w-12 h-12 mr-4 text-gray-700" />
              <h1 className="text-4xl md:text-5xl font-light text-gray-900">
                {t('team.title')}
              </h1>
            </div>
            <p className="bg-[#25818a10] px-16 py-12 text-gray-700 text-center max-w-5xl mx-auto text-xl font-light rounded-3xl border border-gray-200">
              {t('team.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <LeadershipSection leadershipPositions={leadershipPositions} committees={committees} />
      </Suspense>

      {/* Committees Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <CommitteesSection committees={committees} />
      </Suspense>

      {/* Footer Spacing */}
      <div className="py-16"></div>
    </div>
  );
}
