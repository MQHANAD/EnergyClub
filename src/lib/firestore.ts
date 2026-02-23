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
  getCountFromServer,
} from 'firebase/firestore';

import { db } from './firebase';
import { capitalizeName } from './utils';
import { Event, Registration, UserProfile, Committee, Member, LeadershipPosition, EventQuestion, RegistrationResponse, TeamMemberResponse, Region, RoleType, Announcement } from '@/types';

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
    // ✅ Support both old and new fields:
    startDate: timestampToDate(data.startDate || data.date),
    endDate: data?.endDate ? timestampToDate(data.endDate) : null,
    location: data.location,
    maxAttendees: data.maxAttendees,
    currentAttendees: data.currentAttendees,
    organizerId: data.organizerId,
    organizerName: data.organizerName,
    status: data.status,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    tags: data.tags || [],
    imageUrls: data.imageUrls || [],
    requireStudentId: data.requireStudentId || false,
    autoAcceptRegistrations: data.autoAcceptRegistrations || false,
    questions: data.questions || [],  // Team-level or general registration questions
    // Team registration fields
    isTeamEvent: data.isTeamEvent || false,
    minTeamSize: data.minTeamSize || 2,
    maxTeamSize: data.maxTeamSize || 10,
    memberQuestions: data.memberQuestions || [],  // Questions per team member
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
    checkInTime: data.checkInTime ? timestampToDate(data.checkInTime) : undefined,
    reason: data.reason,
    notes: data.notes,
    attendance: data.attendance,
    isFromUniversity: data.isFromUniversity,
    universityEmail: data.universityEmail,
    studentId: data.studentId,
    responses: data.responses || [],  // Dynamic form responses
    // Team registration fields
    teamSize: data.teamSize,
    teamResponses: data.teamResponses || [],
    memberResponses: data.memberResponses || [],
  };
};

// Normalize region string to regionId
const normalizeRegionId = (region?: string): string => {
  if (!region) return 'eastern_province';
  const lower = region.toLowerCase();
  if (lower.includes('riyadh')) return 'riyadh_region';
  if (lower.includes('western') || lower.includes('jeddah')) return 'western_region';
  if (lower.includes('eastern') || lower === 'eastern province') return 'eastern_province';
  return 'eastern_province'; // Default
};

// Infer roleType from existing data (used during migration period)
const inferRoleType = (data: DocumentData): RoleType => {
  // If roleType is already set in the document, use it
  if (data.roleType && ['global_leader', 'regional_leader', 'member'].includes(data.roleType)) {
    return data.roleType as RoleType;
  }
  // Inference: no committeeId means likely a leader
  if (!data.committeeId || data.committeeId === '' || data.committeeId === null) {
    return 'regional_leader';
  }
  return 'member';
};

// Convert Member document to Member object
const docToMember = (doc: QueryDocumentSnapshot): Member => {
  const data = doc.data();
  return {
    id: doc.id,
    email: data.email || '',
    fullName: capitalizeName(data.fullName),
    role: data.role || 'Member',
    roleType: inferRoleType(data),
    regionId: data.regionId || normalizeRegionId(data.region),
    profilePicture: data.profilePicture,
    linkedInUrl: data.linkedInUrl,
    portfolioUrl: data.portfolioUrl,
    committeeId: data.committeeId || null,
    isActive: data.isActive ?? true,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    // Legacy fields
    region: data.region,
    university: data.university
  };
};

// Convert Committee document to Committee object
const docToCommittee = (doc: QueryDocumentSnapshot): Committee => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    regionId: data.regionId || 'eastern_province', // Default to eastern for migration
    order: data.order ?? 0,
    isActive: data.isActive ?? true,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    members: [] // Will be populated separately
  };
};

// Convert Region document to Region object
const docToRegion = (doc: QueryDocumentSnapshot): Region => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    order: data.order ?? 0,
    isActive: data.isActive ?? true,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt)
  };
};

