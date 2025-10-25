import { NextRequest, NextResponse } from 'next/server';
import { realtimeMemberSync } from '@/lib/realtimeMemberSync';

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    console.log(`Manual sync triggered: ${action}`);

    switch (action) {
      case 'trigger-manual-sync':
        await realtimeMemberSync.triggerManualSync();
        return NextResponse.json({
          success: true,
          message: 'Manual sync completed successfully'
        });

      case 'get-sync-status':
        const status = realtimeMemberSync.getStatus();
        return NextResponse.json({
          success: true,
          status: status
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "trigger-manual-sync" or "get-sync-status"'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in manual sync API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
