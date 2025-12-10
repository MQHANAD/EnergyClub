#!/usr/bin/env node

/**
 * Test script for member sync system
 * Run this to test the sync functionality
 */

const API_BASE = 'http://localhost:3000';

async function testSyncAPI() {
  console.log('🔄 Testing Member Sync API...\n');

  try {
    // Test 1: Check API status
    console.log('1. Checking API status...');
    const statusResponse = await fetch(`${API_BASE}/api/sync-members`);
    const statusData = await statusResponse.json();
    console.log('✅ API Status:', statusData.message);

    // Test 2: Run full sync
    console.log('\n2. Running full member sync...');
    const syncResponse = await fetch(`${API_BASE}/api/sync-members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'sync-all' }),
    });

    const syncData = await syncResponse.json();
    
    if (syncData.success) {
      console.log('✅ Full sync completed:', syncData.message);
    } else {
      console.log('❌ Full sync failed:', syncData.error);
    }

    // Test 3: Test individual user sync (if you have a test email)
    console.log('\n3. Testing individual user sync...');
    const testEmail = 'test@example.com'; // Replace with actual email
    const userSyncResponse = await fetch(`${API_BASE}/api/sync-members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'sync-user',
        userEmail: testEmail
      }),
    });

    const userSyncData = await userSyncResponse.json();
    
    if (userSyncData.success) {
      console.log('✅ User sync completed:', userSyncData.message);
    } else {
      console.log('⚠️  User sync result:', userSyncData.error || userSyncData.message);
    }

    console.log('\n🎉 Sync system test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to /admin and click on "Member Sync" tab');
    console.log('2. Use the sync buttons to manage members');
    console.log('3. Check /team to see synced members');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your Next.js server is running:');
    console.log('   npm run dev');
  }
}

// Run the test
testSyncAPI();
