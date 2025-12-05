'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSpinner from '@/components/register/LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MemberData {
    fullName: string;
    role: string;
    committeeName?: string;
}

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

    const isLeader = memberData.role.toLowerCase().includes('leader');
    const bgImage = isLeader ? '/leaders.svg' : '/members.svg';

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            <div className="min-h-screen flex items-center justify-center bg-white px-4">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[90vw]"

                >
                    <div className="relative w-full max-w-[90vw] aspect-[3/4] bg-[#282828] rounded-3xl overflow-hidden shadow-2xl">

                        <Image
                            src={bgImage}
                            alt="Membership Card"
                            fill
                            className="object-contain"
                            priority
                        />
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
                            <h1 className="text-white font-bold drop-shadow-md
                                text-[clamp(16px,5vw,28px)] mb-2">
                                {memberData.fullName}
                            </h1>


                            <p className="text-blue-400 font-semibold drop-shadow-sm
                                text-[clamp(14px,4vw,22px)] mb-1">
                                {memberData.role}
                            </p>
                            {memberData.committeeName && (
                                <p className="text-cyan-400 font-medium drop-shadow-sm
                                text-[clamp(12px,3.5vw,20px)]">
                                    {memberData.committeeName}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

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
