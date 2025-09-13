import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import sgMail from '@sendgrid/mail';

// Initialize Firebase Admin
admin.initializeApp();

// SendGrid setup with env fallback and safer error handling
const SENDGRID_KEY = process.env.SENDGRID_API_KEY || functions.config().sendgrid?.key;
if (!SENDGRID_KEY) {
  console.error('SendGrid API key missing. Set functions config sendgrid.key or env SENDGRID_API_KEY.');
} else {
  sgMail.setApiKey(SENDGRID_KEY);
}

const PRIMARY_FROM = functions.config().email?.from || process.env.EMAIL_FROM || 'noreply@EnergyHub.events';
const FALLBACK_FROM = process.env.SENDGRID_FALLBACK_FROM || 'noreply@EnergyHub.events';

const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Energy Hub';

const buildBrandedEmail = (bodyHtml: string, opts?: { title?: string }) => {
  const title = opts?.title || 'Energy Hub';
  const brandBg = '#25818a';
  const brandText = '#f8cd5c';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f6f7f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brandBg};">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:${brandText};">
          Energy Hub
        </div>
      </td>
    </tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111111;line-height:1.5;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
const normalizeFrom = (fromIn: any, emailDefault: string) => {
  if (typeof fromIn === 'string') {
    return { email: fromIn, name: FROM_NAME };
  }
  if (fromIn && typeof fromIn === 'object') {
    const email = (fromIn as any).email || emailDefault;
    const name = (fromIn as any).name || FROM_NAME;
    return { email, name };
  }
  return { email: emailDefault, name: FROM_NAME };
};

const safeSendEmail = async (msg: any) => {
  try {
    const initialFrom = normalizeFrom((msg as any).from || PRIMARY_FROM, PRIMARY_FROM);
    const message = { ...msg, from: initialFrom };
    await sgMail.send(message);
    return true;
  } catch (error: any) {
    const code = error?.code || error?.response?.statusCode;
    const body = error?.response?.body;
    console.error('SendGrid send error:', code, body);
    // Retry with fallback from if Sender Identity not verified or forbidden
    const currentFrom = (msg as any).from;
    const currentEmail = typeof currentFrom === 'string' ? currentFrom : currentFrom?.email;
    if (code === 403 && FALLBACK_FROM && currentEmail !== FALLBACK_FROM) {
      console.log(`Retrying with fallback from address: ${FALLBACK_FROM}`);
      const fallbackFrom = normalizeFrom(FALLBACK_FROM, FALLBACK_FROM);
      await sgMail.send({ ...msg, from: fallbackFrom });
      return true;
    }
    throw error;
  }
};

// Google Sheets setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const auth = new google.auth.GoogleAuth({
  scopes: SCOPES,
  credentials: {
    private_key: functions.config().google?.private_key?.replace(/\\n/g, '\n'),
    client_email: functions.config().google?.client_email,
  },
});

const sheets = google.sheets({ version: 'v4', auth });

// Types
interface Registration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  registrationTime: admin.firestore.Timestamp;
  status: 'confirmed' | 'waitlist' | 'cancelled';
  reason?: string;
  notes?: string;
  attendance?: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: admin.firestore.Timestamp;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  organizerId: string;
  organizerName: string;
  status: 'active' | 'cancelled' | 'completed';
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  tags: string[];
  imageUrl?: string;
}

// Email templates
const getRegistrationEmailTemplate = (userName: string, eventTitle: string) => `
Dear ${userName},

Thank you for your interest in "${eventTitle}"!

We have received your registration request and will review it shortly. You will receive another email once your registration has been approved.

Best regards,
University Club Team
`;

const getApprovalEmailTemplate = (userName: string, eventTitle: string) => `
Dear ${userName},

Great news! Your registration for "${eventTitle}" has been approved.

You are now confirmed to attend the event. We look forward to seeing you there!

Best regards,
University Club Team
`;

const getRejectionEmailTemplate = (userName: string, eventTitle: string) => `
Dear ${userName},

We’re sorry to inform you that your registration for "${eventTitle}" was not approved at this time.

If you believe this is a mistake or would like more information, please contact the event organizers. You can also explore other upcoming events on the platform.

Best regards,
University Club Team
`;

