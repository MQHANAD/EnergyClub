'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MemberInfo {
  id: string;
  fullName: string;
  role: string;
  committeeId: string;
  committeeName?: string;
  email: string;
  profilePicture?: string;
  isMember: boolean;
}

export function useMember() {
  const { user, loading: authLoading } = useAuth();
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemberInfo = async () => {
      if (authLoading) {
        return;
      }

      if (!user?.email) {
        setMemberInfo(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Query members collection by email (same logic as profile page)
        // Also check by userId (user.uid) if the document has a userId field
        const membersColl = collection(db, 'members');
        let memberQuery = query(membersColl, where('email', '==', user.email));
        let memberSnap = await getDocs(memberQuery);
        
        // If no match by email, try userId (user.uid) as fallback
        if (memberSnap.empty && user.uid) {
          memberQuery = query(membersColl, where('userId', '==', user.uid));
          memberSnap = await getDocs(memberQuery);
        }

        if (!memberSnap.empty) {
          const memberData = memberSnap.docs[0].data();
          
          // Get committee name if committeeId exists
          let committeeName: string | undefined;
          if (memberData.committeeId) {
            const committeeRef = doc(db, 'committees', memberData.committeeId);
            const committeeDoc = await getDoc(committeeRef);
            if (committeeDoc.exists()) {
              committeeName = committeeDoc.data().name;
            }
          }

          setMemberInfo({
            id: memberSnap.docs[0].id,
            fullName: memberData.fullName || user.displayName || user.email.split('@')[0],
            role: memberData.role || 'Member',
            committeeId: memberData.committeeId || '',
            committeeName,
            email: user.email,
            profilePicture: memberData.profilePicture || user.photoURL || undefined,
            isMember: true
          });
        } else {
          setMemberInfo({
            id: user.email,
            fullName: user.displayName || user.email.split('@')[0],
            role: 'User',
            committeeId: '',
            email: user.email,
            isMember: false
          });
        }
      } catch (err) {
        console.error('Error fetching member info:', err);
        setError('Failed to load member information');
        setMemberInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberInfo();
  }, [user, authLoading]);

  return {
    memberInfo,
    isMember: memberInfo?.isMember ?? false,
    loading: loading || authLoading,
    error
  };
}

