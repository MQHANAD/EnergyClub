import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,          
  onSnapshot,     
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';

import { db } from './firebase';
import { Event, Registration, UserProfile, Committee, Member, LeadershipPosition } from '@/types';

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

// Convert Event document to Event object
const docToEvent = (doc: QueryDocumentSnapshot): Event => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    date: timestampToDate(data.date),
    location: data.location,
    maxAttendees: data.maxAttendees,
    currentAttendees: data.currentAttendees,
    organizerId: data.organizerId,
    organizerName: data.organizerName,
    status: data.status,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    tags: data.tags || [],
    imageUrls: data.imageUrls || []
  };
};

// Convert Registration document to Registration object
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
    reason: data.reason,
    notes: data.notes,
    attendance: data.attendance,
    isFromUniversity: data.isFromUniversity,
    universityEmail: data.universityEmail
  };
};

// Convert Member document to Member object
const docToMember = (doc: QueryDocumentSnapshot): Member => {
  const data = doc.data();
  return {
    id: doc.id,
    fullName: data.fullName,
    role: data.role,
    profilePicture: data.profilePicture,
    linkedInUrl: data.linkedInUrl,
    committeeId: data.committeeId,
    isActive: data.isActive,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt)
  };
};

// Convert Committee document to Committee object
const docToCommittee = (doc: QueryDocumentSnapshot): Committee => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    order: data.order,
    isActive: data.isActive,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    members: [] // Will be populated separately
  };
};

// Convert LeadershipPosition document to LeadershipPosition object
const docToLeadershipPosition = (doc: QueryDocumentSnapshot): LeadershipPosition => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    memberId: data.memberId,
    member: data.member, // This will be populated when fetching
    isActive: data.isActive,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt)
  };
};

