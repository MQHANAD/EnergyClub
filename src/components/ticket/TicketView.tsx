'use client';

import { Event, Registration } from '@/types';
import { QRCodeDisplay } from './QRCodeDisplay';

// Brand colors (matching email design)
const BRAND_PRIMARY = '#25818a';
const BRAND_ACCENT = '#f8cd5c';

interface TicketViewProps {
  registration: Registration;
  event: Event;
}

/**
 * Format a date for display
 */
function formatEventDate(date: string | Date | undefined): string {
  if (!date) return 'TBA';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHmmssZ)
 */
function formatGoogleCalendarDate(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format date for ICS file (YYYYMMDDTHHmmssZ)
 */
function formatICSDate(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate Google Calendar URL
 */
function getGoogleCalendarUrl(event: Event, registration: Registration): string {
  const startDate = event.startDate || event.date;
  const endDate = event.endDate || startDate;

  const start = formatGoogleCalendarDate(startDate);
  const end = formatGoogleCalendarDate(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: `Ticket ID: ${registration.id}\nAttendee: ${registration.userName}\n\n${event.description || ''}`,
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate ICS file content and trigger download
 */
function downloadICSFile(event: Event, registration: Registration): void {
  const startDate = event.startDate || event.date;
  const endDate = event.endDate || startDate;

  const start = formatICSDate(startDate);
  const end = formatICSDate(endDate);

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Energy Hub//Ticket//EN
BEGIN:VEVENT
UID:${registration.id}@energyhub
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:Ticket ID: ${registration.id}\\nAttendee: ${registration.userName}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_ticket.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get status badge color and text
 */
function getStatusBadge(status: Registration['status']): { bg: string; text: string; label: string } {
  switch (status) {
    case 'confirmed':
      return { bg: '#10b981', text: '#ffffff', label: 'Confirmed' };
    case 'checked_in':
      return { bg: '#3b82f6', text: '#ffffff', label: 'Checked In ✓' };
    default:
      return { bg: '#6b7280', text: '#ffffff', label: status };
  }
}

/**
 * Premium digital ticket display component
 */
export function TicketView({ registration, event }: TicketViewProps) {
  const eventDate = formatEventDate(event.startDate || event.date);
  const statusBadge = getStatusBadge(registration.status);

  return (
    <div className="ticket-container">
      {/* Ticket Card */}
      <div className="ticket-card">
        {/* Header with gradient */}
        <div className="ticket-header">
          <span className="ticket-label">DIGITAL TICKET</span>
          <h1 className="ticket-event-title">{event.title}</h1>
          <div className="ticket-status-badge" style={{ backgroundColor: statusBadge.bg }}>
            {statusBadge.label}
          </div>
        </div>

        {/* Ticket Body */}
        <div className="ticket-body">
          {/* Attendee Info */}
          <div className="ticket-info-box">
            <span className="ticket-info-label">Attendee</span>
            <span className="ticket-info-value">{registration.userName}</span>
          </div>

          {/* Event Details Grid */}
          <div className="ticket-details-grid">
            <div className="ticket-info-box">
              <span className="ticket-info-label">📅 Date & Time</span>
              <span className="ticket-info-value-small">{eventDate}</span>
            </div>
            <div className="ticket-info-box">
              <span className="ticket-info-label">📍 Location</span>
              <span className="ticket-info-value-small">{event.location || 'TBA'}</span>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="ticket-divider" />

          {/* QR Code Section */}
          <div className="ticket-qr-section">
            <span className="ticket-qr-label">Scan for Check-In</span>
            <div className="ticket-qr-wrapper">
              <QRCodeDisplay data={registration.id} size={200} />
            </div>
            <span className="ticket-id">Ticket ID: {registration.id}</span>
          </div>

          {/* Calendar Buttons */}
          <div className="ticket-calendar-buttons">
            <a
              href={getGoogleCalendarUrl(event, registration)}
              target="_blank"
              rel="noopener noreferrer"
              className="calendar-button google-calendar"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="calendar-icon">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
              </svg>
              Add to Google Calendar
            </a>
            <button
              onClick={() => downloadICSFile(event, registration)}
              className="calendar-button apple-calendar"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="calendar-icon">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
              </svg>
              Add to Apple Calendar
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="ticket-footer">
          <p>Present this QR code at the event entrance for check-in.</p>
        </div>
      </div>

      {/* Logo */}
      <div className="ticket-branding">
        <span style={{ color: 'white', fontWeight: 700 }}>Energy Hub</span>
      </div>

      <style jsx>{`
        .ticket-container {
          min-height: 100vh;
          padding: 100px 16px 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a5e66dd, #1a5f66bb 100%);
        }

        .ticket-card {
          width: 100%;
          max-width: 400px;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .ticket-header {
          background: linear-gradient(135deg, ${BRAND_PRIMARY} 0%, #1a5f66 100%);
          padding: 28px 24px;
          text-align: center;
        }

        .ticket-label {
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .ticket-event-title {
          margin: 12px 0 16px;
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.3;
        }

        .ticket-status-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
        }

        .ticket-body {
          padding: 24px;
        }

        .ticket-info-box {
          background: #f9fafb;
          padding: 14px 16px;
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .ticket-info-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .ticket-info-value {
          display: block;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .ticket-info-value-small {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }

        .ticket-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .ticket-details-grid .ticket-info-box {
          margin-bottom: 0;
        }

        .ticket-divider {
          margin: 24px 0;
          border-top: 2px dashed #e5e7eb;
        }

        .ticket-qr-section {
          text-align: center;
        }

        .ticket-qr-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }

        .ticket-qr-wrapper {
          display: inline-block;
          padding: 12px;
          background: #ffffff;
          border: 4px solid ${BRAND_PRIMARY};
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .ticket-id {
          display: block;
          margin-top: 16px;
          font-size: 12px;
          color: #6b7280;
          font-family: monospace;
        }

        .ticket-calendar-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 24px;
        }

        .calendar-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          border: none;
          cursor: pointer;
        }

        .calendar-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .calendar-icon {
          width: 20px;
          height: 20px;
        }

        .google-calendar {
          background: #4285f4;
          color: #ffffff;
        }

        .apple-calendar {
          background: #000000;
          color: #ffffff;
        }

        .ticket-footer {
          padding: 16px 24px;
          background: #f9fafb;
          text-align: center;
        }

        .ticket-footer p {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
        }

        .ticket-branding {
          margin-top: 24px;
          text-align: center;
          font-size: 20px;
        }
      `}</style>
    </div>
  );
}
