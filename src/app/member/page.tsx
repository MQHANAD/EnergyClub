'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSpinner from '@/components/register/LoadingSpinner';
import { AlertCircle, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';

interface MemberData {
    fullName: string;
    role: string;
    committeeName?: string;
}

const MemberCard = React.forwardRef<HTMLDivElement, { memberData: MemberData, variant: 'view' | 'export' }>(({ memberData, variant }, ref) => {
    const isLeader = memberData.role.toLowerCase().includes('leader');
    const hasNoCommittee = !memberData.committeeName;
    const bgImage = (isLeader || hasNoCommittee) ? '/leaders.svg' : '/members.svg';

    let displayText = memberData.committeeName || memberData.role;
    const isRole = !memberData.committeeName;

    if (memberData.committeeName && memberData.role.toLowerCase().includes('leader')) {
        displayText = `Leader of ${displayText}`;
    }

    const getStyle = () => {
        if (isRole) {
            const color = '#f9bc00';
            return {
                color,
                textShadow: `0 0 1.5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}`,
                fontSize: variant === 'export' ? '20px' : '5cqw',
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
            fontSize: variant === 'export' ? '20px' : '5cqw',
            fontFamily: 'DGSahabah, sans-serif'
        };
    };

    const style = getStyle();

    const containerClasses = variant === 'view'
        ? "relative w-[min(90vw,calc((90vh-6rem)*595/842))] h-auto aspect-[595/842] overflow-hidden [container-type:size] md:mt-20 mt-8"
        : "relative w-[595px] h-[842px] overflow-hidden bg-[#181818]"; // Fixed size for export

    return (
        <div ref={ref} className={containerClasses}>
            {/* For export, usage standard img tag to avoid next/image optimization issues on mobile capture */}
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
                    fill
                    className="object-cover"
                    priority
                />
            )}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[8%] mt-[0%]">
                <h1 className="text-white font-bold drop-shadow-md"
                    style={{
                        fontSize: variant === 'export' ? '24px' : '5cqw', // approx 5cqw of 842px height is ~42px? No, 5cqw is based on width usually if container-type is inline-size. 
                        // If container-type: size, cqw is based on width. 595 * 0.05 = 29.75px. 
                        // Let's use 30px for committee (which was 5cqw) and maybe same for name?
                        // Original code had name at 5cqw too.
                        fontFamily: 'DGSahabah, sans-serif'
                    }}>
                    {memberData.fullName}
                </h1>

                <p className="font-medium mt-[35%]"
                    style={style}>
                    {displayText}
                </p>
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

                    setMemberData({
                        fullName: data.fullName,
                        role: data.role,
                        committeeName: committeeName
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

    // Ref for the export version of the card
    const exportCardRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!exportCardRef.current) return;
        try {
            const canvas = await html2canvas(exportCardRef.current, {
                scale: 1, // Reduced scale to avoid "too big" issues
                backgroundColor: null,
                useCORS: true,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                windowWidth: 1080 // Force desktop rendering context
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `energy-club-card-${memberData?.fullName || 'member'}.png`;
            link.click();
        } catch (err) {
            console.error("Download failed", err);
        }
    };

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
                    {/* View Version (Responsive) */}
                    <MemberCard memberData={memberData} variant="view" />

                    {/* <button
                        onClick={handleDownload}
                        className="mt-8 flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all duration-300 border border-white/20 group mb-16 cursor-pointer"
                    >
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Download Card</span>
                    </button> */}
                </motion.div>

                {/* Export Version (Hidden, Fixed Size, Outside Flow) */}
                <div className="fixed top-0 left-0 w-[595px] h-[842px] z-[-50] opacity-0 pointer-events-none">
                    <MemberCard memberData={memberData} variant="export" ref={exportCardRef} />
                </div>

            </div>
        </div>
    );
}

export default function MemberPage() {
    return (
        <AuthGuard>
            <MemberContent />
        </AuthGuard>
    );
}
