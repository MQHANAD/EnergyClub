import { db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

interface Application {
  id: string;
  email: string;
  selectedCommittee: string;
  status: string;
  linkedIn?: string;
  fullName: string;
  program?: string;
  // Add other fields as needed
}

interface User {
  id: string;
  email: string;
  photoURL?: string;
  displayName?: string;
  // Add other fields as needed
}

interface Member {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
  linkedInUrl?: string;
  committeeId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Syncs accepted applications to team members
 * Links users by email and updates member data dynamically
 */
export async function syncAcceptedApplicationsToMembers(): Promise<void> {
  try {
    console.log('Starting member sync process...');

    // 1. Get all accepted applications and filter for energy_week_2 program
    const applicationsRef = collection(db, 'applications');
    const acceptedQuery = query(
      applicationsRef,
      where('status', '==', 'accepted')
    );
    
    const applicationsSnapshot = await getDocs(acceptedQuery);
    const acceptedApplications: Application[] = [];
    
    applicationsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter for energy_week_2 program in memory
      if (data.program === 'energy_week_2') {
        acceptedApplications.push({
          id: doc.id,
          ...data
        } as Application);
      }
    });

    console.log(`Found ${acceptedApplications.length} accepted applications`);

    // 2. Process each accepted application
    for (const application of acceptedApplications) {
      try {
        await processApplication(application);
      } catch (error) {
        console.error(`Error processing application ${application.id}:`, error);
        // Continue with other applications even if one fails
      }
    }

    console.log('Member sync process completed successfully');
  } catch (error) {
    console.error('Error in sync process:', error);
    throw error;
  }
}

/**
 * Processes a single application and creates/updates the corresponding member
 */
async function processApplication(application: Application): Promise<void> {
  const { email, selectedCommittee, linkedIn, fullName, program } = application;

  // Skip if no committee selected
  if (!selectedCommittee) {
    console.warn(`Application ${email} has no selected committee`);
    return;
  }

  // Skip if not energy_week_2 program
  if (program !== 'energy_week_2') {
    console.warn(`Application ${email} is not for energy_week_2 program (program: ${program})`);
    return;
  }

  // 1. Get user data from users collection, create if doesn't exist
  const userRef = doc(db, 'users', email);
  const userDoc = await getDoc(userRef);
  
  let userData: User;
  if (!userDoc.exists()) {
    // Create user record for application
    console.log(`Creating user record for application: ${email}`);
    userData = {
      id: email,
      email: email,
      displayName: fullName || email.split('@')[0],
      photoURL: null // No photo initially
    };
    
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } else {
    userData = userDoc.data() as User;
  }

  // 2. Find committee by name (since applications use committee names, not IDs)
  const committeesRef = collection(db, 'committees');
  const committeeQuery = query(committeesRef, where('name', '==', selectedCommittee));
  const committeeSnapshot = await getDocs(committeeQuery);
  
  if (committeeSnapshot.empty) {
    console.warn(`Committee "${selectedCommittee}" not found in database`);
    return;
  }

  const committeeDoc = committeeSnapshot.docs[0];
  const committeeId = committeeDoc.id;

  // 3. Check if member already exists
  const memberId = `${email}_${committeeId}`;
  const memberRef = doc(db, 'members', memberId);
  const memberDoc = await getDoc(memberRef);

  const memberData: Member = {
    id: memberId,
    fullName: fullName || userData.displayName || email.split('@')[0],
    email: email,
    role: 'member', // Default role, can be updated later
    profilePicture: userData.photoURL, // Always use current photoURL from user
    linkedInUrl: linkedIn,
    committeeId: committeeId, // Use actual committee ID
    isActive: true,
    createdAt: memberDoc.exists() ? memberDoc.data()?.createdAt : new Date(),
    updatedAt: new Date()
  };

  // 4. Create or update member
  if (memberDoc.exists()) {
    // Update existing member
    await updateDoc(memberRef, {
      fullName: memberData.fullName,
      profilePicture: userData.photoURL, // Always sync latest photo
      linkedInUrl: linkedIn,
      updatedAt: new Date()
    });
    console.log(`Updated member: ${memberData.fullName} in committee: ${selectedCommittee}`);
  } else {
    // Create new member
    await setDoc(memberRef, memberData);
    console.log(`Created new member: ${memberData.fullName} in committee: ${selectedCommittee}`);
  }

  // 5. Update committee members array
  await updateCommitteeMembers(committeeId, memberId);
}

/**
 * Updates the committee's members array to include the new member
 */
