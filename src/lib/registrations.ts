import { auth, db, storage } from '@/lib/firebase';
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
  UploadMetadata,
} from 'firebase/storage';
import { signInAnonymously, setPersistence, inMemoryPersistence } from 'firebase/auth';
import type { ApplicationInput, Program } from '@/lib/registrationSchemas';
import { programLabelFor } from '@/lib/registrationSchemas';
import type { Application } from '@/types';


// ===== Types =====

export type CreateApplicationInput = Omit<ApplicationInput, 'cvFile' | 'designFile'>;

export interface UpdateUrlsInput {
  cvUrl?: string;
  designFileUrl?: string;
  designLink?: string;
  cvPath?: string;
  designFilePath?: string;
}

// ===== Firestore Operations =====

export async function createApplication(data: CreateApplicationInput): Promise<string> {


  const base = {
    program: data.program,
    programLabel: programLabelFor(data.program as Program),
    fullName: data.fullName.trim(),
    email: data.email.trim(),
    kfupmId: data.kfupmId.trim(),
    mobile: data.mobile.trim(),
    academicYear: data.academicYear,
    committees: [...data.committees],
    leadershipInterest: !!data.leadershipInterest,
    leadershipChoices: data.leadershipInterest
      ? (data.leadershipChoices ?? []).map((c) => ({
          choice: c.choice,
          team: c.team,
          why: c.why ? c.why.trim() : null,
        }))
      : [],
    previous: data.previous?.toString().trim() || null,
    competitions: data.competitions?.toString().trim() || null,
    energy: data.energy?.toString().trim() || null,
    linkedIn: data.linkedIn?.toString().trim() || null,
    designLink: data.designLink?.toString().trim() || null,
    selectedCommittee: data.selectedCommittee || null,
    cvUrl: null as string | null,
    designFileUrl: null as string | null,
    cvPath: null as string | null,
    designFilePath: null as string | null,
    status: 'pending' as const,
    submittedAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    decidedAt: null as Timestamp | null,
    decidedBy: null as string | null,
    adminNotes: null as string | null,
    createdBy: auth.currentUser?.uid || null,
    createdByType: (auth.currentUser?.isAnonymous ? 'anonymous' : 'authenticated') as 'anonymous' | 'authenticated',
  };

  const col = collection(db, 'applications');
  const created = await addDoc(col, base);
  return created.id;
}

export async function updateApplicationUrls(
  applicationId: string,
  updates: UpdateUrlsInput
): Promise<void> {
  console.log(`[updateApplicationUrls] Starting update for application ${applicationId}`, {
    updates,
    authUser: auth.currentUser?.uid,
    isAnonymous: auth.currentUser?.isAnonymous,
    authToken: auth.currentUser ? 'present' : 'null'
  });

  return retryWithBackoff(async () => {
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (typeof updates.cvUrl === 'string') payload.cvUrl = updates.cvUrl;
    if (typeof updates.designFileUrl === 'string') payload.designFileUrl = updates.designFileUrl;
    if (typeof updates.cvPath === 'string') payload.cvPath = updates.cvPath;
    if (typeof updates.designFilePath === 'string') payload.designFilePath = updates.designFilePath;
    if (updates.designLink === undefined) {
      // no-op
    } else if (updates.designLink === null) {
      payload.designLink = null;
    } else {
      payload.designLink = updates.designLink;
    }

    console.log(`[updateApplicationUrls] Attempting updateDoc with payload:`, payload);

    try {
      await updateDoc(doc(db, 'applications', applicationId), payload);
      console.log(`[updateApplicationUrls] Successfully updated document ${applicationId}`);
    } catch (error) {
      console.error(`[updateApplicationUrls] updateDoc failed for ${applicationId}:`, error);
      throw error;
    }
  }, 3, 1000, `updateApplicationUrls(${applicationId})`);
}

/**
 * Validate that URLs were successfully saved to Firestore
 */