// Cloud Function: Send email on registration
export const sendOnRegisterEmail = functions.firestore
  .document('registrations/{registrationId}')
  .onCreate(async (snap, context) => {
    try {
      const registration = snap.data() as Registration;
      const eventDoc = await admin.firestore()
        .collection('events')
        .doc(registration.eventId)
        .get();

      if (!eventDoc.exists) {
        console.error('Event not found:', registration.eventId);
        return;
      }

      const event = eventDoc.data() as Event;

      const msg = {
        to: registration.userEmail,
        from: PRIMARY_FROM,
        subject: `Registration Received - ${event.title}`,
        text: getRegistrationEmailTemplate(registration.userName, event.title),
        html: buildBrandedEmail(`
          <h2 style="margin:0 0 12px 0;">Registration Received</h2>
          <p>Dear ${registration.userName},</p>
          <p>Thank you for your interest in <strong>"${event.title}"</strong>!</p>
          <p>We have received your registration request and will review it shortly. You will receive another email once your registration has been approved.</p>
          <p style="margin-top:16px;">Best regards,<br/>Energy Hub Team</p>
        `, { title: 'Registration Received' }),
      };

      console.log(`[registrations:onCreate] Sending registration email. id=${context.params.registrationId} to=${registration.userEmail}`);
      await safeSendEmail(msg);
      console.log(`[registrations:onCreate] Sent registration email. id=${context.params.registrationId} to=${registration.userEmail}`);

    } catch (error) {
      console.error('Error sending registration email:', error);
      throw error;
    }
  });

// Cloud Function: Send email on approval
export const sendOnApproveEmail = functions.firestore
  .document('registrations/{registrationId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data() as Registration;
      const after = change.after.data() as Registration;

      // Approval: status changed to 'confirmed'
      if (before.status !== 'confirmed' && after.status === 'confirmed') {
        const eventDoc = await admin.firestore()
          .collection('events')
          .doc(after.eventId)
          .get();

        if (!eventDoc.exists) {
          console.error('Event not found:', after.eventId);
          return;
        }

        const event = eventDoc.data() as Event;

        const msg = {
          to: after.userEmail,
          from: PRIMARY_FROM,
          subject: `Registration Approved - ${event.title}`,
          text: getApprovalEmailTemplate(after.userName, event.title),
          html: buildBrandedEmail(`
            <h2 style="margin:0 0 12px 0;">Registration Approved</h2>
            <p>Dear ${after.userName},</p>
            <p>Great news! Your registration for <strong>"${event.title}"</strong> has been approved.</p>
            <p>You are now confirmed to attend the event. We look forward to seeing you there!</p>
            <p style="margin-top:16px;">Best regards,<br/>Energy Hub Team</p>
          `, { title: 'Registration Approved' }),
        };

        console.log(`[registrations:onUpdate] Sending approval email. id=${context.params.registrationId} to=${after.userEmail}`);
        await safeSendEmail(msg);
        console.log(`[registrations:onUpdate] Sent approval email. id=${context.params.registrationId} to=${after.userEmail}`);

      // Rejection: status changed to 'cancelled'
      } else if (before.status !== 'cancelled' && after.status === 'cancelled') {
        const eventDoc = await admin.firestore()
          .collection('events')
          .doc(after.eventId)
          .get();

        if (!eventDoc.exists) {
          console.error('Event not found:', after.eventId);
          return;
        }

        const event = eventDoc.data() as Event;

        const msg = {
          to: after.userEmail,
          from: PRIMARY_FROM,
          subject: `Registration Rejected - ${event.title}`,
          text: getRejectionEmailTemplate(after.userName, event.title),
          html: buildBrandedEmail(`
            <h2 style="margin:0 0 12px 0;">Registration Rejected</h2>
            <p>Dear ${after.userName},</p>
            <p>We’re sorry to inform you that your registration for <strong>"${event.title}"</strong> was not approved at this time.</p>
            <p>If you believe this is a mistake or would like more information, please contact the event organizers.</p>
            <p>You can also explore other upcoming events on the platform.</p>
            <p style="margin-top:16px;">Best regards,<br/>Energy Hub Team</p>
          `, { title: 'Registration Rejected' }),
        };

        console.log(`[registrations:onUpdate] Sending rejection email. id=${context.params.registrationId} to=${after.userEmail}`);
        await safeSendEmail(msg);
        console.log(`[registrations:onUpdate] Sent rejection email. id=${context.params.registrationId} to=${after.userEmail}`);
      }

    } catch (error) {
      console.error('Error sending approval/rejection email:', error);
      throw error;
    }
  });

// Applications email helpers and triggers

type AppProgram = 'energy_week_2' | 'female_energy_club';
const programLabelForApp = (p: AppProgram): string =>
  p === 'energy_week_2' ? 'Energy Week 2' : 'Female Energy Club';

const getApplicationReceivedText = (userName: string, programLbl: string) => `
Dear ${userName},

Thank you for applying to "${programLbl}"!

We have received your application and our team will review it shortly. You will receive another email once a decision has been made.

Best regards,
University Club Team
`;


