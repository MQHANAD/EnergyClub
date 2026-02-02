'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { capitalizeName } from '@/lib/utils';
import LoadingSpinner from '@/components/register/LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MemberData {
    fullName: string;
    role: string;
    committeeName?: string;
    region?: string;
}

const MemberCard = React.forwardRef<HTMLDivElement, { memberData: MemberData, variant: 'view' | 'export' }>(({ memberData, variant }, ref) => {
    // 1. Determine "Leader" status
    const roleLower = memberData.role.toLowerCase();
    const isLeader = roleLower.includes('leader') || roleLower.includes('head') || roleLower.includes('president');

    // 2. Identify specific special roles
    const isPresident = roleLower === 'president';
    const isVicePresident = roleLower === 'vice president';

    // 3. Determine Region (default to Eastern if missing/unknown)
    const regionLower = (memberData.region || '').toLowerCase();
    let regionKey = 'eastern';
    if (regionLower.includes('riyadh')) regionKey = 'riyadh';
    else if (regionLower.includes('western') || regionLower.includes('jeddah')) regionKey = 'western';

    // 4. Select Background Image
    let bgImage = '/cards/easter-member.svg'; // Default fallback

    if (isPresident) {
        bgImage = '/cards/president.svg';
    } else if (isVicePresident) {
        bgImage = '/cards/vice-president.svg';
    } else {
        // Construct filename: card-[region]-[leader|member].jpg
        // e.g. card-riyadh-leader.jpg
        const suffix = isLeader ? 'leader' : 'member';

        // Handle the typo in the filename for eastern member if necessary, 
        // or just construct carefully.
        // Files: eastern-leader.svg, easter-member.svg (typo), riyadh-leader.svg, etc.

        if (regionKey === 'eastern' && !isLeader) {
            bgImage = '/cards/easter-member.svg';
        } else {
            bgImage = `/cards/${regionKey}-${suffix}.svg`;
        }
    }

    let displayText = memberData.committeeName || memberData.role;
    const isRole = !memberData.committeeName;

    // Fix "Leader of Leader of..." issue if committee name includes 'Team' etc.
    // The previous logic adding "Leader of" text:
    if (memberData.committeeName && isLeader && !isPresident && !isVicePresident) {
        // Handle "Vice Leader" exception
        if (roleLower.includes('vice leader')) {
            displayText = `Vice Leader ${displayText}`;
        } else {
            // Only add "Leader of" if it's a committee leader
            displayText = `Leader ${displayText}`;
        }
    }

    const getStyle = () => {
        // Special Roles (President/VP) - Use Gold
        if (isPresident || isVicePresident) {
            const color = '#f9bc00'; // Gold
            return {
                color,
                textShadow: `0 0 1.5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}`,
                fontSize: variant === 'export' ? '24px' : 'min(4.5vw, 1.5rem)', // Slightly bigger for single roles
                fontFamily: 'DGSahabah, sans-serif'
            };
        }

        // If it's just a Role with no committee (e.g. some admin role)
        if (isRole) {
            const color = '#f9bc00';
            return {
                color,
                textShadow: `0 0 1.5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}`,
                fontSize: variant === 'export' ? '20px' : 'min(3.5vw, 1.2rem)',
                fontFamily: 'DGSahabah, sans-serif'
            };
        }

        const lowerName = displayText.toLowerCase();

        let color = '#22d3ee'; // Default cyan

        if (lowerName.includes('pmo')) {
            color = '#a6a6a6';
        } else if (lowerName.includes('pr')) {
            color = '#6f23c7';
        } else if (lowerName.includes('tech')) {
            color = '#ff3131';
        } else if (lowerName.includes('operation') || lowerName.includes('logistic')) {
            color = '#cc8d57';
        } else if (lowerName.includes('event') || lowerName.includes('planing') || lowerName.includes('planning')) {
            color = '#26928e';
        } else if (lowerName.includes('market') || lowerName.includes('markting')) {
            color = '#ff66c4';
        }

        return {
            color,
            textShadow: `0 0 1.5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}`,
            fontSize: variant === 'export' ? '20px' : 'min(3.5vw, 1.2rem)',
            fontFamily: 'DGSahabah, sans-serif'
        };
    };

    const style = getStyle();

    const containerClasses = variant === 'view'
        ? "relative w-[min(90vw,calc((90vh-6rem)*595/842))] h-auto overflow-hidden md:mt-20 mt-8"
        : "relative w-[595px] h-[842px] overflow-hidden bg-[#181818]"; // Fixed size for export

    // Text Positioning Validation
    // President/VP usually have centered text, Members have it potentially lower?
    // The previous code had `mt-[35%]` for the role. We'll stick to that unless instructed otherwise.

    return (
        <div ref={ref} className={containerClasses}>
            {/* For export, use standard img tag to avoid next/image optimization issues on mobile capture */}
            {variant === 'export' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={bgImage}
                    alt="Membership Card"
                    className="object-cover w-full h-full absolute inset-0"
                />
            ) : (
                <Image
                    src={bgImage}
                    alt="Membership Card"
                    width={595}
                    height={842}
                    className="w-full h-auto object-cover"
                    priority
                />
            )}
            <div className="absolute inset-0 z-10">
                <div className="absolute top-[33%] inset-x-0 flex justify-center items-center px-[8%]">
                    <h1 className="text-white font-bold drop-shadow-md text-center"
                        style={{
                            fontSize: variant === 'export' ? '28px' : 'min(4vw, 1.4rem)',
                            fontFamily: 'DGSahabah, sans-serif'
                        }}>
                        {memberData.fullName}
                    </h1>
                </div>

                {!isPresident && !isVicePresident && (
                    <div className="absolute top-[64%] inset-x-0 flex justify-center items-center px-[8%]">
                        <p className="font-medium text-center"
                            style={style}>
                            {displayText}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
});
MemberCard.displayName = "MemberCard";

function MemberContent() {
    const { user, loading: authLoading } = useAuth();
    const [memberData, setMemberData] = useState<MemberData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const fetchMemberData = async () => {
            if (!user?.email) return;

            try {
                setIsLoading(true);
                const membersRef = collection(db, 'members');
                const q = query(membersRef, where('email', '==', user.email));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    let committeeName = '';

                    if (data.committeeId) {
                        try {
                            const committeeRef = doc(db, 'committees', data.committeeId);
                            const committeeDoc = await getDoc(committeeRef);
                            if (committeeDoc.exists()) {
                                committeeName = committeeDoc.data().name;
                            }
                        } catch (e) {
                            console.error('Error fetching committee:', e);
                        }
                    }

                    // Fetch user region from database or derive if not present
                    // Usually region is in 'members' collection or 'users'.
                    // Checking data.region:
                    const region = data.region || 'Eastern'; // Default to Eastern if missing

                    setMemberData({
                        fullName: capitalizeName(data.fullName),
                        role: data.role,
                        committeeName: committeeName,
                        region: region
                    });
                } else {
                    setError('Member profile not found.');
                }
            } catch (err) {
                console.error('Error fetching member data:', err);
                setError('Failed to load member data.');
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading && user) {
            fetchMemberData();
        }
    }, [user, authLoading]);


    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !memberData) {
        return (
            <div className="min-h-screen bg-white">
                <Navigation />
                <div className="pt-24 pb-8">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center py-12">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-light text-gray-900 mb-2">
                                Access Denied
                            </h1>
                            <p className="text-gray-600">
                                {error || 'You do not have permission to view this page.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // TEMPORARILY DISABLED - Member cards under maintenance
    return (
        <div className="h-[100dvh]">
            <Navigation colorScheme="dark" />
            <div className="min-h-screen flex items-center justify-center bg-[#181818] px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-light text-white mb-2">
                        Member Cards Temporarily Unavailable
                    </h1>
                    <p className="text-gray-400">
                        We're currently updating this feature. Please check back soon!
                    </p>
                </motion.div>
            </div>
        </div>
    );

    /* ORIGINAL CODE - Uncomment to re-enable member cards
    return (
        <div className="h-[100dvh]">
            <Navigation colorScheme="dark" />
            <div className="min-h-screen flex items-center justify-center bg-[#181818] px-4">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full flex items-center justify-center p-4 flex-col"
                >
                    <MemberCard memberData={memberData} variant="view" />
                </motion.div>

            </div>
        </div>
    );
    */
}

export default function MemberPage() {
    return (
        <AuthGuard requireAuth={true}>
            <MemberContent />
        </AuthGuard>
    );
}