export async function validateApplicationUrls(
  applicationId: string,
  expectedUrls: { cvUrl?: string; designFileUrl?: string; designLink?: string }
): Promise<{ isValid: boolean; missingUrls: string[]; errors: string[] }> {
  try {
    const docRef = doc(db, 'applications', applicationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        isValid: false,
        missingUrls: ['document'],
        errors: ['Application document not found']
      };
    }

    const data = docSnap.data();
    const missingUrls: string[] = [];
    const errors: string[] = [];

    // Check CV URL
    if (expectedUrls.cvUrl && data?.cvUrl !== expectedUrls.cvUrl) {
      missingUrls.push('cvUrl');
      errors.push(`CV URL not saved correctly. Expected: ${expectedUrls.cvUrl}, Found: ${data?.cvUrl}`);
    }

    // Check design file URL
    if (expectedUrls.designFileUrl && data?.designFileUrl !== expectedUrls.designFileUrl) {
      missingUrls.push('designFileUrl');
      errors.push(`Design file URL not saved correctly. Expected: ${expectedUrls.designFileUrl}, Found: ${data?.designFileUrl}`);
    }

    // Check design link
    if (expectedUrls.designLink !== undefined && data?.designLink !== expectedUrls.designLink) {
      missingUrls.push('designLink');
      errors.push(`Design link not saved correctly. Expected: ${expectedUrls.designLink}, Found: ${data?.designLink}`);
    }

    return {
      isValid: missingUrls.length === 0,
      missingUrls,
      errors
    };
  } catch (error: any) {
    const classified = classifyError(error);
    return {
      isValid: false,
      missingUrls: ['validation'],
      errors: [`Failed to validate URLs: ${classified.message}`]
    };
  }
}

// ===== Storage Uploads =====

const MAX_BYTES = 10 * 1024 * 1024; // 10 MiB

const CV_ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const DESIGN_ALLOWED = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);

function assertSize(file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error('File too large. Max size is 10 MB.');
  }
}

function extFromNameOrType(file: File, fallback: string): string {
  const name = file.name || '';
  const dot = name.lastIndexOf('.');
  if (dot !== -1 && dot < name.length - 1) {
    return name.substring(dot + 1).toLowerCase();
  }
  // From type
  const type = file.type || '';
  if (type === 'application/pdf') return 'pdf';
  if (type === 'application/msword') return 'doc';
  if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (type === 'image/png') return 'png';
  if (type === 'image/jpeg') return 'jpg';
  return fallback;
}

/**
 * Build a deterministic Storage path for this application file.
 * Always matches the same naming used by uploadCv/uploadDesign.
 */
export function buildStoragePath(applicationId: string, file: File, kind: 'cv' | 'design'): string {
  const ext = extFromNameOrType(file, 'pdf');
  const safeKind = kind === 'cv' ? 'cv' : 'design';
  return `applications/${applicationId}/${safeKind}.${ext}`;
}

/**
 * Optional progress callback type (0-100)
 */
export type ProgressCallback = (percent: number) => void;

/**
 * Error classification utilities for upload operations
 */
export enum ErrorType {
  RECOVERABLE = 'recoverable',
  CRITICAL = 'critical',
  NETWORK = 'network',
  AUTH = 'auth',
  AD_BLOCK = 'ad_block',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown'
}

export interface ClassifiedError {
  type: ErrorType;
  originalError: any;
  message: string;
  isRetryable: boolean;
  userMessage: string;
}

/**
 * Classify an error based on its message and properties
 */