// Cloud Function: Send email on application create
export const sendOnApplicationCreateEmail = functions.firestore
  .document('applications/{applicationId}')
  .onCreate(async (snap) => {
    try {
      const app = snap.data() as any;
      const to = app?.email as string | undefined;
      const name = (app?.fullName as string | undefined) || 'Applicant';
      const program = ((app?.program as string) || 'energy_week_2') as AppProgram;
      const label = programLabelForApp(program);

      if (!to) {
        console.error('Application create: missing email address for', snap.id);
        return;
      }

      if (!SENDGRID_KEY || !PRIMARY_FROM) {
        console.warn(`[applications:onCreate] Missing SENDGRID_API_KEY or EMAIL_FROM. Skipping send. id=${snap.id}`);
        return;
      }

      const msg = {
        to,
        from: PRIMARY_FROM,
        subject: `Application Received - ${label}`,
        text: getApplicationReceivedText(name, label),
        html: buildBrandedEmail(`
          <h2 style="margin:0 0 12px 0;">Application Received</h2>
          <p>Dear ${name},</p>
          <p>Thank you for applying to <strong>"${label}"</strong>!</p>
          <p>We have received your application and our team will review it shortly. You will receive another email once a decision has been made.</p>
          <p style="margin-top:16px;">Best regards,<br/>Energy Hub Team</p>
        `, { title: 'Application Received' }),
      };

      console.log(`[applications:onCreate] Sending application received email. id=${snap.id} to=${to}`);
      await safeSendEmail(msg);
      console.log(`[applications:onCreate] Sent application received email. id=${snap.id} to=${to}`);
    } catch (error) {
      console.error('Error sending application received email:', error);
      throw error;
    }
  });

// Duplicate decision trigger removed to prevent double sends. Use onApplicationDecisionEmail only.