// Convert LeadershipPosition document to LeadershipPosition object
const docToLeadershipPosition = (doc: QueryDocumentSnapshot): LeadershipPosition => {
  const data = doc.data();
  const normalizeLeadershipTitle = (value: unknown): LeadershipPosition['title'] => {
    const raw = String(value ?? '').toLowerCase().trim();
    const simplified = raw.replace(/[-\s]+/g, '_');
    if (simplified === 'president') return 'president';
    if (
      simplified === 'vice_president' ||
      simplified === 'vicepresident' ||
      simplified === 'vice-president' ||
      simplified === 'vice president'
    ) {
      return 'vice_president';
    }
    if (simplified === 'leader' || simplified === 'committee_leader') return 'leader';
    // Default fallback: treat unknown as vice_president only if matches startswith vice
    if (simplified.startsWith('vice')) return 'vice_president';
    return 'leader';
  };
  return {
    id: doc.id,
    title: normalizeLeadershipTitle(data.title),
    memberId: data.memberId,
    member: data.member, // This will be populated when fetching
    isActive: data.isActive,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt)
  };
};

// Simple in-memory cache for events
const eventsCache = new Map<string, { data: Event, timestamp: number }>();
const eventsCacheKey = 'events_list';
const EVENTS_CACHE_TTL = 30000; // 30 seconds