function classifyError(error: any): ClassifiedError {
  const message = String(error?.message || error || '');
  const code = error?.code || '';

  // Ad-block errors
  if (/ERR_BLOCKED_BY_CLIENT/i.test(message) || /blocked by client/i.test(message)) {
    return {
      type: ErrorType.AD_BLOCK,
      originalError: error,
      message,
      isRetryable: false, // Ad-block is not recoverable via retry
      userMessage: 'File upload was blocked by browser extensions. Please disable ad-blockers and try again.'
    };
  }

  // Network errors
  if (/network/i.test(message) || /timeout/i.test(message) || /connection/i.test(message) ||
      code === 'unavailable' || code === 'deadline-exceeded') {
    return {
      type: ErrorType.NETWORK,
      originalError: error,
      message,
      isRetryable: true,
      userMessage: 'Network connection issue. Please check your internet connection and try again.'
    };
  }

  // Authentication errors
  if (/auth/i.test(message) || /permission/i.test(message) || /unauthorized/i.test(message) ||
      code === 'permission-denied' || code === 'unauthenticated') {
    return {
      type: ErrorType.AUTH,
      originalError: error,
      message,
      isRetryable: true,
      userMessage: 'Authentication issue. Please refresh the page and try again.'
    };
  }

  // File size/type validation errors
  if (/size/i.test(message) || /type/i.test(message) || /invalid/i.test(message)) {
    return {
      type: ErrorType.CRITICAL,
      originalError: error,
      message,
      isRetryable: false,
      userMessage: message
    };
  }

  // Default to recoverable for unknown errors
  return {
    type: ErrorType.UNKNOWN,
    originalError: error,
    message,
    isRetryable: true,
    userMessage: 'An unexpected error occurred. Please try again.'
  };
}

/**
 * Generic retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const classified = classifyError(error);

      console.warn(`${operationName} attempt ${attempt}/${maxRetries} failed:`, {
        error: classified.message,
        type: classified.type,
        retryable: classified.isRetryable
      });

      // Don't retry if error is not retryable or this is the last attempt
      if (!classified.isRetryable || attempt === maxRetries) {
        throw classified;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`${operationName} retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw classifyError(lastError);
}

/**
 * Retry getDownloadURL with exponential backoff to handle various network issues.
 */
async function getDownloadURLWithRetry(ref: any, maxRetries: number = 3): Promise<string> {
  return retryWithBackoff(
    () => getDownloadURL(ref),
    maxRetries,
    1000,
    'getDownloadURL'
  );
}

/**
 * Upload via Firebase Storage resumable uploads with metadata, optional progress, and retry logic.
 * Returns the public download URL upon completion.
 */
async function uploadResumableWithProgress(
  path: string,
  file: File,
  metadata: UploadMetadata,
  onProgress?: ProgressCallback
): Promise<string> {
  return retryWithBackoff(async () => {
    const ref = storageRef(storage, path);
    const task = uploadBytesResumable(ref, file, metadata);

    await new Promise<void>((resolve, reject) => {
      task.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            const percent = snapshot.totalBytes
              ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
              : 0;
            onProgress(percent);
          }
        },
        (error) => reject(error),
        () => resolve()
      );
    });

    return await getDownloadURLWithRetry(ref);
  }, 3, 1000, `upload(${path})`);
}

export async function uploadCv(
  applicationId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error('Invalid CV file.');
  }
  assertSize(file);
  if (!CV_ALLOWED.has(file.type)) {
    throw new Error('Invalid CV type. Allowed: PDF, DOC, DOCX.');
  }
  const ext = extFromNameOrType(file, 'pdf');
  const path = `applications/${applicationId}/cv.${ext}`;
  const metadata: UploadMetadata = { contentType: file.type || 'application/octet-stream' };
  return await uploadResumableWithProgress(path, file, metadata, onProgress);
}

export async function uploadDesign(
  applicationId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error('Invalid design file.');
  }
  assertSize(file);
  if (!DESIGN_ALLOWED.has(file.type)) {
    throw new Error('Invalid design type. Allowed: PDF, PNG, JPG/JPEG.');
  }
  const ext = extFromNameOrType(file, 'pdf');
  const path = `applications/${applicationId}/design.${ext}`;
  const metadata: UploadMetadata = { contentType: file.type || 'application/octet-stream' };
  return await uploadResumableWithProgress(path, file, metadata, onProgress);
}

// ===== High-level Submit Flow (optional helper) =====
// Consumers (forms) should:
// 1) await ensureAuth()
// 2) validate with zod
// 3) const id = await createApplication(dataWithoutFiles)
// 4) optionally upload files and collect URLs
// 5) await updateApplicationUrls(id, urls)

// ===== Admin/List helpers for Applications =====

// Safe conversion from Firestore Timestamp/number/string to Date
function hasToDate(v: unknown): v is { toDate: () => Date } {
  return typeof v === 'object' && v !== null && typeof (v as any).toDate === 'function';
}
function tsToDate(v: unknown): Date {
  if (hasToDate(v)) return (v as any).toDate();
  if (typeof v === 'number' || typeof v === 'string') return new Date(v as any);
  return new Date();
}

