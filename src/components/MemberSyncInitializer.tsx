'use client';

import { useEffect } from 'react';
import { realtimeMemberSync } from '@/lib/realtimeMemberSync';

export function MemberSyncInitializer() {
  useEffect(() => {
    console.log('Initializing comprehensive member sync...');
    
    // Initialize the comprehensive real-time sync service
    realtimeMemberSync.initialize().catch(error => {
      console.error('Failed to initialize member sync:', error);
    });
    
    return () => {
      console.log('Cleaning up comprehensive member sync...');
      realtimeMemberSync.cleanup();
    };
  }, []);

  return null; // This component doesn't render anything
}
