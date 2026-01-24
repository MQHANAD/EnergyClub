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
  const walletBaseUrl = process.env.NEXT_PUBLIC_FUNCTIONS_URL || '';

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

          {/* Wallet Buttons */}
          <div className="ticket-wallet-buttons">
            <a
              href={`${walletBaseUrl}/wallet/apple/${registration.id}`}
              className="wallet-button apple-wallet"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="wallet-icon">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Add to Apple Wallet
            </a>
            <a
              href={`${walletBaseUrl}/wallet/google/${registration.id}`}
              className="wallet-button google-wallet"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="wallet-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Add to Google Wallet
            </a>
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
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, ${BRAND_PRIMARY} 0%, #1a5f66 100%);
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

        .ticket-wallet-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 24px;
        }

        .wallet-button {
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
        }

        .wallet-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .wallet-icon {
          width: 20px;
          height: 20px;
        }

        .apple-wallet {
          background: #000000;
          color: #ffffff;
        }

        .google-wallet {
          background: #4285f4;
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