async function updateCommitteeMembers(committeeId: string, memberId: string): Promise<void> {
  try {
    const committeeRef = doc(db, 'committees', committeeId);
    const committeeDoc = await getDoc(committeeRef);

    if (!committeeDoc.exists()) {
      console.warn(`Committee ${committeeId} not found`);
      return;
    }

    const committeeData = committeeDoc.data();
    const currentMembers = committeeData?.members || [];

    // Check if member is already in the committee
    if (!currentMembers.includes(memberId)) {
      const updatedMembers = [...currentMembers, memberId];
      
      await updateDoc(committeeRef, {
        members: updatedMembers,
        updatedAt: new Date()
      });
      
      console.log(`Added member ${memberId} to committee ${committeeId}`);
    }
  } catch (error) {
    console.error(`Error updating committee ${committeeId}:`, error);
  }
}

/**
 * Syncs user profile changes to all their member records
 * Call this when a user updates their profile
 */
export async function syncUserProfileToMembers(userEmail: string): Promise<void> {
  try {
    console.log(`Syncing profile changes for user: ${userEmail}`);

    // 1. Get updated user data
    const userRef = doc(db, 'users', userEmail);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn(`User ${userEmail} not found`);
      return;
    }

    const userData = userDoc.data() as User;

    // 2. Check if user has energy_week_2 application
    const applicationsRef = collection(db, 'applications');
    const userApplicationQuery = query(
      applicationsRef,
      where('email', '==', userEmail),
      where('status', '==', 'accepted')
    );
    const applicationSnapshot = await getDocs(userApplicationQuery);
    
    // Filter for energy_week_2 program in memory
    const energyWeek2Applications = applicationSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.program === 'energy_week_2';
    });

    if (energyWeek2Applications.length === 0) {
      console.log(`No energy_week_2 application found for user ${userEmail}, but continuing with member sync...`);
      // Continue with sync even if no energy_week_2 application - user might be a member from other programs
    }

    // 3. Find all members with this email
    const membersRef = collection(db, 'members');
    const membersQuery = query(
      membersRef,
      where('email', '==', userEmail)
    );
    
    const membersSnapshot = await getDocs(membersQuery);

    // 4. Update all member records
    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      console.log(`Updating member ${userEmail}:`, {
        oldPhoto: memberData.profilePicture,
        newPhoto: userData.photoURL,
        oldName: memberData.fullName,
        newName: userData.displayName
      });
      
      await updateDoc(memberDoc.ref, {
        fullName: userData.displayName || memberData.fullName,
        profilePicture: userData.photoURL, // Always sync latest photo
        linkedInUrl: userData.linkedIn || memberData.linkedInUrl,
        updatedAt: new Date()
      });
    }

    console.log(`Updated ${membersSnapshot.size} member records for user: ${userEmail}`);
  } catch (error) {
    console.error(`Error syncing user profile for ${userEmail}:`, error);
    throw error;
  }
}

/**
 * Removes members whose applications are no longer accepted
 */
export async function removeRejectedMembers(): Promise<void> {
  try {
    console.log('Removing rejected members...');

    // 1. Get all current members
    const membersRef = collection(db, 'members');
    const membersSnapshot = await getDocs(membersRef);

    // 2. Check each member's application status
    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      const { email, committeeId } = memberData;

      // 3. Check if application still exists, is accepted, and is for energy_week_2
      const applicationsRef = collection(db, 'applications');
      const applicationQuery = query(
        applicationsRef,
        where('email', '==', email),
        where('status', '==', 'accepted')
      );
      const applicationSnapshot = await getDocs(applicationQuery);
      
      // Filter for energy_week_2 program in memory
      const energyWeek2Applications = applicationSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.program === 'energy_week_2';
      });

      if (energyWeek2Applications.length === 0) {
        // Remove member
        await memberDoc.ref.delete();
        
        // Remove from committee
        await removeMemberFromCommittee(committeeId, memberDoc.id);
        
        console.log(`Removed member: ${memberData.fullName}`);
      }
    }

    console.log('Rejected members removal completed');
  } catch (error) {
    console.error('Error removing rejected members:', error);
    throw error;
  }
}

/**
 * Removes a member from a committee's members array
 */
async function removeMemberFromCommittee(committeeId: string, memberId: string): Promise<void> {
  try {
    const committeeRef = doc(db, 'committees', committeeId);
    const committeeDoc = await getDoc(committeeRef);

    if (committeeDoc.exists()) {
      const committeeData = committeeDoc.data();
      const currentMembers = committeeData?.members || [];
      const updatedMembers = currentMembers.filter((id: string) => id !== memberId);

      await updateDoc(committeeRef, {
        members: updatedMembers,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error(`Error removing member from committee ${committeeId}:`, error);
  }
}

/**
 * Main function to run the complete sync process
 */
export async function runCompleteMemberSync(): Promise<void> {
  try {
    console.log('Starting complete member sync...');
    
    // 1. Sync accepted applications to members
    await syncAcceptedApplicationsToMembers();
    
    // 2. Remove rejected members
    await removeRejectedMembers();
    
    console.log('Complete member sync finished successfully');
  } catch (error) {
    console.error('Error in complete member sync:', error);
    throw error;
  }
}
