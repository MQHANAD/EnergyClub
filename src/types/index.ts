export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  organizerId: string;
  organizerName: string;
  status: 'active' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  imageUrls: string[];
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  registrationTime: Date;
  status: 'confirmed' | 'waitlist' | 'cancelled';
  reason?: string;
  notes?: string;
  attendance?: boolean;
  isFromUniversity?: boolean;
  universityEmail?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'organizer' | 'admin';
  createdAt: Date;
  lastLogin: Date;
  preferences: {
    emailNotifications: boolean;
    eventReminders: boolean;
  };
}

export interface EventFormData {
  title: string;
  description: string;
  date: string;
  location: string;
  maxAttendees: number;
  tags: string[];
  imageUrls: string[];
}

export interface RegistrationFormData {
  reason?: string;
}

export interface Application {
  id: string;
  program: 'energy_week_2' | 'female_energy_club';
  programLabel: string;
  fullName: string;
  email: string;
  kfupmId: string;
  mobile: string;
  academicYear: 'Oria' | 'Freshman' | 'Sophomore' | 'Junior' | 'Senior';
  committees: string[];
  leadershipInterest: boolean;
  leadershipChoices?: Array<{
    choice: 1 | 2 | 3;
    team: string;
    why: string;
  }>;
  previous: string | null;
  competitions: string | null;
  energy: string | null;
  linkedIn: string | null;
  designLink: string | null;
  selectedCommittee: string | null;
  cvUrl: string | null;
  designFileUrl: string | null;
  cvPath?: string | null;
  designFilePath?: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  createdBy: string;
  createdByType: 'anonymous' | 'authenticated';
  submittedAt: Date;
  updatedAt: Date;
  decidedAt: Date | null;
  decidedBy: string | null;
  adminNotes: string | null;
}

export interface Member {
  id: string;
  fullName: string;
  role: string;
  profilePicture?: string;
  linkedInUrl?: string;
  committeeId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Committee {
  id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  members: Member[];
}

export interface LeadershipPosition {
  id: string;
  title: 'president' | 'vice_president';
  memberId: string;
  member: Member;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamFormData {
  fullName: string;
  role: string;
  profilePicture?: string;
  linkedInUrl?: string;
  committeeId: string;
}

export interface CommitteeFormData {
  name: string;
  description?: string;
  order: number;
}