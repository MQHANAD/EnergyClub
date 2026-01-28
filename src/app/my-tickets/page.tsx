'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Event, Registration } from '@/types';
import Link from 'next/link';
import { Ticket, Calendar, MapPin, ChevronRight } from 'lucide-react';
import Navigation from '@/components/Navigation';

// Brand colors
const BRAND_PRIMARY = '#25818a';

interface TicketWithEvent extends Registration {
    event?: Event;
}

function formatEventDate(date: string | Date | undefined): string {
    if (!date) return 'TBA';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function getStatusColor(status: Registration['status']): { bg: string; text: string } {
    switch (status) {
        case 'confirmed':
            return { bg: '#dcfce7', text: '#166534' };
        case 'checked_in':
            return { bg: '#dbeafe', text: '#1e40af' };
        case 'waitlist':
            return { bg: '#fef9c3', text: '#854d0e' };
        case 'cancelled':
            return { bg: '#fee2e2', text: '#dc2626' };
        default:
            return { bg: '#f3f4f6', text: '#374151' };
    }
}

export default function MyTicketsPage() {
    const { user, loading: authLoading } = useAuth();
    const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTickets() {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Fetch all registrations for this user
                const registrationsRef = collection(db, 'registrations');
                const q = query(registrationsRef, where('userId', '==', user.uid));
                const snapshot = await getDocs(q);

                const ticketsWithEvents: TicketWithEvent[] = [];

                for (const regDoc of snapshot.docs) {
                    const regData = regDoc.data();
                    const registration: Registration = {
                        id: regDoc.id,
                        eventId: regData.eventId,
                        userId: regData.userId,
                        userName: regData.userName,
                        userEmail: regData.userEmail,
                        registrationTime: regData.registrationTime?.toDate() || new Date(),
                        status: regData.status,
                        checkInTime: regData.checkInTime?.toDate(),
                        reason: regData.reason,
                        notes: regData.notes,
                        attendance: regData.attendance,
                        isFromUniversity: regData.isFromUniversity,
                        universityEmail: regData.universityEmail,
                        studentId: regData.studentId,
                    };

                    // Fetch the event details
                    try {
                        const eventDoc = await getDoc(doc(db, 'events', registration.eventId));
                        if (eventDoc.exists()) {
                            const eventData = eventDoc.data();
                            const event: Event = {
                                id: eventDoc.id,
                                title: eventData.title,
                                description: eventData.description,
                                status: eventData.status,
                                date: eventData.date?.toDate?.()?.toISOString() || eventData.date,
                                startDate: eventData.startDate?.toDate?.()?.toISOString() || eventData.startDate,
                                endDate: eventData.endDate?.toDate?.()?.toISOString() || eventData.endDate,
                                location: eventData.location,
                                tags: eventData.tags || [],
                                currentAttendees: eventData.currentAttendees || 0,
                                maxAttendees: eventData.maxAttendees || 0,
                                imageUrls: eventData.imageUrls || [],
                                requireStudentId: eventData.requireStudentId,
                                organizerId: eventData.organizerId || '',
                                organizerName: eventData.organizerName || '',
                                createdAt: eventData.createdAt?.toDate?.() || new Date(),
                                updatedAt: eventData.updatedAt?.toDate?.() || new Date(),
                            };
                            ticketsWithEvents.push({ ...registration, event });
                        } else {
                            ticketsWithEvents.push(registration);
                        }
                    } catch {
                        ticketsWithEvents.push(registration);
                    }
                }

                // Sort by registration time (newest first)
                ticketsWithEvents.sort((a, b) =>
                    new Date(b.registrationTime).getTime() - new Date(a.registrationTime).getTime()
                );

                setTickets(ticketsWithEvents);
            } catch (error) {
                console.error('Error fetching tickets:', error);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading) {
            fetchTickets();
        }
    }, [user, authLoading]);

    // Loading state
    if (authLoading || loading) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
                    <div className="max-w-2xl mx-auto">
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-32 bg-gray-200 rounded-xl"></div>
                            <div className="h-32 bg-gray-200 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
                    <div className="max-w-md mx-auto text-center">
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <Ticket className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Tickets</h1>
                            <p className="text-gray-600 mb-6">Please sign in to view your tickets</p>
                            <Link
                                href="/login?from=/my-tickets"
                                className="inline-block px-6 py-3 rounded-full font-medium text-white transition-all"
                                style={{ backgroundColor: BRAND_PRIMARY }}
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // No tickets
    if (tickets.length === 0) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
                    <div className="max-w-md mx-auto text-center">
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <Ticket className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Tickets Yet</h1>
                            <p className="text-gray-600 mb-6">
                                You haven&apos;t registered for any events yet. Browse our upcoming events to get started!
                            </p>
                            <Link
                                href="/events"
                                className="inline-block px-6 py-3 rounded-full font-medium text-white transition-all"
                                style={{ backgroundColor: BRAND_PRIMARY }}
                            >
                                Browse Events
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Show tickets
    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">My Tickets</h1>

                    <div className="space-y-4">
                        {tickets.map((ticket) => {
                            const statusColors = getStatusColor(ticket.status);
                            const isClickable = ticket.status === 'confirmed' || ticket.status === 'checked_in';

                            const TicketCard = (
                                <div
                                    className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all ${isClickable ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : ''
                                        }`}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-lg font-semibold text-gray-900 truncate">
                                                    {ticket.event?.title || 'Unknown Event'}
                                                </h2>

                                                <div className="mt-2 space-y-1.5">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                                                        <span>{formatEventDate(ticket.event?.startDate || ticket.event?.date)}</span>
                                                    </div>
                                                    {ticket.event?.location && (
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                                                            <span className="truncate">{ticket.event.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <span
                                                    className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                                                    style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                                                >
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                                {isClickable && (
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom accent bar */}
                                    <div
                                        className="h-1"
                                        style={{
                                            backgroundColor: isClickable ? BRAND_PRIMARY : '#e5e7eb'
                                        }}
                                    />
                                </div>
                            );

                            if (isClickable) {
                                return (
                                    <Link key={ticket.id} href={`/ticket/${ticket.id}`}>
                                        {TicketCard}
                                    </Link>
                                );
                            }

                            return <div key={ticket.id}>{TicketCard}</div>;
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
