import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from './firebase';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  linkedIn?: string;
}

export interface Application {
  id: string;
  email: string;
  fullName: string;
  selectedCommittee: string;
  status: string;
  program?: string;
  linkedIn?: string;
}

export interface Committee {
  id: string;
  name: string;
  members: string[];
}

export interface HybridMember {
  id: string; // email
  email: string;
  fullName: string;
  role: string;
  committeeId: string;
  committeeName?: string;
  profilePicture: string | null;
  linkedInUrl: string | null;
  portfolioUrl?: string | null;
  status: string;
  program?: string;
}

/**
 * Fetches all accepted applications for energy_week_2 program
 */
export async function getAcceptedApplications(): Promise<Application[]> {
  try {
    if (!db) {
      console.error('Firebase db is not initialized');
      return [];
    }
    
    const applicationsRef = collection(db, 'applications');
    const acceptedQuery = query(
      applicationsRef,
      where('status', '==', 'accepted')
    );

    const applicationsSnapshot = await getDocs(acceptedQuery);
    const applications: Application[] = [];

    applicationsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter for energy_week_2 program in memory
      if (data.program === 'energy_week_2') {
        applications.push({
          id: doc.id,
          ...data
        } as Application);
      }
    });

    return applications;
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
}

/**
 * Fetches user data by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    if (!db) {
      console.error('Firebase db is not initialized');
      return null;
    }
    
    if (!email || typeof email !== 'string') {
      console.error('Invalid email provided:', email);
      return null;
    }
    
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching user ${email}:`, error);
    return null;
  }
}

/**
 * Fetches committee data by ID
 */
export async function getCommitteeById(committeeId: string): Promise<Committee | null> {
  try {
    if (!db) {
      console.error('Firebase db is not initialized');
      return null;
    }
    
    if (!committeeId || typeof committeeId !== 'string') {
      console.error('Invalid committeeId provided:', committeeId);
      return null;
    }
    
    const committeeRef = doc(db, 'committees', committeeId);
    const committeeDoc = await getDoc(committeeRef);
    
    if (committeeDoc.exists()) {
      return { id: committeeDoc.id, ...committeeDoc.data() } as Committee;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching committee ${committeeId}:`, error);
    return null;
  }
}

/**
 * Fetches committee data by name
 */
export async function getCommitteeByName(committeeName: string): Promise<Committee | null> {
  try {
    if (!db) {
      console.error('Firebase db is not initialized');
      return null;
    }
    
    if (!committeeName || typeof committeeName !== 'string') {
      console.error('Invalid committeeName provided:', committeeName);
      return null;
    }
    
    const committeesRef = collection(db, 'committees');
    const committeeQuery = query(committeesRef, where('name', '==', committeeName));
    const committeeSnapshot = await getDocs(committeeQuery);

    if (!committeeSnapshot.empty) {
      const committeeDoc = committeeSnapshot.docs[0];
      return { id: committeeDoc.id, ...committeeDoc.data() } as Committee;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching committee by name ${committeeName}:`, error);
    return null;
  }
}

/**
 * Creates hybrid member data by combining user and application data
 */
export async function createHybridMember(application: Application): Promise<HybridMember | null> {
  try {
    // Get user data
    const user = await getUserByEmail(application.email);
    if (!user) {
      console.warn(`User not found for email: ${application.email}`);
      return null;
    }

    // Get committee data
    const committee = await getCommitteeByName(application.selectedCommittee);
    if (!committee) {
      console.warn(`Committee not found: ${application.selectedCommittee}`);
      return null;
    }

    // Determine role based on committee or application data
    const role = application.role || 'Member';

    return {
      id: application.email,
      email: application.email,
      fullName: user.displayName || application.fullName,
      role: role,
      committeeId: committee.id,
      committeeName: committee.name,
      profilePicture: user.photoURL,
      linkedInUrl: application.linkedIn || user.linkedIn || null,
      status: application.status,
      program: application.program
    };
  } catch (error) {
    console.error(`Error creating hybrid member for ${application.email}:`, error);
    return null;
  }
}

/**
 * Fetches all hybrid members (combines users + applications data)
 */
export async function getAllHybridMembers(): Promise<HybridMember[]> {
  try {
    console.log('Fetching hybrid members from users + applications...');
    
    // Get all accepted applications
    const applications = await getAcceptedApplications();
    console.log(`Found ${applications.length} accepted applications`);

    // Create hybrid members
    const hybridMembers: HybridMember[] = [];
    
    for (const application of applications) {
      const hybridMember = await createHybridMember(application);
      if (hybridMember) {
        hybridMembers.push(hybridMember);
      }
    }

    console.log(`Created ${hybridMembers.length} hybrid members`);
    return hybridMembers;
  } catch (error) {
    console.error('Error fetching hybrid members:', error);
    return [];
  }
}

