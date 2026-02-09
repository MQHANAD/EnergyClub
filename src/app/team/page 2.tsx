'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { Committee, LeadershipPosition } from '@/types';
import { useI18n } from '@/i18n';
import { teamApi } from '@/lib/firestore';
import { getMembersUltraOptimized, HybridMember } from '@/lib/hybridMembers';
import LoadingSpinner from '@/components/register/LoadingSpinner';
import Navigation from '@/components/Navigation';
import { AlertCircle } from 'lucide-react';
import Footer from "@/components/landingPageUi/Footer";
import ScrollRevealWrapper from "@/components/landingPageUi/ScrollRevealWrapper";
import { logTeamView } from '@/lib/analytics';

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
  const [hybridMembers, setHybridMembers] = useState<HybridMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch committees, leadership positions, and hybrid members in parallel
        const [committeesData, leadershipData, membersData] = await Promise.all([
          teamApi.getCommitteesLight(),
          teamApi.getLeadershipPositions(),
          getMembersUltraOptimized()
        ]);

        setCommittees(committeesData);
        setLeadershipPositions(leadershipData);
        setHybridMembers(membersData);
        
        // Log team page view for analytics
        logTeamView();
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
      
      <Navigation />
      <ScrollRevealWrapper>
      {/* Hero Section */}
      <section className="bg-white pt-16 md:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center">
                            {/* <h1 className="text-4xl md:text-5xl font-light text-gray-900">
                {t('team.title')}
              </h1> */}
              <Image src="/energyWeekLogo.png" alt="KFUPM Energy Week" width={320} height={320} className="ml-4" />

            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <LeadershipSection 
          leadershipPositions={leadershipPositions} 
          committees={committees}
          hybridMembers={hybridMembers}
        />
      </Suspense>

      {/* Committees Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <CommitteesSection 
          committees={committees}
          hybridMembers={hybridMembers}
          hideHeader={true}
        />
      </Suspense>

      {/* Footer Spacing */}
      </ScrollRevealWrapper>
    </div>
  );
}
