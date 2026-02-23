'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { settingsApi } from '@/lib/firestore';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { capitalizeName } from '@/lib/utils';
import LoadingSpinner from '@/components/register/LoadingSpinner';
import { AlertCircle, Construction } from 'lucide-react';
import { motion } from 'framer-motion';

interface MemberData {
    fullName: string;
    role: string;
    committeeName?: string;
    regionId?: string;
}

const MemberCard = React.forwardRef<HTMLDivElement, { memberData: MemberData, variant: 'view' | 'export' }>(({ memberData, variant }, ref) => {
    // 1. Roles & Status
    const roleLower = memberData.role.toLowerCase().trim();
    const isPresident = roleLower === 'president';
    const isVicePresident = roleLower === 'vice president' || roleLower === 'vice_president';
    const isMember = roleLower === 'member';

    // 2. Region Logic
    const regionLower = (memberData.regionId || '').toLowerCase();
    let regionKey = 'eastern';
    if (regionLower.includes('riyadh')) regionKey = 'riyadh';
    else if (regionLower.includes('western') || regionLower.includes('jeddah')) regionKey = 'western';

    // 3. Background Mapping
    let bgImage = '/cards/eastern-card.svg';


    if (isPresident) bgImage = '/cards/president.svg';
    else if (isVicePresident) bgImage = '/cards/vice-president.svg';
    else if (regionKey === 'eastern' && isMember) bgImage = '/cards/eastern-card.svg';
    else bgImage = `/cards/${regionKey}-card.svg`;

    // 4. Construct Display Text (One clean line)
    let displayText = '';
    if (isPresident) displayText = 'President';
    else if (isVicePresident) displayText = 'Vice President';
    else if (isMember) displayText = memberData.committeeName || 'Member';
    else {
        const committee = memberData.committeeName || '';
        const role = memberData.role || '';

        // SPECIFIC RULE: Eastern Event Planning Custom Roles
        const isEasternEventPlanning = regionKey === 'eastern' && committee.toLowerCase().includes('event planning');
        const isStandardRole = roleLower === 'leader' || roleLower === 'vice leader' || roleLower === 'team leader' || roleLower === 'committee leader';

        if (isEasternEventPlanning && !isStandardRole) {
            displayText = role;
        } else {
            const cleanCommittee = committee.replace(/\s*team\s*/gi, '').trim();
            const capitalizedCommittee = capitalizeName(cleanCommittee);
            if (capitalizedCommittee) {
                const roleHasCommittee = role.toLowerCase().includes(capitalizedCommittee.toLowerCase());
                displayText = roleHasCommittee ? role : `${capitalizedCommittee} ${role}`;
            } else {
                displayText = role;
            }
        }
    }

    // 5. Get Color Style & Role Scaling
    const getStyle = () => {
        if (isPresident || isVicePresident || !memberData.committeeName) {
            const color = '#f9bc00';
            return {
                color,
                textShadow: `0 0 1.5px ${color}, 0 0 10px ${color}`,
                fontSize: variant === 'export' ? '30px' : 'min(5vw, 1.8rem)'
            };
        }

        const lower = displayText.toLowerCase();
        let color = '#22d3ee';
        if (lower.includes('pmo')) color = '#a6a6a6';
        else if (lower.includes('pr')) color = '#6f23c7';
        else if (lower.includes('tech')) color = '#ff3131';
        else if (lower.includes('operation') || lower.includes('logistic')) color = '#cc8d57';
        else if (lower.includes('event') || lower.includes('planning')) color = '#26928e';
        else if (lower.includes('market')) color = '#ff66c4';

        // Scale Role Font for long strings
        const len = displayText.length;
        let fontSize = variant === 'export' ? '26px' : 'min(5vw, 1.5rem)';
        if (len > 18) {
            const scale = 18 / len;
            fontSize = variant === 'export' ? `${Math.floor(26 * scale)}px` : `min(5vw, ${1.5 * scale}rem)`;
        }

        return {
            color,
            textShadow: `0 0 1.5px ${color}, 0 0 10px ${color}`,
            fontSize
        };
    };

    const style = getStyle();

    // 6. Name Scaling
    const getNameFontSize = () => {
        const len = memberData.fullName.length;
        if (len <= 15) return variant === 'export' ? '32px' : 'min(5vw, 1.6rem)';
        const scale = 15 / len;
        return variant === 'export' ? `${Math.floor(32 * scale)}px` : `min(5vw, ${1.6 * scale}rem)`;
    };

    const containerClasses = variant === 'view'
        ? "relative w-[min(90vw,calc((90vh-6rem)*595/842))] h-auto overflow-hidden md:mt-20 mt-8"
        : "relative w-[595px] h-[842px] overflow-hidden bg-[#181818]";

    return (
        <div ref={ref} className={containerClasses}>
            {variant === 'export' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bgImage} alt="Membership Card" className="object-cover w-full h-full absolute inset-0" />
            ) : (
                <Image src={bgImage} alt="Membership Card" width={595} height={842} className="w-full h-auto object-cover" priority />
            )}

            <div className="absolute inset-0 z-10 font-dgsahabah" style={{ fontFamily: 'DGSahabah, sans-serif' }}>
                {/* Name */}
                <div className="absolute top-[34.5%] inset-x-0 flex justify-center items-center px-[8%]">
                    <h1 className="text-white font-bold text-center" style={{ fontSize: getNameFontSize() }}>
                        {memberData.fullName}
                    </h1>
                </div>

                {/* Role/Committee Text (Single Line, positioned for the card space) */}
                <div className="absolute top-[64.5%] inset-x-0 flex justify-center items-center px-[8%]">
                    <p className="font-bold text-center leading-tight drop-shadow-lg" style={style}>
                        {displayText}
                    </p>
                </div>
            </div>
        </div>
    );
});
MemberCard.displayName = "MemberCard";

function MemberContent() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const [memberData, setMemberData] = useState<MemberData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pageEnabled, setPageEnabled] = useState<boolean | null>(null);


    useEffect(() => {
        const fetchMemberData = async () => {
            if (!user?.email) return;

            try {
                setIsLoading(true);

                const [querySnapshot, settings] = await Promise.all([
                    getDocs(query(collection(db, 'members'), where('email', '==', user.email))),
                    settingsApi.getWebsiteSettings(),
                ]);

                setPageEnabled(settings.memberPageEnabled);

                // Check if page is enabled
                if (!settings.memberPageEnabled) {
                    setIsLoading(false);
                    return;
                }

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

                    // Default to 'Eastern Province' if missing/undefined
                    const regionId = data.regionId || 'eastern-province';

                    setMemberData({
                        fullName: capitalizeName(data.fullName),
                        role: data.role,
                        committeeName: committeeName,
                        regionId: regionId
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
    }, [user, authLoading, isAdmin]);


    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // Show unavailable page if disabled
    if (pageEnabled === false) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navigation />
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Construction className="w-10 h-10 text-gray-400" />
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Page Unavailable</h1>
                        <p className="text-gray-500 leading-relaxed">
                            The Member Card page is currently unavailable. Please check back later.
                        </p>
                    </div>
                </div>
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

    // TEMPORARILY DISABLED - Member cards under maintenance (Redeploy trigger)
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
}

export default function MemberPage() {
    return (
        <AuthGuard requireAuth={true}>
            <MemberContent />
        </AuthGuard>
    );
}