/**
 * Fetches hybrid members for a specific committee
 */
export async function getHybridMembersByCommittee(committeeName: string): Promise<HybridMember[]> {
  try {
    console.log(`Fetching hybrid members for committee: ${committeeName}`);
    
    // Get all accepted applications
    const applications = await getAcceptedApplications();
    
    // Filter applications for this committee
    const committeeApplications = applications.filter(app => 
      app.selectedCommittee === committeeName
    );
    
    console.log(`Found ${committeeApplications.length} applications for ${committeeName}`);

    // Create hybrid members
    const hybridMembers: HybridMember[] = [];
    
    for (const application of committeeApplications) {
      const hybridMember = await createHybridMember(application);
      if (hybridMember) {
        hybridMembers.push(hybridMember);
      }
    }

    console.log(`Created ${hybridMembers.length} hybrid members for ${committeeName}`);
    return hybridMembers;
  } catch (error) {
    console.error(`Error fetching hybrid members for committee ${committeeName}:`, error);
    return [];
  }
}

/**
 * Optimized approach: Get members from members collection as main source,
 * then enrich with data from users collection only (removed applications query)
 */
export async function getMembersHybrid(): Promise<HybridMember[]> {
  try {
    console.log('Using optimized approach: members collection as main source...');
    
    if (!db) {
      console.error('Firebase db is not initialized');
      return [];
    }
    
    // First, get all members from members collection
    const membersRef = collection(db, 'members');
    const membersSnapshot = await getDocs(membersRef);
    
    if (membersSnapshot.size === 0) {
      console.log('No members found in members collection');
      return [];
    }
    
    console.log(`Found ${membersSnapshot.size} members in members collection`);
    
    // Collect all member emails for batch user lookup
    const memberEmails = membersSnapshot.docs.map(doc => {
      const data = doc.data();
      return data.email;
    }).filter(email => email && typeof email === 'string');
    
    // Process members and enrich with user data only
      const hybridMembers: HybridMember[] = [];
      
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
      const email = memberData.email;
      
      if (!email) {
        console.warn(`Member ${memberDoc.id} has no email, skipping`);
        continue;
      }
        
        // Get user data
      const user = await getUserByEmail(email);
      if (!user) {
        console.warn(`User not found for email: ${email}, skipping member`);
        continue;
      }
        
        // Get committee data
        const committee = await getCommitteeById(memberData.committeeId);
      if (!committee) {
        console.warn(`Committee not found for member ${email}: ${memberData.committeeId}`);
        continue;
      }
        
        hybridMembers.push({
        id: email,
        email: email,
        fullName: user.displayName || memberData.fullName || 'Unknown',
          role: memberData.role || 'Member',
          committeeId: memberData.committeeId,
          committeeName: committee.name,
        profilePicture: user.photoURL || memberData.profilePicture || null,
          linkedInUrl: memberData.linkedInUrl || user.linkedIn || null,
        status: 'accepted', // All members in collection are considered accepted
        program: 'energy_week_2' // All members are assumed to be from energy_week_2
      });
    }
    
    console.log(`Created ${hybridMembers.length} optimized hybrid members`);
    return hybridMembers;
  } catch (error) {
    console.error('Error in optimized member fetching:', error);
    return [];
  }
}

/**
 * Get committee members directly from members collection (optimized)
 */
