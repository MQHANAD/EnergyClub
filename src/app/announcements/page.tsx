"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { announcementsApi } from "@/lib/firestore";
import { Announcement } from "@/types";
import Navigation from "@/components/Navigation";
import LoadingSpinner from "@/components/register/LoadingSpinner";
import { Megaphone, Calendar } from "lucide-react";

export default function AnnouncementsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    // No redirect for unauthenticated users - existing effect removed

    // Load published announcements
    useEffect(() => {
        if (!authLoading) {
            loadAnnouncements();
        }
    }, [user, authLoading]);

    const loadAnnouncements = async () => {
        try {
            setLoading(true);
            const isGuest = !user;
            const data = await announcementsApi.getPublishedAnnouncements(isGuest);
            setAnnouncements(data);
        } catch (err) {
            console.error("Error loading announcements:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }).format(date);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // if (!user) return null; // Logic removed

    return (
        <div className="min-h-screen bg-white pt-16">
            <Navigation />

            <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#25818a]/10 mb-4">
                            <Megaphone className="h-7 w-7 text-[#25818a]" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Announcements
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Stay up to date with the latest news and updates
                        </p>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-20">
                            <Megaphone className="mx-auto h-16 w-16 text-gray-200" />
                            <h3 className="mt-6 text-xl font-medium text-gray-700">
                                No announcements yet
                            </h3>
                            <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                                Check back later for updates and news from the team.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {announcements.map((ann) => (
                                <article
                                    key={ann.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {/* Accent bar */}
                                    <div className="h-1 bg-gradient-to-r from-[#25818a] to-[#25818a]/60" />

                                    <div className="p-6">
                                        <h2 className="text-xl font-bold text-gray-900 mb-3">
                                            {ann.title}
                                        </h2>
                                        <div className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">
                                            {ann.body}
                                        </div>
                                        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100 text-sm text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {ann.publishedAt
                                                    ? formatDate(ann.publishedAt)
                                                    : formatDate(ann.createdAt)}
                                            </span>
                                            {ann.createdByName && (
                                                <>
                                                    <span className="text-gray-300">·</span>
                                                    <span>{ann.createdByName}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