/**
 * Fetch all applications ordered by submittedAt desc.
 * For large datasets, consider adding pagination.
 */
export async function listApplications(): Promise<Application[]> {
  const q = query(collection(db, 'applications'), orderBy('submittedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data() as Record<string, unknown>;
    const program = (data?.program as Application['program']) ?? 'energy_week_2';
    const programLabel = (data?.programLabel as string) ?? (program === 'energy_week_2' ? 'Energy Week 2' : 'Female Energy Club');
    const app: Application = {
      id: d.id,
      program,
      programLabel,
      fullName: (data?.fullName as string) ?? '',
      email: (data?.email as string) ?? '',
      kfupmId: (data?.kfupmId as string) ?? '',
      mobile: (data?.mobile as string) ?? '',
      academicYear: (data?.academicYear as Application['academicYear']) ?? 'Freshman',
      committees: Array.isArray(data?.committees) ? (data.committees as string[]).slice() : [],
      leadershipInterest: !!data?.leadershipInterest,
      leadershipChoices: Array.isArray(data?.leadershipChoices) ? (data.leadershipChoices as any[]) : [],
      previous: (data?.previous as string | null) ?? null,
      competitions: (data?.competitions as string | null) ?? null,
      energy: (data?.energy as string | null) ?? null,
      linkedIn: (data?.linkedIn as string | null) ?? null,
      designLink: (data?.designLink as string | null) ?? null,
      selectedCommittee: (data?.selectedCommittee as string | null) ?? null,
      cvUrl: (data?.cvUrl as string | null) ?? null,
      designFileUrl: (data?.designFileUrl as string | null) ?? null,
      cvPath: (data?.cvPath as string | null) ?? null,
      designFilePath: (data?.designFilePath as string | null) ?? null,
      status: (data?.status as Application['status']) ?? 'pending',
      createdBy: (data?.createdBy as string) ?? '',
      createdByType: (data?.createdByType as Application['createdByType']) ?? 'anonymous',
      submittedAt: tsToDate(data?.submittedAt),
      updatedAt: tsToDate(data?.updatedAt),
      decidedAt: data?.decidedAt ? tsToDate(data?.decidedAt) : null,
      decidedBy: (data?.decidedBy as string | null) ?? null,
      adminNotes: (data?.adminNotes as string | null) ?? null,
    };
    return app;
  });
}

/**
 * Accept or reject an application. Cloud Functions will send email notifications on status change.
 */
export async function decideApplication(
  applicationId: string,
  status: 'accepted' | 'rejected',
  decidedByUid: string,
  adminNotes?: string,
  selectedCommittee?: string | number
): Promise<void> {
  console.log(`decideApplication selectedCommittee: ${selectedCommittee}, type: ${typeof selectedCommittee}`);
  const payload: Record<string, any> = {
    status,
    decidedAt: serverTimestamp(),
    decidedBy: decidedByUid,
    adminNotes: typeof adminNotes === 'string' ? adminNotes : null,
    updatedAt: serverTimestamp(),
  };

  // Only set selectedCommittee when it's defined for acceptance; clear it on rejection
  if (status === 'accepted') {
    if (typeof selectedCommittee !== 'undefined' && selectedCommittee !== null) {
      payload.selectedCommittee = selectedCommittee;
    }
  } else if (status === 'rejected') {
    payload.selectedCommittee = null;
  }

  console.log(`decideApplication payload.selectedCommittee: ${payload.selectedCommittee}`);
  await updateDoc(doc(db, 'applications', applicationId), payload);
}

/**
 * Revert an application decision back to 'pending'.
 * Useful to undo accidental accept/reject. This does not trigger decision emails.
 */
export async function revertApplication(applicationId: string): Promise<void> {
  await updateDoc(doc(db, 'applications', applicationId), {
    status: 'pending',
    decidedAt: null,
    decidedBy: null,
    updatedAt: serverTimestamp(),
  });
}
