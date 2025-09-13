import * as functions from 'firebase-functions';
export declare const sendOnRegisterEmail: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const sendOnApproveEmail: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
export declare const sendOnApplicationCreateEmail: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const exportToSheets: functions.HttpsFunction & functions.Runnable<any>;
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
export declare const onApplicationDecisionEmail: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