// Events API
export const eventsApi = {
  // Get all active and completed events with pagination
  async getEvents(lastDoc?: DocumentSnapshot, pageSize: number = 10): Promise<{ events: Event[], lastDoc?: DocumentSnapshot }> {
    try {
      let eventsQuery = query(
        collection(db, 'events'),
        where('status', 'in', ['active', 'completed']),
        orderBy('date', 'asc'),
        limit(pageSize)
      );

      if (lastDoc) {
        eventsQuery = query(eventsQuery, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(eventsQuery);
      const events = querySnapshot.docs.map(docToEvent);

      const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : undefined;

      return { events, lastDoc: newLastDoc };
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Get single event by ID
  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        return docToEvent(eventDoc as QueryDocumentSnapshot);
      }
      return null;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  // Create new event
  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'currentAttendees'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'events'), {
        ...eventData,
        date: Timestamp.fromDate(eventData.date),
        currentAttendees: 0,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Update event
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    try {
      const updateData: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };

      if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }

      await updateDoc(doc(db, 'events', eventId), updateData);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // Delete event
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
};

// Registrations API
export const registrationsApi = {
  // Get registrations for an event
  async getEventRegistrations(eventId: string): Promise<Registration[]> {
    try {
      const q = query(
        collection(db, 'registrations'),
        where('eventId', '==', eventId),
        orderBy('registrationTime', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docToRegistration);
    } catch (error) {
      console.error('Error fetching event registrations:', error);
      throw error;
    }
  },

  // Get user's registrations
  async getUserRegistrations(userId: string): Promise<Registration[]> {
    try {
      const q = query(
        collection(db, 'registrations'),
        where('userId', '==', userId),
        orderBy('registrationTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docToRegistration);
    } catch (error) {
      console.error('Error fetching user registrations:', error);
      throw error;
    }
  },

  // Register for an event
  async registerForEvent(eventId: string, userId: string, userName: string, userEmail: string, reason?: string, isFromUniversity?: boolean, universityEmail?: string): Promise<string> {
    try {
      // Check if user is already registered
      const existingQuery = query(
        collection(db, 'registrations'),
        where('eventId', '==', eventId),
        where('userId', '==', userId)
      );

      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        throw new Error('Already registered for this event');
      }

      const docRef = await addDoc(collection(db, 'registrations'), {
        eventId,
        userId,
        userName,
        userEmail,
        registrationTime: Timestamp.now(),
        status: 'waitlist',
        reason: reason || null,
        isFromUniversity: isFromUniversity || false,
        universityEmail: universityEmail || null
      });

      // Do not update event attendee count here; it will be incremented upon approval

      return docRef.id;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  },

  // Cancel registration
  async cancelRegistration(registrationId: string, eventId: string): Promise<void> {
    try {
      // Fetch current registration to determine prior status
      const regSnap = await getDoc(doc(db, 'registrations', registrationId));
      const regData = regSnap.data() as DocumentData | undefined;
      const prevStatus = regSnap.exists() ? ((regData?.status as string | null) ?? null) : null;

      await updateDoc(doc(db, 'registrations', registrationId), {
        status: 'cancelled'
      });

      // Only decrement attendees if this registration was previously confirmed
      if (prevStatus === 'confirmed') {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data() as DocumentData;
          await updateDoc(doc(db, 'events', eventId), {
            currentAttendees: Math.max(0, Number(eventData?.currentAttendees || 0) - 1),
            updatedAt: Timestamp.now()
          });
        }
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      throw error;
    }
  }
,

  // Approve a registration (set to confirmed) and increment attendee count
  async approveRegistration(registrationId: string, eventId: string): Promise<void> {
    try {
      // Update registration status
      await updateDoc(doc(db, 'registrations', registrationId), {
        status: 'confirmed'
      });

      // Increment event attendee count
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        const eventData = eventDoc.data() as DocumentData;
        await updateDoc(doc(db, 'events', eventId), {
          currentAttendees: Number(eventData?.currentAttendees || 0) + 1,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      throw error;
    }
  },

  // Reject a registration (set to cancelled). If previously confirmed, decrement attendee count.
  async rejectRegistration(registrationId: string, eventId: string): Promise<void> {
    try {
      // Fetch current status to see if we need to decrement
      const regSnap = await getDoc(doc(db, 'registrations', registrationId));
      const regData2 = regSnap.data() as DocumentData | undefined;
      const prevStatus = regSnap.exists() ? ((regData2?.status as string | null) ?? null) : null;

      await updateDoc(doc(db, 'registrations', registrationId), {
        status: 'cancelled'
      });

      if (prevStatus === 'confirmed') {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data() as DocumentData;
          await updateDoc(doc(db, 'events', eventId), {
            currentAttendees: Math.max(0, Number(eventData?.currentAttendees || 0) - 1),
            updatedAt: Timestamp.now()
          });
        }
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      throw error;
    }
  }
};

// Team API
export const teamApi = {
  // Committees API
  async getCommittees(): Promise<Committee[]> {
    try {
      const q = query(
        collection(db, 'committees'),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const committees = querySnapshot.docs.map(docToCommittee);
      
      // Fetch members for each committee
      for (const committee of committees) {
        committee.members = await this.getCommitteeMembers(committee.id);
      }
      
      return committees;
    } catch (error) {
      console.error('Error fetching committees:', error);
      throw error;
    }
  },

  async getCommittee(committeeId: string): Promise<Committee | null> {
    try {
      const committeeDoc = await getDoc(doc(db, 'committees', committeeId));
      if (committeeDoc.exists()) {
        const committee = docToCommittee(committeeDoc as QueryDocumentSnapshot);
        committee.members = await this.getCommitteeMembers(committeeId);
        return committee;
      }
      return null;
    } catch (error) {
      console.error('Error fetching committee:', error);
      throw error;
    }
  },

  async createCommittee(committeeData: Omit<Committee, 'id' | 'createdAt' | 'updatedAt' | 'members'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'committees'), {
        ...committeeData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating committee:', error);
      throw error;
    }
  },

  async updateCommittee(committeeId: string, updates: Partial<Committee>): Promise<void> {
    try {
      const updateData: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
      await updateDoc(doc(db, 'committees', committeeId), updateData);
    } catch (error) {
      console.error('Error updating committee:', error);
      throw error;
    }
  },

  async deleteCommittee(committeeId: string): Promise<void> {
    try {
      // First delete all members in this committee
      const membersQuery = query(
        collection(db, 'members'),
        where('committeeId', '==', committeeId)
      );
      const membersSnapshot = await getDocs(membersQuery);
      
      const deletePromises = membersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Then delete the committee
      await deleteDoc(doc(db, 'committees', committeeId));
    } catch (error) {
      console.error('Error deleting committee:', error);
      throw error;
    }
  },

  // Members API
  async getCommitteeMembers(committeeId: string): Promise<Member[]> {
    try {
      const q = query(
        collection(db, 'members'),
        where('committeeId', '==', committeeId),
        where('isActive', '==', true),
        orderBy('fullName', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docToMember);
    } catch (error) {
      console.error('Error fetching committee members:', error);
      throw error;
    }
  },

  async getMember(memberId: string): Promise<Member | null> {
    try {
      const memberDoc = await getDoc(doc(db, 'members', memberId));
      if (memberDoc.exists()) {
        return docToMember(memberDoc as QueryDocumentSnapshot);
      }
      return null;
    } catch (error) {
      console.error('Error fetching member:', error);
      throw error;
    }
  },

  async createMember(memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'members'), {
        ...memberData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  },

  async updateMember(memberId: string, updates: Partial<Member>): Promise<void> {
    try {
      const updateData: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
      await updateDoc(doc(db, 'members', memberId), updateData);
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  },

  async deleteMember(memberId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'members', memberId));
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  },

  // Leadership API
  async getLeadershipPositions(): Promise<LeadershipPosition[]> {
    try {
      const q = query(
        collection(db, 'leadership'),
        where('isActive', '==', true),
        orderBy('title', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const positions = querySnapshot.docs.map(docToLeadershipPosition);
      
      // Fetch member details for each position
      for (const position of positions) {
        const member = await this.getMember(position.memberId);
        if (member) {
          position.member = member;
        }
      }
      
      return positions;
    } catch (error) {
      console.error('Error fetching leadership positions:', error);
      throw error;
    }
  },

  async createLeadershipPosition(positionData: Omit<LeadershipPosition, 'id' | 'createdAt' | 'updatedAt' | 'member'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'leadership'), {
        ...positionData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating leadership position:', error);
      throw error;
    }
  },

  async updateLeadershipPosition(positionId: string, updates: Partial<LeadershipPosition>): Promise<void> {
    try {
      const updateData: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
      await updateDoc(doc(db, 'leadership', positionId), updateData);
    } catch (error) {
      console.error('Error updating leadership position:', error);
      throw error;
    }
  },

  async deleteLeadershipPosition(positionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'leadership', positionId));
    } catch (error) {
      console.error('Error deleting leadership position:', error);
      throw error;
    }
  }
};