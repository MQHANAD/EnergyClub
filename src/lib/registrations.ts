import { auth, db, storage } from '@/lib/firebase';
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc,
  getDocs,
  query,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
  UploadMetadata,
} from 'firebase/storage';
import type { ApplicationInput, Program } from '@/lib/registrationSchemas';
import { programLabelFor } from '@/lib/registrationSchemas';
import type { Application } from '@/types';


// ===== Types =====

export type CreateApplicationInput = Omit<ApplicationInput, 'cvFile' | 'designFile'>;

export interface UpdateUrlsInput {
  cvUrl?: string;
  designFileUrl?: string;
  designLink?: string;
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
    cvUrl: null as string | null,
    designFileUrl: null as string | null,
    status: 'pending' as const,
    submittedAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    decidedAt: null as Timestamp | null,
    decidedBy: null as string | null,
    adminNotes: null as string | null,
  };

  const col = collection(db, 'applications');
  const created = await addDoc(col, base);
  return created.id;
}

export async function updateApplicationUrls(
  applicationId: string,
  updates: UpdateUrlsInput
): Promise<void> {
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (typeof updates.cvUrl === 'string') payload.cvUrl = updates.cvUrl;
  if (typeof updates.designFileUrl === 'string') payload.designFileUrl = updates.designFileUrl;
  if (updates.designLink === undefined) {
    // no-op
  } else if (updates.designLink === null) {
    payload.designLink = null;
  } else {
    payload.designLink = updates.designLink;
  }

  await updateDoc(doc(db, 'applications', applicationId), payload);
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

export async function uploadCv(applicationId: string, file: File): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error('Invalid CV file.');
  }
  assertSize(file);
  if (!CV_ALLOWED.has(file.type)) {
    throw new Error('Invalid CV type. Allowed: PDF, DOC, DOCX.');
  }
  const ext = extFromNameOrType(file, 'pdf');
  const path = `applications/${applicationId}/cv.${ext}`;
  const ref = storageRef(storage, path);
  const metadata: UploadMetadata = { contentType: file.type || 'application/octet-stream' };
  await uploadBytes(ref, file, metadata);
  return await getDownloadURL(ref);
}

export async function uploadDesign(applicationId: string, file: File): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error('Invalid design file.');
  }
  assertSize(file);
  if (!DESIGN_ALLOWED.has(file.type)) {
    throw new Error('Invalid design type. Allowed: PDF, PNG, JPG/JPEG.');
  }
  const ext = extFromNameOrType(file, 'pdf');
  const path = `applications/${applicationId}/design.${ext}`;
  const ref = storageRef(storage, path);
  const metadata: UploadMetadata = { contentType: file.type || 'application/octet-stream' };
  await uploadBytes(ref, file, metadata);
  return await getDownloadURL(ref);
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
      cvUrl: (data?.cvUrl as string | null) ?? null,
      designFileUrl: (data?.designFileUrl as string | null) ?? null,
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
  adminNotes?: string
): Promise<void> {
  await updateDoc(doc(db, 'applications', applicationId), {
    status,
    decidedAt: serverTimestamp(),
    decidedBy: decidedByUid,
    adminNotes: typeof adminNotes === 'string' ? adminNotes : null,
    updatedAt: serverTimestamp(),
  });
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