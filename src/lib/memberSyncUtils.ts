import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db } from './firebase';
import { syncUserProfileToMembers } from './syncMembers';

/**
 * Sets up real-time listeners for user profile changes
 * Automatically syncs member data when users update their profiles
 */
export function setupUserProfileSync(): () => void {
  console.log('Setting up user profile sync listeners...');
  
  const unsubscribeFunctions: (() => void)[] = [];

  // Listen to all users collection changes
  const usersRef = collection(db, 'users');
  
  const unsubscribe = onSnapshot(usersRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        const userData = change.doc.data();
        const userEmail = change.doc.id;
        
        console.log(`User profile updated: ${userEmail}`);
        
        // Sync the updated profile to all member records
        syncUserProfileToMembers(userEmail).catch((error) => {
          console.error(`Error syncing profile for ${userEmail}:`, error);
        });
      }
    });
  });

  unsubscribeFunctions.push(unsubscribe);

  // Return cleanup function
  return () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    console.log('User profile sync listeners cleaned up');
  };
}

/**
 * Manual sync function for admin use
 */
export async function manualSyncAllMembers(): Promise<void> {
  try {
    console.log('Starting manual member sync...');
    const { runCompleteMemberSync } = await import('./syncMembers');
    await runCompleteMemberSync();
    console.log('Manual member sync completed');
  } catch (error) {
    console.error('Error in manual sync:', error);
    throw error;
  }
}

/**
 * Sync specific user's profile to members
 */
export async function manualSyncUser(userEmail: string): Promise<void> {
  try {
    console.log(`Starting manual sync for user: ${userEmail}`);
    const { syncUserProfileToMembers } = await import('./syncMembers');
    await syncUserProfileToMembers(userEmail);
    console.log(`Manual sync completed for user: ${userEmail}`);
  } catch (error) {
    console.error(`Error syncing user ${userEmail}:`, error);
    throw error;
  }
}
