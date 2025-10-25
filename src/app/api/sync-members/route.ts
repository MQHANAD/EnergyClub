import { NextRequest, NextResponse } from 'next/server';
import { runCompleteMemberSync, syncUserProfileToMembers } from '@/lib/syncMembers';

/**
 * API route to sync members from applications
 * POST /api/sync-members
 */
export async function POST(request: NextRequest) {
  try {
    const { action, userEmail } = await request.json();

    switch (action) {
      case 'sync-all':
        await runCompleteMemberSync();
        return NextResponse.json({ 
          success: true, 
          message: 'All members synced successfully' 
        });

      case 'sync-user':
        if (!userEmail) {
          return NextResponse.json({ 
            success: false, 
            error: 'userEmail is required for sync-user action' 
          }, { status: 400 });
        }
        await syncUserProfileToMembers(userEmail);
        return NextResponse.json({ 
          success: true, 
          message: `User ${userEmail} profile synced successfully` 
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Use "sync-all" or "sync-user"' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in sync API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check sync status
 */
export async function GET() {
  return NextResponse.json({ 
    message: 'Member sync API is running',
    endpoints: {
      'POST /api/sync-members': {
        actions: ['sync-all', 'sync-user'],
        description: 'Sync members from applications or user profiles'
      }
    }
  });
}
