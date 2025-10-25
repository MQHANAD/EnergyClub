import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDocs,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { syncAcceptedApplicationsToMembers, syncUserProfileToMembers, removeRejectedMembers } from './syncMembers';

interface Application {
  id: string;
  email: string;
  fullName: string;
  selectedCommittee: string;
  status: string;
  program?: string;
  linkedIn?: string;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  linkedIn?: string;
}

interface Member {
  id: string;
  email: string;
  fullName: string;
  role: string;
  committeeId: string;
  profilePicture: string | null;
  linkedInUrl: string | null;
}

interface Committee {
  id: string;
  name: string;
  members: string[];
}

class RealtimeMemberSync {
  private unsubscribeFunctions: Unsubscribe[] = [];
  private isInitialized = false;

  /**
   * Initialize all real-time listeners for member synchronization
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('RealtimeMemberSync already initialized');
      return;
    }

    console.log('Initializing RealtimeMemberSync...');

    try {
      // 1. Listen for application status changes
      await this.setupApplicationListeners();
      
      // 2. Listen for user profile changes
      await this.setupUserProfileListeners();
      
      // 3. Listen for member data changes
      await this.setupMemberListeners();

      this.isInitialized = true;
      console.log('RealtimeMemberSync initialized successfully');
    } catch (error) {
      console.error('Error initializing RealtimeMemberSync:', error);
      throw error;
    }
  }

  /**
   * Clean up all listeners
   */
  public cleanup(): void {
    console.log('Cleaning up RealtimeMemberSync listeners...');
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
    this.isInitialized = false;
    console.log('RealtimeMemberSync cleanup completed');
  }

  /**
   * Listen for changes in applications collection
   */
  private async setupApplicationListeners(): Promise<void> {
    console.log('Setting up application listeners...');

    // Listen for all applications (we'll filter for energy_week_2 in memory)
    const applicationsRef = collection(db, 'applications');
    const applicationsQuery = query(applicationsRef);

    const unsubscribe = onSnapshot(
      applicationsQuery,
      async (snapshot) => {
        console.log('Applications collection changed, checking for sync...');
        
        // Check if any energy_week_2 applications changed status
        const changedApplications = snapshot.docChanges().map(change => ({
          type: change.type,
          data: { id: change.doc.id, ...change.doc.data() } as Application
        }));

        const relevantChanges = changedApplications.filter(change => 
          change.data.program === 'energy_week_2' && 
          (change.type === 'added' || change.type === 'modified')
        );

        if (relevantChanges.length > 0) {
          console.log(`Found ${relevantChanges.length} relevant application changes, syncing...`);
          
          // Check for status changes to accepted
          const statusChanges = relevantChanges.filter(change => 
            change.data.status === 'accepted'
          );

          if (statusChanges.length > 0) {
            console.log('New applications accepted, running full sync...');
            try {
              await syncAcceptedApplicationsToMembers();
              console.log('Application sync completed');
            } catch (error) {
              console.error('Error syncing applications:', error);
            }
          }
        }
      },
      (error) => {
        console.error('Error in application listener:', error);
      }
    );

    this.unsubscribeFunctions.push(unsubscribe);
  }

  /**
   * Listen for changes in users collection
   */
  private async setupUserProfileListeners(): Promise<void> {
    console.log('Setting up user profile listeners...');

    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef);

    const unsubscribe = onSnapshot(
      usersQuery,
      async (snapshot) => {
        console.log('Users collection changed, checking for profile updates...');
        
        const changedUsers = snapshot.docChanges().map(change => ({
          type: change.type,
          data: { id: change.doc.id, ...change.doc.data() } as User
        }));

        // Only process modified users (not added/deleted)
        const modifiedUsers = changedUsers.filter(change => change.type === 'modified');

        if (modifiedUsers.length > 0) {
          console.log(`Found ${modifiedUsers.length} user profile changes, syncing...`);
          
          // Sync each modified user
          for (const change of modifiedUsers) {
            try {
              await syncUserProfileToMembers(change.data.email);
              console.log(`Synced profile for user: ${change.data.email}`);
            } catch (error) {
              console.error(`Error syncing user ${change.data.email}:`, error);
            }
          }
        }
      },
      (error) => {
        console.error('Error in user profile listener:', error);
      }
    );

