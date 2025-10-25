'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sync, User, Users, Loader2 } from 'lucide-react';

interface SyncStatus {
  loading: boolean;
  success: boolean;
  error: string | null;
  message: string | null;
}

export function MemberSyncPanel() {
  const [syncAllStatus, setSyncAllStatus] = useState<SyncStatus>({
    loading: false,
    success: false,
    error: null,
    message: null
  });

  const [syncUserStatus, setSyncUserStatus] = useState<SyncStatus>({
    loading: false,
    success: false,
    error: null,
    message: null
  });

  const [userEmail, setUserEmail] = useState('');

  const syncAllMembers = async () => {
    setSyncAllStatus({ loading: true, success: false, error: null, message: null });
    
    try {
      const response = await fetch('/api/sync-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'sync-all' }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncAllStatus({
          loading: false,
          success: true,
          error: null,
          message: data.message
        });
      } else {
        setSyncAllStatus({
          loading: false,
          success: false,
          error: data.error,
          message: null
        });
      }
    } catch (error) {
      setSyncAllStatus({
        loading: false,
        success: false,
        error: 'Network error occurred',
        message: null
      });
    }
  };

  const syncUserProfile = async () => {
    if (!userEmail.trim()) {
      setSyncUserStatus({
        loading: false,
        success: false,
        error: 'Please enter a user email',
        message: null
      });
      return;
    }

    setSyncUserStatus({ loading: true, success: false, error: null, message: null });
    
    try {
      const response = await fetch('/api/sync-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'sync-user',
          userEmail: userEmail.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncUserStatus({
          loading: false,
          success: true,
          error: null,
          message: data.message
        });
        setUserEmail(''); // Clear the input
      } else {
        setSyncUserStatus({
          loading: false,
          success: false,
          error: data.error,
          message: null
        });
      }
    } catch (error) {
      setSyncUserStatus({
        loading: false,
        success: false,
        error: 'Network error occurred',
        message: null
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Member Sync Management
        </h2>
        <p className="text-gray-600">
          Sync members from accepted applications and keep profiles updated
        </p>
      </div>

      {/* Sync All Members */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sync All Members
              </h3>
              <p className="text-sm text-gray-600">
                Sync all accepted applications to members and remove rejected ones
              </p>
            </div>
          </div>
          <Button
            onClick={syncAllMembers}
            disabled={syncAllStatus.loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {syncAllStatus.loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sync className="w-4 h-4 mr-2" />
            )}
            {syncAllStatus.loading ? 'Syncing...' : 'Sync All'}
          </Button>
        </div>

        {/* Status Messages */}
        {syncAllStatus.message && (
          <div className={`p-3 rounded-lg text-sm ${
            syncAllStatus.success 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {syncAllStatus.message}
          </div>
        )}

        {syncAllStatus.error && (
          <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
            Error: {syncAllStatus.error}
          </div>
        )}
      </Card>

      {/* Sync Individual User */}
      <Card className="p-6">
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-3">
            <User className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sync User Profile
              </h3>
              <p className="text-sm text-gray-600">
                Sync a specific user's profile changes to their member records
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="userEmail">User Email</Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button
            onClick={syncUserProfile}
            disabled={syncUserStatus.loading || !userEmail.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {syncUserStatus.loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sync className="w-4 h-4 mr-2" />
            )}
            {syncUserStatus.loading ? 'Syncing...' : 'Sync User'}
          </Button>
        </div>

        {/* Status Messages */}
        {syncUserStatus.message && (
          <div className={`p-3 rounded-lg text-sm mt-4 ${
            syncUserStatus.success 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {syncUserStatus.message}
          </div>
        )}

        {syncUserStatus.error && (
          <div className="p-3 rounded-lg text-sm mt-4 bg-red-50 text-red-700 border border-red-200">
            Error: {syncUserStatus.error}
          </div>
        )}
      </Card>

      {/* Information Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="text-lg font-semibold text-blue-900 mb-2">
          Real-time Member Sync System
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>🔄 Automatic Sync Events:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• <strong>New Applications Accepted:</strong> Automatically creates member records</li>
            <li>• <strong>Profile Changes:</strong> Real-time sync when users update photos, names, or LinkedIn</li>
            <li>• <strong>Member Updates:</strong> Automatically updates committee member lists</li>
            <li>• <strong>Member Removal:</strong> Cleans up committee lists when members are deleted</li>
          </ul>
          
          <p className="mt-3"><strong>🛠️ Manual Sync Options:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• <strong>Sync All:</strong> Processes all accepted applications and creates/updates member records</li>
            <li>• <strong>Sync User:</strong> Updates member records for a specific user's profile changes</li>
          </ul>
          
          <p className="mt-3"><strong>📋 Data Sources:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• <strong>LinkedIn:</strong> Taken from application data</li>
            <li>• <strong>Photos:</strong> Always synced from users collection</li>
            <li>• <strong>Committee:</strong> Matched by name from applications to committees</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
