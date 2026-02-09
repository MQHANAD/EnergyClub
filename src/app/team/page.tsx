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
      {/* Hero Section */}
      <section className="bg-white pt-16 md:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center">
              <Image
                src="/EW.svg"
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
          backgroundImage: 'url(/Banner.svg?v=2)',
          backgroundRepeat: 'repeat-x',
          backgroundSize: 'auto 100%',
          backgroundPosition: 'center'
        }}
      />



      <Suspense fallback={<LoadingSpinner />}>
        <CommitteesSection
          committees={committees.filter(c => c.regionId === 'eastern_province')}
          hybridMembers={hybridMembers.filter(m => {
            // Use explicit roleType and regionId instead of string matching
            const isGlobalLeader = m.roleType === 'global_leader';
            const isEasternRegion = m.regionId === 'eastern_province';
            return !isGlobalLeader && isEasternRegion;
          })}
          region="Eastern Province"
          sectionLogo="/east.svg"
        />
      </Suspense>


      {/* Decorative Banner */}
      <div
        className="w-full h-12 md:h-16 relative my-8"
        style={{
          backgroundImage: 'url(/Banner.svg?v=3)',
          backgroundRepeat: 'repeat-x',
          backgroundSize: 'auto 100%',
          backgroundPosition: 'center'
        }}
      />

      {/* Riyadh Region */}
      <Suspense fallback={<LoadingSpinner />}>
        {(() => {
          // Use regionId instead of string matching
          const riyadhMembers = hybridMembers.filter(m => m.regionId === 'riyadh_region');
          // Use roleType to identify regional leaders, but exclude regional managers/organizers
          const riyadhLeaders = riyadhMembers.filter(m => {
            if (m.roleType !== 'regional_leader') return false;
            const role = m.role?.trim().toLowerCase() || '';
            // Exclude regional managers and organizers - they appear in committees only
            return !role.includes('regional manager') && 
                   !role.includes('regional organizer') && 
                   !role.includes('regional leader');
          });
          const riyadhCommitteeMembers = riyadhMembers.filter(m => m.roleType === 'member');

          return (
            <div className="py-20">
              {/* Regional Header */}
              <div className="text-center mb-8 px-4">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-56 h-32">
                    <Image
                      src="/riyadh.svg"
                      alt="Riyadh Region"
                      fill
                      className="object-contain mix-blend-multiply"
                    />
                  </div>
                </div>
              </div>

              {riyadhLeaders.length > 0 && (
                <LeadershipSection
                  leadershipPositions={[]}
                  committees={[]}
                  hybridMembers={[]}
                  customLeaders={riyadhLeaders}
                  customTitle="Leaders"
                  className="pb-0"
                />
              )}
              <CommitteesSection
                committees={committees.filter(c => c.regionId === 'riyadh_region')}
                hybridMembers={riyadhCommitteeMembers}
                region="Riyadh Region"
                hideHeader={true}
                className={riyadhLeaders.length > 0 ? "pt-10" : ""}
              />
            </div>
          );
        })()}
      </Suspense>

      {/* Decorative Banner */}
      <div
        className="w-full h-12 md:h-16 relative my-8"
        style={{
          backgroundImage: 'url(/Banner.svg?v=3)',
          backgroundRepeat: 'repeat-x',
          backgroundSize: 'auto 100%',
          backgroundPosition: 'center'
        }}
      />

      {/* Western Region */}
      <Suspense fallback={<LoadingSpinner />}>
        {(() => {
          // Use regionId instead of string matching
          const westernMembers = hybridMembers.filter(m => m.regionId === 'western_region');
          // Use roleType to identify regional leaders, but exclude regional managers/organizers
          const westernLeaders = westernMembers.filter(m => {
            if (m.roleType !== 'regional_leader') return false;
            const role = m.role?.trim().toLowerCase() || '';
            // Exclude regional managers and organizers - they appear in committees only
            return !role.includes('regional manager') && 
                   !role.includes('regional organizer') && 
                   !role.includes('regional leader');
          });
          const westernCommitteeMembers = westernMembers.filter(m => m.roleType === 'member');

          return (
            <div className="py-20">
              {/* Regional Header */}
              <div className="text-center mb-8 px-4">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-56 h-32">
                    <Image
                      src="/west.svg"
                      alt="Western Region"
                      fill
                      className="object-contain mix-blend-multiply"
                    />
                  </div>
                </div>
              </div>

              {westernLeaders.length > 0 && (
                <LeadershipSection
                  leadershipPositions={[]}
                  committees={[]}
                  hybridMembers={[]}
                  customLeaders={westernLeaders}
                  customTitle="Leaders"
                  className="pb-0"
                />
              )}
              <CommitteesSection
                committees={committees.filter(c => c.regionId === 'western_region')}
                hybridMembers={westernCommitteeMembers}
                region="Western Region"
                hideHeader={true}
                className={westernLeaders.length > 0 ? "pt-10" : ""}
              />
            </div>
          );
        })()}
      </Suspense>

      {/* Footer Spacing */}
      <Footer />
    </div>
  );
}