    this.unsubscribeFunctions.push(unsubscribe);
  }

  /**
   * Listen for changes in members collection
   */
  private async setupMemberListeners(): Promise<void> {
    console.log('Setting up member listeners...');

    const membersRef = collection(db, 'members');
    const membersQuery = query(membersRef);

    const unsubscribe = onSnapshot(
      membersQuery,
      async (snapshot) => {
        console.log('Members collection changed, checking for updates...');
        
        const changedMembers = snapshot.docChanges().map(change => ({
          type: change.type,
          data: { id: change.doc.id, ...change.doc.data() } as Member
        }));

        // Handle deleted members
        const deletedMembers = changedMembers.filter(change => change.type === 'removed');
        
        if (deletedMembers.length > 0) {
          console.log(`Found ${deletedMembers.length} deleted members, updating committees...`);
          
          for (const change of deletedMembers) {
            try {
              await this.removeMemberFromCommittee(change.data.committeeId, change.data.id);
              console.log(`Removed member ${change.data.id} from committee ${change.data.committeeId}`);
            } catch (error) {
              console.error(`Error removing member from committee:`, error);
            }
          }
        }

        // Handle modified members (role changes, etc.)
        const modifiedMembers = changedMembers.filter(change => change.type === 'modified');
        
        if (modifiedMembers.length > 0) {
          console.log(`Found ${modifiedMembers.length} modified members, updating committees...`);
          
          for (const change of modifiedMembers) {
            try {
              await this.updateMemberInCommittee(change.data);
              console.log(`Updated member ${change.data.id} in committee`);
            } catch (error) {
              console.error(`Error updating member in committee:`, error);
            }
          }
        }
      },
      (error) => {
        console.error('Error in member listener:', error);
      }
    );

    this.unsubscribeFunctions.push(unsubscribe);
  }

  /**
   * Remove a member from their committee's member list
   */
  private async removeMemberFromCommittee(committeeId: string, memberId: string): Promise<void> {
    if (!committeeId) return;

    try {
      const committeeRef = doc(db, 'committees', committeeId);
      const committeeDoc = await getDoc(committeeRef);

      if (committeeDoc.exists()) {
        const committeeData = committeeDoc.data() as Committee;
        const updatedMembers = committeeData.members.filter(id => id !== memberId);

        await updateDoc(committeeRef, {
          members: updatedMembers,
          updatedAt: new Date()
        });

        console.log(`Removed member ${memberId} from committee ${committeeId}`);
      }
    } catch (error) {
      console.error('Error removing member from committee:', error);
      throw error;
    }
  }

  /**
   * Update member information in their committee
   */
  private async updateMemberInCommittee(member: Member): Promise<void> {
    if (!member.committeeId) return;

    try {
      const committeeRef = doc(db, 'committees', member.committeeId);
      const committeeDoc = await getDoc(committeeRef);

      if (committeeDoc.exists()) {
        const committeeData = committeeDoc.data() as Committee;
        
        // Ensure member is in the committee's member list
        if (!committeeData.members.includes(member.id)) {
          const updatedMembers = [...committeeData.members, member.id];
          await updateDoc(committeeRef, {
            members: updatedMembers,
            updatedAt: new Date()
          });
          console.log(`Added member ${member.id} to committee ${member.committeeId}`);
        }
      }
    } catch (error) {
      console.error('Error updating member in committee:', error);
      throw error;
    }
  }

  /**
   * Manual sync trigger for testing or emergency use
   */
  public async triggerManualSync(): Promise<void> {
    console.log('Triggering manual sync...');
    try {
      await syncAcceptedApplicationsToMembers();
      await removeRejectedMembers();
      console.log('Manual sync completed');
    } catch (error) {
      console.error('Error in manual sync:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  public getStatus(): { isInitialized: boolean; activeListeners: number } {
    return {
      isInitialized: this.isInitialized,
      activeListeners: this.unsubscribeFunctions.length
    };
  }
}

// Export singleton instance
export const realtimeMemberSync = new RealtimeMemberSync();
