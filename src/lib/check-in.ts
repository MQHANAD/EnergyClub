'use client';

import {
    doc,
    getDoc,
    updateDoc,
    Timestamp,
    QueryDocumentSnapshot,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Registration } from '@/types';

// Convert Firestore timestamp-like value to Date
function hasToDate(v: unknown): v is { toDate: () => Date } {
    return typeof v === 'object' && v !== null && typeof (v as { toDate?: unknown }).toDate === 'function';
}

const timestampToDate = (timestamp: unknown): Date => {
    if (hasToDate(timestamp)) {
        return timestamp.toDate();
    }
    if (typeof timestamp === 'number' || typeof timestamp === 'string') {
        return new Date(timestamp);
    }
    return new Date();
};

// Convert Registration document to Registration object for check-in
const docToRegistration = (doc: QueryDocumentSnapshot): Registration => {
    const data = doc.data();
    return {
        id: doc.id,
        eventId: data.eventId,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        registrationTime: timestampToDate(data.registrationTime),
        status: data.status,
        checkInTime: data.checkInTime ? timestampToDate(data.checkInTime) : undefined,
        reason: data.reason,
        notes: data.notes,
        attendance: data.attendance,
        isFromUniversity: data.isFromUniversity,
        universityEmail: data.universityEmail,
        studentId: data.studentId
    };
};

export type CheckInResult = {
    success: boolean;
    status: 'not_found' | 'waitlist' | 'cancelled' | 'already_checked_in' | 'checked_in';
    registration?: Registration;
    message: string;
};

/**
 * Get a registration by its ID
 */
export async function getRegistrationById(registrationId: string): Promise<Registration | null> {
    try {
        const regDoc = await getDoc(doc(db, 'registrations', registrationId));
        if (regDoc.exists()) {
            return docToRegistration(regDoc as QueryDocumentSnapshot);
        }
        return null;
    } catch (error) {
        console.error('Error fetching registration:', error);
        throw error;
    }
}

/**
 * Check in a registration by updating its status to 'checked_in' and setting checkInTime
 */
export async function checkInRegistration(registrationId: string): Promise<CheckInResult> {
    try {
        const registration = await getRegistrationById(registrationId);

        // Registration not found
        if (!registration) {
            return {
                success: false,
                status: 'not_found',
                message: 'Ticket not found in the system.',
            };
        }

        // Already checked in
        if (registration.status === 'checked_in') {
            return {
                success: false,
                status: 'already_checked_in',
                registration,
                message: `${registration.userName} has already checked in.`,
            };
        }

        // Not accepted yet (waitlist)
        if (registration.status === 'waitlist') {
            return {
                success: false,
                status: 'waitlist',
                registration,
                message: `${registration.userName} is on the waitlist and has not been accepted yet.`,
            };
        }

        // Cancelled/Rejected
        if (registration.status === 'cancelled') {
            return {
                success: false,
                status: 'cancelled',
                registration,
                message: `${registration.userName}'s registration has been cancelled.`,
            };
        }

        // Status is 'confirmed' - proceed with check-in
        if (registration.status === 'confirmed') {
            await updateDoc(doc(db, 'registrations', registrationId), {
                status: 'checked_in',
                checkInTime: serverTimestamp(),
            });

            return {
                success: true,
                status: 'checked_in',
                registration: {
                    ...registration,
                    status: 'checked_in',
                    checkInTime: new Date(),
                },
                message: `${registration.userName} has been successfully checked in!`,
            };
        }

        // Unknown status
        return {
            success: false,
            status: 'not_found',
            message: 'Unknown registration status.',
        };
    } catch (error) {
        console.error('Error during check-in:', error);
        throw error;
    }
}
