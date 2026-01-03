'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event, Registration } from '@/types';
import { TicketView } from '@/components/ticket/TicketView';

// Brand colors
const BRAND_PRIMARY = '#25818a';

interface TicketPageClientProps {
  registrationId: string;
}

/**
 * Error display component
 */
function TicketError({ type, status }: { type: string; status?: string }) {
  const errorConfig: Record<string, { icon: string; title: string; message: string }> = {
    not_found: {
      icon: '🎫',
      title: 'Ticket Not Found',
      message: 'We couldn\'t find a ticket with this ID. Please check your email for the correct link.',
    },
    invalid_status: {
      icon: '⏳',
      title: 'Ticket Not Ready',
      message: status === 'waitlist'
        ? 'Your registration is on the waitlist and has not been approved yet. You will receive an email when your ticket is ready.'
        : status === 'cancelled'
          ? 'This registration has been cancelled. Please contact the event organizers for more information.'
          : 'This ticket is not valid for entry.',
    },
    event_not_found: {
      icon: '📅',
      title: 'Event Not Found',
      message: 'The event associated with this ticket could not be found.',
    },
    loading: {
      icon: '⏳',
      title: 'Loading...',
      message: 'Fetching your ticket details...',
    },
  };

  const config = errorConfig[type] || errorConfig.not_found;

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${BRAND_PRIMARY} 0%, #1a5f66 100%)`,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        <span style={{ fontSize: '64px', display: 'block', marginBottom: '20px' }}>{config.icon}</span>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 12px 0' }}>{config.title}</h1>
        <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 28px 0' }}>{config.message}</p>
        {type !== 'loading' && (
          <a
            href="/"
            style={{
              display: 'inline-block',
              background: `linear-gradient(135deg, ${BRAND_PRIMARY} 0%, #1a5f66 100%)`,
              color: '#ffffff',
              textDecoration: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            Return to Home
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Client-side ticket page that fetches data from Firestore
 */
export function TicketPageClient({ registrationId }: TicketPageClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | undefined>();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch registration
        const regDoc = await getDoc(doc(db, 'registrations', registrationId));
        if (!regDoc.exists()) {
          setError('not_found');
          setLoading(false);
          return;
        }

        const regData = regDoc.data();
        const reg: Registration = {
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

        // Validate status
        if (reg.status !== 'confirmed' && reg.status !== 'checked_in') {
          setError('invalid_status');
          setStatus(reg.status);
          setLoading(false);
          return;
        }

        setRegistration(reg);

        // Fetch event
        const eventDoc = await getDoc(doc(db, 'events', reg.eventId));
        if (!eventDoc.exists()) {
          setError('event_not_found');
          setLoading(false);
          return;
        }

        const eventData = eventDoc.data();
        const evt: Event = {
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
        };

        setEvent(evt);
        setLoading(false);

      } catch (err) {
        console.error('Error fetching ticket data:', err);
        setError('not_found');
        setLoading(false);
      }
    }

    fetchData();
  }, [registrationId]);

  // Loading state
  if (loading) {
    return <TicketError type="loading" />;
  }

  // Error state
  if (error || !registration || !event) {
    return <TicketError type={error || 'not_found'} status={status} />;
  }

  // Show the ticket
  return <TicketView registration={registration} event={event} />;
}