export async function getCommitteeMembersDirect(committeeId: string): Promise<HybridMember[]> {
  try {
    console.log(`Fetching committee members directly for committee: ${committeeId}`);
    
    if (!db) {
      console.error('Firebase db is not initialized');
      return [];
    }
    
    if (!committeeId) {
      console.error('Committee ID is required');
      return [];
    }
    
    // Client-side cache per committee
    const w: any = typeof window !== 'undefined' ? window : {};
    const cacheKey = `__committee_members_${committeeId}__`;
    const ttlMs = 60000;
    if (w[cacheKey] && (Date.now() - w[cacheKey].ts < ttlMs)) {
      return w[cacheKey].data as HybridMember[];
    }

    // Query members collection for this specific committee
    const membersRef = collection(db, 'members');
    const committeeQuery = query(
      membersRef,
      where('committeeId', '==', committeeId),
      where('isActive', '==', true)
    );
    
    const membersSnapshot = await getDocs(committeeQuery);
    
    if (membersSnapshot.size === 0) {
      console.log(`No active members found for committee: ${committeeId}`);
      return [];
    }
    
    console.log(`Found ${membersSnapshot.size} members in committee ${committeeId}`);
    
    // Collect all member emails for batch user lookup
    const memberEmails = membersSnapshot.docs.map(doc => {
      const data = doc.data();
      return data.email;
    }).filter(email => email && typeof email === 'string');
    
    // Get committee data
    const committee = await getCommitteeById(committeeId);
    if (!committee) {
      console.warn(`Committee not found: ${committeeId}`);
      return [];
    }
    
    // Process members using only members collection data (no per-member user fetch)
    const hybridMembers: HybridMember[] = [];
    
    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      const email = memberData.email;
      
      if (!email) {
        console.warn(`Member ${memberDoc.id} has no email, skipping`);
        continue;
      }

      hybridMembers.push({
        id: email,
        email: email,
        fullName: memberData.fullName || 'Unknown',
        role: memberData.role || 'Member',
        committeeId: memberData.committeeId,
        committeeName: committee.name,
        profilePicture: memberData.profilePicture || null,
        linkedInUrl: memberData.linkedInUrl || null,
        portfolioUrl: memberData.portfolioUrl || null,
        status: 'accepted',
        program: 'energy_week_2'
      });
    }
    
    console.log(`Created ${hybridMembers.length} committee members`);
    if (typeof window !== 'undefined') {
      w[cacheKey] = { data: hybridMembers, ts: Date.now() };
    }
    return hybridMembers;
  } catch (error) {
    console.error(`Error fetching committee members for ${committeeId}:`, error);
    return [];
  }
}

/**
 * Batch fetch users by email to reduce Firestore calls
 */
export async function getUsersByEmails(emails: string[]): Promise<Map<string, User>> {
  try {
    if (!db || !emails.length) {
      return new Map();
    }
    
    const userMap = new Map<string, User>();
    
    // Process emails in smaller batches to avoid Firestore limitations
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      // Fetch users in parallel for this batch
      const userPromises = batch.map(email => getUserByEmail(email));
      const users = await Promise.all(userPromises);
      
      // Add valid users to the map
      users.forEach((user, index) => {
        if (user) {
          userMap.set(batch[index], user);
        }
      });
    }
    
    return userMap;
  } catch (error) {
    console.error('Error in batch user fetching:', error);
    return new Map();
  }
}

/**
 * Ultra-optimized approach: Get members from members collection with batch user fetching
 */
export async function getMembersUltraOptimized(): Promise<HybridMember[]> {
  try {
    console.log('Using ultra-optimized approach...');
    
    if (!db) {
      console.error('Firebase db is not initialized');
      return [];
    }
    
    // Client-side cache
    const w: any = typeof window !== 'undefined' ? window : {};
    const cacheKey = '__members_ultra_cache__';
    const ttlMs = 60000;
    if (w[cacheKey] && (Date.now() - w[cacheKey].ts < ttlMs)) {
      return w[cacheKey].data as HybridMember[];
    }

    // Get all active members from members collection
    const membersRef = collection(db, 'members');
    const membersSnapshot = await getDocs(query(membersRef, where('isActive', '==', true)));
    
    if (membersSnapshot.size === 0) {
      console.log('No members found in members collection');
      return [];
    }
    
    console.log(`Found ${membersSnapshot.size} members in members collection`);
    
    // Build a committees map once to avoid per-member committee reads
    const committeesRef = collection(db, 'committees');
    const committeesSnap = await getDocs(query(committeesRef, where('isActive', '==', true)));
    const committeeIdToName = new Map<string, string>();
    committeesSnap.docs.forEach(c => {
      const d = c.data();
      committeeIdToName.set(c.id, (d.name as string) || '');
    });
    
    // Process members with pre-fetched user data
    const hybridMembers: HybridMember[] = [];
    
    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      const email = memberData.email;
      
      if (!email) {
        console.warn(`Member ${memberDoc.id} has no email, skipping`);
        continue;
      }
      
      // Derive committee name from pre-fetched map
      const committeeName = committeeIdToName.get(memberData.committeeId) || undefined;
      
      hybridMembers.push({
        id: email,
        email: email,
        fullName: memberData.fullName || 'Unknown',
        role: memberData.role || 'Member',
        committeeId: memberData.committeeId,
        committeeName: committeeName,
        profilePicture: memberData.profilePicture || null,
        linkedInUrl: memberData.linkedInUrl || null,
        status: 'accepted',
        program: 'energy_week_2'
      });
    }
    
    console.log(`Created ${hybridMembers.length} ultra-optimized members`);
    if (typeof window !== 'undefined') {
      w[cacheKey] = { data: hybridMembers, ts: Date.now() };
    }
    return hybridMembers;
  } catch (error) {
    console.error('Error in ultra-optimized member fetching:', error);
    return [];
  }
}