// Cloud Function: Export to Google Sheets
export const exportToSheets = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check if user is admin or organizer
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'User profile not found');
  }

  const user = userDoc.data();
  if (user?.role !== 'admin' && user?.role !== 'organizer') {
    throw new functions.https.HttpsError('permission-denied', 'User must be admin or organizer');
  }

  try {
    const { eventId, spreadsheetId } = data;

    if (!eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
    }

    // Get event details
    const eventDoc = await admin.firestore()
      .collection('events')
      .doc(eventId)
      .get();

    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const event = eventDoc.data() as Event;

    // Check if user is the organizer or admin
    if (user.role !== 'admin' && event.organizerId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'User must be the event organizer or admin');
    }

    // Get registrations for the event
    const registrationsSnapshot = await admin.firestore()
      .collection('registrations')
      .where('eventId', '==', eventId)
      .get();

    const registrations = registrationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Registration[];

    // Prepare data for Google Sheets
    const headers = ['Name', 'Email', 'Reason', 'Status', 'Timestamp'];
    const rows = registrations.map(reg => [
      reg.userName,
      reg.userEmail,
      reg.reason || '',
      reg.status,
      reg.registrationTime.toDate().toISOString()
    ]);

    const values = [headers, ...rows];

    // Use provided spreadsheet ID or create new one
    let targetSpreadsheetId = spreadsheetId;

    if (!targetSpreadsheetId) {
      // Create new spreadsheet
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `Event Registrations - ${event.title}`,
          },
        },
      });
      targetSpreadsheetId = spreadsheet.data.spreadsheetId!;
    }

    // Write data to sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: targetSpreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: values,
      },
    });

    console.log(`Exported ${registrations.length} registrations to Google Sheets`);

    return {
      success: true,
      spreadsheetId: targetSpreadsheetId,
      exportedCount: registrations.length,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/edit`
    };

  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    throw new functions.https.HttpsError('internal', 'Failed to export data');
  }
});
/**
 * Applications decision email notifier
 *
 * Local testing (Emulator):
 * 1) From repo root: cd functions && cp .env.example .env
 *    - Option A: Set SENDGRID_API_KEY and EMAIL_FROM to valid values to send real emails.
 *    - Option B: Leave SENDGRID_API_KEY or EMAIL_FROM unset to exercise the no-send early-exit path.
 * 2) npm run serve (runs build then starts Functions + Firestore emulator)
 * 3) In the Firestore Emulator, create a document under 'applications' with at minimum:
 *    { status: 'pending', email: 'applicant@example.com', fullName: 'First Last', programLabel: 'Energy Week 2' }
 * 4) Update that document's status from 'pending' to 'accepted' or 'rejected' to trigger this function.
 *    - The function logs the application id and decision, and sends an email only for pending -> accepted/rejected transitions.
 */

// Minimal type for the fields this function needs

// Firestore onUpdate trigger: applications/{id}
export const onApplicationDecisionEmail = functions.firestore
  .document('applications/{id}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const id = context.params.id;

    if (!after) {
      console.warn(`[applications:onDecision] No "after" data for id=${id}`);
      return;
    }

    const prev = (before?.status as string) || 'unknown';
    const curr = (after.status as string) || prev;

    if (prev === curr) {
      console.info(`[applications:onDecision] Status unchanged. id=${id} status=${curr}`);
      return;
    }

    if (!(curr === 'accepted' || curr === 'rejected')) {
      console.info(`[applications:onDecision] Status not accepted/rejected. id=${id} status=${curr}`);
      return;
    }

    if (prev !== 'pending') {
      console.info(`[applications:onDecision] Not a pending to accepted/rejected transition. id=${id} prev=${prev} curr=${curr}`);
      return;
    }

    const email = after.email as string | undefined;
    const name = after.fullName as string || 'Applicant';
    const programLabel = after.programLabel as string || 'Energy Club Program';
    const program = after.program as AppProgram;
    const contactEmail = "contact@energyhub.events";

    if (!email) {
      console.warn(`[applications:onDecision] Missing recipient email for id=${id}`);
      return;
    }

    if (!SENDGRID_KEY || !PRIMARY_FROM) {
      console.error('[applications:onDecision] Missing SENDGRID_KEY or PRIMARY_FROM.');
      return;
    }

    const subject =
      curr === 'accepted'
        ? `Congratulations! You have been accepted into ${programLabel}`
        : `Update on your ${programLabel} application`;

    const text =
      curr === 'accepted'
        ? program === 'female_energy_club'
          ? `Dear ${name},\n\nCongratulations! We are thrilled to inform you that your application for ${programLabel} has been accepted! 🎉\n\nFor more information, please contact us at ${contactEmail}.\n\nBest regards,\nEnergy Hub Team`
          : `Dear ${name},\n\nCongratulations! We are thrilled to inform you that your application for ${programLabel} has been accepted! 🎉\n\nYou will be assigned to a team and receive further details on next steps soon.\n\nFor more information, please contact us at ${contactEmail}.\n\nBest regards,\nEnergy Hub Team`
        : `Dear ${name},\n\nThank you for applying to ${programLabel}. Unfortunately, your application was not accepted at this time. We encourage you to reapply in the future.\n\nFor more information, please contact us at ${contactEmail}.\n\nBest regards,\nEnergy Hub Team`;

    const html = buildBrandedEmail(
      curr === 'accepted'
        ? program === 'female_energy_club'
          ? `<h2 style="margin:0 0 12px 0;">Congratulations! You have been accepted into ${programLabel}</h2>
             <p>Dear ${name},</p>
             <p>We are thrilled to inform you that your application for <strong>${programLabel}</strong> has been accepted! 🎉</p>
             <p>As a new member, you will have the opportunity to join committees and take on leadership roles within the club. Next steps include joining our WhatsApp group and attending the orientation session.</p>
             <p>For more information, please contact us at <a href="mailto:${contactEmail}">${contactEmail}</a>.</p>
             <p style="margin-top:16px;">Best regards,<br/>Energy Hub Team</p>`
          : `<h2 style="margin:0 0 12px 0;">Congratulations! You have been accepted into ${programLabel}</h2>
             <p>Dear ${name},</p>
             <p>We are thrilled to inform you that your application for <strong>${programLabel}</strong> has been accepted! 🎉</p>
             <p>You will be assigned to a team and receive further details on next steps soon.</p>
             <p>For more information, please contact us at <a href="mailto:${contactEmail}">${contactEmail}</a>.</p>
             <p style="margin-top:16px;">Best regards,<br/>Energy Hub Team</p>`
        : `<h2 style="margin:0 0 12px 0;">Update on your ${programLabel} application</h2>
           <p>Dear ${name},</p>
           <p>Thank you for applying to <strong>${programLabel}</strong>. Unfortunately, your application was not accepted at this time. We encourage you to reapply in the future.</p>
           <p>For more information, please contact us at <a href="mailto:${contactEmail}">${contactEmail}</a>.</p>
           <p style="margin-top:16px;">Best regards,<br/>Energy Hub Team</p>`,
      { title: curr === 'accepted' ? 'Application Accepted' : 'Application Update' }
    );

    const msg = {
      to: email,
      from: PRIMARY_FROM,
      subject,
      text,
      html,
    };

    console.log(`[applications:onDecision] Sending decision email. id=${id} to=${email} status=${curr}`);
    try {
      await safeSendEmail(msg);
      console.log(`[applications:onDecision] Sent decision email. id=${id} to=${email} status=${curr}`);
    } catch (err) {
      console.error(`[applications:onDecision] Failed to send email to ${email}.`, err);
    }
  });