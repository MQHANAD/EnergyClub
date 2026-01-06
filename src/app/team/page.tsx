"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { Committee, LeadershipPosition } from "@/types";
import { useI18n } from "@/i18n";
import { teamApi } from "@/lib/firestore";
import { getMembersUltraOptimized, HybridMember } from "@/lib/hybridMembers";
import LoadingSpinner from "@/components/register/LoadingSpinner";
import Navigation from "@/components/Navigation";
import { AlertCircle } from "lucide-react";
import Footer from "@/components/landingPageUi/Footer";
import ScrollRevealWrapper from "@/components/landingPageUi/ScrollRevealWrapper";
import { logTeamView } from "@/lib/analytics";

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
        console.error("Error fetching team data:", err);
        setError("Failed to load team data. Please try again later.");
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
            <p className="text-gray-600 mb-6 font-light">{error}</p>
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
                <Image
                  src="/ksa-energy-week-logo.png"
                  alt="KSA Energy Week"
                  width={350}
                  height={175}
                  className="object-contain"
                  priority
                />
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

        {/* Decorative Banner */}
        {/* Decorative Banner */}
        <div
          className="w-full h-12 md:h-16 relative my-8"
          style={{
            backgroundImage: 'url(/energy-week-banner.png?v=2)',
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'auto 100%',
            backgroundPosition: 'center'
          }}
        />


        {/* Regional Sections */}
        {/* Eastern Province (Default) */}
        <Suspense fallback={<LoadingSpinner />}>
          <CommitteesSection
            committees={committees}
            hybridMembers={hybridMembers}
            title="Eastern Province"
            sectionLogo="/eastern-logo.png"
          />
        </Suspense>


        {/* Decorative Banner */}
        <div
          className="w-full h-12 md:h-16 relative my-8"
          style={{
            backgroundImage: 'url(/energy-week-banner.png?v=3)',
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'auto 100%',
            backgroundPosition: 'center'
          }}
        />

        {/* Riyadh Region */}
        <Suspense fallback={<LoadingSpinner />}>
          <CommitteesSection
            committees={[]}
            hybridMembers={hybridMembers}
            title="Riyadh Region"
            sectionLogo="/riyadh-logo.png"
          />
        </Suspense>

        {/* Decorative Banner */}
        <div
          className="w-full h-12 md:h-16 relative my-8"
          style={{
            backgroundImage: 'url(/energy-week-banner.png?v=3)',
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'auto 100%',
            backgroundPosition: 'center'
          }}
        />

        {/* Western Region */}
        <Suspense fallback={<LoadingSpinner />}>
          <CommitteesSection
            committees={[]}
            hybridMembers={hybridMembers}
            title="Western Region"
            sectionLogo="/western-logo.png"
          />
        </Suspense>

        {/* Footer Spacing */}
      </ScrollRevealWrapper>
    </div>
  );
}
