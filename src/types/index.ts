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
  status: "active" | "cancelled" | "completed";
  date?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  tags: string[];
  currentAttendees: number;
  maxAttendees: number;
  imageUrls: string[];
  requireStudentId?: boolean;
  questions?: EventQuestion[];  // Dynamic registration questions
}

// ============================================
// Dynamic Registration Form Types
// ============================================

/**
 * Supported question types for dynamic registration forms
 */
export type QuestionType =
  | 'short_text'   // Single-line text input
  | 'long_text'    // Multi-line textarea
  | 'radio'        // Single choice (radio buttons)
  | 'checkbox'     // Multiple choice (checkboxes)
  | 'dropdown'     // Single choice (dropdown select)
  | 'yes_no';      // Boolean (Yes/No radio)

/**
 * A single question in an event's registration form
 */
export interface EventQuestion {
  id: string;              // UUID for the question
  type: QuestionType;      // Input type to render
  label: string;           // The question text shown to users
  required: boolean;       // Whether answer is mandatory
  order: number;           // For sorting/reordering questions
  options?: string[];      // For radio, checkbox, dropdown types
  placeholder?: string;    // Placeholder text for text inputs
}

/**
 * A user's response to a single question
 */
export interface RegistrationResponse {
  questionId: string;           // References EventQuestion.id
  value: string | string[];     // string for single answers, string[] for checkbox
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  registrationTime: Date;
  status: 'confirmed' | 'waitlist' | 'cancelled' | 'checked_in';
  checkInTime?: Date;
  reason?: string;
  notes?: string;
  attendance?: boolean;
  isFromUniversity?: boolean;
  universityEmail?: string;
  studentId?: string;
  responses?: RegistrationResponse[];  // Dynamic form responses
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
  startDate: string;
  endDate?: string;
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
  program: 'energy_week_2' | 'female_energy_club' | 'regional_team';
  programLabel: string;
  fullName: string;
  email: string;
  kfupmId?: string; // Optional for Regional Team (they have university instead)
  mobile: string;
  academicYear: string;
  committees?: string[]; // Used by Energy Week and Female Energy Club
  leadershipInterest: boolean;
  leadershipChoices?: Array<{
    choice: 1 | 2 | 3;
    team: string;
    why: string;
  }>;
  previous?: string | null;
  competitions?: string | null;
  energy?: string | null;
  linkedIn?: string | null;
  designLink?: string | null;
  selectedCommittee?: string | null;
  cvUrl?: string | null;
  designFileUrl?: string | null;
  cvPath?: string | null;
  designFilePath?: string | null;

  // Regional Team specific fields
  university?: string;
  region?: string;
  majorCollege?: string;
  previousExperience?: string;
  competitionsHackathons?: string;
  whyJoin?: string;
  strengthsSkills?: string;
  rolePreferences?: string[];
  leadershipPosition?: string;
  whyLeadership?: string;
  availability?: string;
  portfolioLink?: string;
  portfolioUrl?: string;

  // Status and metadata
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
  email: string;
  fullName: string;
  role: string;
  profilePicture?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  committeeId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  region?: string;
  university?: string;
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
  title: 'president' | 'vice_president' | 'leader';
  memberId: string;
  member: Member;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamFormData {
  email?: string;
  fullName: string;
  role: string;
  profilePicture?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  committeeId: string;
}

export interface CommitteeFormData {
  name: string;
  description?: string;
  order: number;
}