// Events API
export const eventsApi = {
  // Get all active and completed events with pagination
  // includeHidden: true for admin dashboard, false for public pages
  async getEvents(lastDoc?: DocumentSnapshot, pageSize: number = 10, includeHidden: boolean = false): Promise<{ events: Event[], lastDoc?: DocumentSnapshot }> {
    try {
      // Check cache only for first page (no lastDoc)
      if (!lastDoc) {
        const cached = eventsCache.get(eventsCacheKey);
        if (cached && Date.now() - cached.timestamp < EVENTS_CACHE_TTL) {
          // Return cached first page
          return { events: [cached.data] as Event[], lastDoc: undefined };
        }
      }

      // Determine which statuses to include
      const statusFilter = includeHidden
        ? ['active', 'hidden', 'completed', 'registration_completed']
        : ['active', 'completed', 'registration_completed'];

      let eventsQuery = query(
        collection(db, 'events'),
        where('status', 'in', statusFilter),
        orderBy('createdAt', 'desc'),
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

  // Get single event by ID with caching
  async getEvent(eventId: string): Promise<Event | null> {
    try {
      // Check cache first
      const cached = eventsCache.get(eventId);
      if (cached && Date.now() - cached.timestamp < EVENTS_CACHE_TTL) {
        return cached.data;
      }

      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        const event = docToEvent(eventDoc as QueryDocumentSnapshot);
        // Cache the event
        eventsCache.set(eventId, { data: event, timestamp: Date.now() });
        return event;
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
        startDate: eventData.startDate
          ? Timestamp.fromDate(new Date(eventData.startDate))
          : Timestamp.now(),
        endDate: eventData.endDate
          ? Timestamp.fromDate(new Date(eventData.endDate))
          : null,
        currentAttendees: 0,
        createdAt: now,
        updatedAt: now,
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

      if (updates.startDate) {
        updateData.startDate = Timestamp.fromDate(new Date(updates.startDate));
      }

      if (updates.endDate) {
        updateData.endDate = Timestamp.fromDate(new Date(updates.endDate));
      } else if (updates.endDate === null) {
        updateData.endDate = null;
      }

      await updateDoc(doc(db, "events", eventId), updateData);
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  }
  ,

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

// Prime the event cache to accelerate navigation to detail pages
export function primeEventCache(event: Event): void {
  try {
    eventsCache.set(event.id, { data: event, timestamp: Date.now() });
  } catch (e) {
    // best-effort
  }
}

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

  // Check if user is registered for a specific event (optimized)
  async getUserEventRegistration(userId: string, eventId: string): Promise<Registration | null> {
    try {
      const q = query(
        collection(db, 'registrations'),
        where('userId', '==', userId),
        where('eventId', '==', eventId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      return docToRegistration(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Error checking user event registration:', error);
      throw error;
    }
  },

  // Register for an event
  async registerForEvent(
    eventId: string,
    userId: string,
    userName: string,
    userEmail: string,
    reason?: string,
    isFromUniversity?: boolean,
    universityEmail?: string,
    studentId?: string,
    responses?: RegistrationResponse[],
    teamSize?: number,
    teamResponses?: RegistrationResponse[],
    memberResponses?: TeamMemberResponse[],
    autoAccept?: boolean  // If true, registration is auto-confirmed
  ): Promise<string> {
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

      const registrationData: Record<string, any> = {
        eventId,
        userId,
        userName,
        userEmail,
        registrationTime: Timestamp.now(),
        status: autoAccept ? 'confirmed' : 'waitlist',
        autoAccepted: autoAccept || false,  // Flag for Cloud Functions to skip confirmation email
        reason: reason || null,
        isFromUniversity: isFromUniversity || false,
        universityEmail: universityEmail || null,
        studentId: studentId || null,
        responses: responses || [],  // Dynamic form responses
      };

      // Add team fields if this is a team registration
      if (teamSize !== undefined) {
        registrationData.teamSize = teamSize;
        registrationData.teamResponses = teamResponses || [];
        // Sanitize memberResponses to remove undefined values (Firestore doesn't accept undefined)
        registrationData.memberResponses = (memberResponses || []).map((member) => ({
          memberIndex: member.memberIndex,
          memberName: member.memberName,
          kfupmId: member.kfupmId || null,
          kfupmEmail: member.kfupmEmail || null,
          responses: member.responses || [],
        }));
      }

      const docRef = await addDoc(collection(db, 'registrations'), registrationData);

      // If auto-accepted, increment the attendee count immediately
      if (autoAccept) {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data() as DocumentData;
          await updateDoc(doc(db, 'events', eventId), {
            currentAttendees: (Number(eventData?.currentAttendees) || 0) + 1,
            updatedAt: Timestamp.now()
          });
        }
      }

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
  // Simple in-memory caches with short TTL (client-only)
  _cacheTtlMs: 60000,
  _committeesLightCache: null as { data: Committee[]; ts: number } | null,
  _committeeLightCache: new Map<string, { data: Committee; ts: number }>(),
  _leadershipCache: null as { data: LeadershipPosition[]; ts: number } | null,

  // Lightweight: fetch committees without loading members
  async getCommitteesLight(): Promise<Committee[]> {
    try {
      if (this._committeesLightCache && Date.now() - this._committeesLightCache.ts < this._cacheTtlMs) {
        return this._committeesLightCache.data;
      }
      const q = query(
        collection(db, 'committees'),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(docToCommittee);
      this._committeesLightCache = { data, ts: Date.now() };
      return data;
    } catch (error) {
      console.error('Error fetching committees (light):', error);
      throw error;
    }
  },

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

  // Lightweight: fetch single committee without members
  async getCommitteeLight(committeeId: string): Promise<Committee | null> {
    try {
      const cached = this._committeeLightCache.get(committeeId);
      if (cached && Date.now() - cached.ts < this._cacheTtlMs) {
        return cached.data;
      }
      const committeeDoc = await getDoc(doc(db, 'committees', committeeId));
      if (committeeDoc.exists()) {
        const committee = docToCommittee(committeeDoc as QueryDocumentSnapshot);
        this._committeeLightCache.set(committeeId, { data: committee, ts: Date.now() });
        return committee;
      }
      return null;
    } catch (error) {
      console.error('Error fetching committee (light):', error);
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

  // Members without a committee (isActive and committeeId empty or null)
  async getMembersWithoutCommittee(): Promise<Member[]> {
    try {
      const base = collection(db, 'members');
      const qEmpty = query(
        base,
        where('isActive', '==', true),
        where('committeeId', '==', '')
      );
      const qNull = query(
        base,
        where('isActive', '==', true),
        where('committeeId', '==', null)
      );

      const [snapEmpty, snapNull] = await Promise.all([getDocs(qEmpty), getDocs(qNull)]);
      const byId = new Map<string, Member>();
      for (const d of snapEmpty.docs) {
        byId.set(d.id, docToMember(d));
      }
      for (const d of snapNull.docs) {
        if (!byId.has(d.id)) byId.set(d.id, docToMember(d));
      }
      return Array.from(byId.values());
    } catch (error) {
      console.error('Error fetching members without committee:', error);
      throw error;
    }
  },

  // Leadership API
  async getLeadershipPositions(): Promise<LeadershipPosition[]> {
    try {
      if (this._leadershipCache && Date.now() - this._leadershipCache.ts < this._cacheTtlMs) {
        return this._leadershipCache.data;
      }
      const q = query(
        collection(db, 'leadership'),
        where('isActive', '==', true),
        orderBy('title', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const positions = querySnapshot.docs.map(docToLeadershipPosition);

      // Fetch member details for each position
      for (const position of positions) {
        try {
          const member = await this.getMember(position.memberId);
          if (member) {
            position.member = member;
            // Enrich with committee name so cards can render "Leader of {Committee}"
            try {
              if (member.committeeId) {
                const cdoc = await getDoc(doc(db, 'committees', member.committeeId));
                if (cdoc.exists()) {
                  // Attach committeeName dynamically
                  (position.member as any).committeeName = (cdoc.data() as any)?.name;
                }
              }
            } catch (e) {
              // Best-effort enrichment only
            }
          } else {
            console.warn(`Leadership position ${position.title} references non-existent member: ${position.memberId}`);
          }
        } catch (error) {
          console.error(`Error fetching member for leadership position ${position.title}:`, error);
        }
      }

      // Filter out positions without valid members
      const data = positions.filter(position => position.member);
      this._leadershipCache = { data, ts: Date.now() };
      return data;
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

// Regions API
export const regionsApi = {
  // Get all active regions
  async getRegions(): Promise<Region[]> {
    try {
      // Fetch ALL regions without constraints to avoid permission issues
      const querySnapshot = await getDocs(collection(db, 'regions'));
      const allRegions = querySnapshot.docs.map(docToRegion);
      // Filter and sort client-side
      return allRegions
        .filter(r => r.isActive !== false) // Keep active or undefined isActive
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
  },

  // Get single region by ID
  async getRegion(regionId: string): Promise<Region | null> {
    try {
      const regionDoc = await getDoc(doc(db, 'regions', regionId));
      if (regionDoc.exists()) {
        return docToRegion(regionDoc as QueryDocumentSnapshot);
      }
      return null;
    } catch (error) {
      console.error('Error fetching region:', error);
      throw error;
    }
  },

  // Create new region with specific ID
  async createRegion(regionId: string, regionData: Omit<Region, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      await setDoc(doc(db, 'regions', regionId), {
        ...regionData,
        createdAt: now,
        updatedAt: now
      });
      return regionId;
    } catch (error) {
      console.error('Error creating region:', error);
      throw error;
    }
  },

  // Update region
  async updateRegion(regionId: string, updates: Partial<Region>): Promise<void> {
    try {
      const updateData: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
      await updateDoc(doc(db, 'regions', regionId), updateData);
    } catch (error) {
      console.error('Error updating region:', error);
      throw error;
    }
  },

  // Delete region (soft delete by setting isActive to false)
  async deleteRegion(regionId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'regions', regionId), {
        isActive: false,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error deleting region:', error);
      throw error;
    }
  },

  // Initialize default regions (for migration)
  async initializeDefaultRegions(): Promise<void> {
    const defaultRegions = [
      { id: 'eastern_province', name: 'Eastern Province', order: 0 },
      { id: 'riyadh_region', name: 'Riyadh Region', order: 1 },
      { id: 'western_region', name: 'Western Region', order: 2 }
    ];

    for (const region of defaultRegions) {
      const existing = await this.getRegion(region.id);
      if (!existing) {
        await this.createRegion(region.id, {
          name: region.name,
          order: region.order,
          isActive: true
        });
        console.log(`Created region: ${region.name}`);
      }
    }
  }
};

// ============================================
// Announcements API
// ============================================

const docToAnnouncement = (doc: QueryDocumentSnapshot): Announcement => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    body: data.body,
    audience: data.audience || 'all',
    recipientEmails: data.recipientEmails || [],
    status: data.status || 'draft',
    createdAt: timestampToDate(data.createdAt),
    publishedAt: data.publishedAt ? timestampToDate(data.publishedAt) : undefined,
    createdBy: data.createdBy,
    createdByName: data.createdByName || '',
  };
};

export const announcementsApi = {
  // Get published announcements (for user feed)
  async getPublishedAnnouncements(publicOnly: boolean = false): Promise<Announcement[]> {
    try {
      let q;
      if (publicOnly) {
        q = query(
          collection(db, 'announcements'),
          where('status', '==', 'published'),
          where('audience', '==', 'all'),
          orderBy('publishedAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'announcements'),
          where('status', '==', 'published'),
          orderBy('publishedAt', 'desc')
        );
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToAnnouncement);
    } catch (error) {
      console.error('Error fetching published announcements:', error);
      throw error;
    }
  },

  // Get all announcements (for admin)
  async getAllAnnouncements(): Promise<Announcement[]> {
    try {
      const q = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToAnnouncement);
    } catch (error) {
      console.error('Error fetching all announcements:', error);
      throw error;
    }
  },

  async createAnnouncement(data: {
    title: string;
    body: string;
    audience: 'all' | 'specific';
    recipientEmails: string[];
    createdBy: string;
    createdByName: string;
    createdByEmail: string;
  }): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'announcements'), {
        ...data,
        status: 'draft',
        createdAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  // Publish an announcement (triggers Cloud Function email)
  async publishAnnouncement(announcementId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'announcements', announcementId), {
        status: 'published',
        publishedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error publishing announcement:', error);
      throw error;
    }
  },

  // Delete an announcement
  async deleteAnnouncement(announcementId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  },
};

export const usersApi = {
  // Search users by email (prefix search)
  async searchUsers(term: string): Promise<string[]> {
    if (!term || term.length < 2) return [];
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '>=', term.toLowerCase()),
        where('email', '<=', term.toLowerCase() + '\uf8ff'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => doc.data().email as string)
        .filter(email => !!email);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },

  // Get total count of users
  async getAllUsersCount(): Promise<number> {
    try {
      const coll = collection(db, 'users');
      const snapshot = await getCountFromServer(coll);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error fetching user count:', error);
      return 0;
    }
  }
};

// ============================================
// Website Settings API
// ============================================

export interface WebsiteSettings {
  teamPageEnabled: boolean;
  memberPageEnabled: boolean;
}

const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  teamPageEnabled: true,
  memberPageEnabled: true,
};

export const settingsApi = {
  async getWebsiteSettings(): Promise<WebsiteSettings> {
    try {
      const docRef = doc(db, 'settings', 'website');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...DEFAULT_WEBSITE_SETTINGS, ...docSnap.data() } as WebsiteSettings;
      }
      return DEFAULT_WEBSITE_SETTINGS;
    } catch (error) {
      console.error('Error fetching website settings:', error);
      return DEFAULT_WEBSITE_SETTINGS;
    }
  },

  async updateWebsiteSettings(updates: Partial<WebsiteSettings>): Promise<void> {
    try {
      const docRef = doc(db, 'settings', 'website');
      await setDoc(docRef, updates, { merge: true });
    } catch (error) {
      console.error('Error updating website settings:', error);
      throw error;
    }
  },
};