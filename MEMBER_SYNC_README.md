# Member Sync System

This system automatically syncs accepted applications from the `applications` collection to the team members, ensuring the team page always shows up-to-date member information.

## 🚀 Features

- **Automatic Sync**: Syncs accepted applications to members collection
- **Real-time Updates**: Automatically updates member profiles when users change their photos
- **Email Linking**: Links applications and users by email address
- **Committee Management**: Updates committee member arrays automatically
- **Admin Interface**: Easy-to-use admin panel for manual sync operations

## 📁 Files Created

### Core System
- `src/lib/syncMembers.ts` - Main sync logic
- `src/lib/memberSyncUtils.ts` - Real-time sync utilities
- `src/app/api/sync-members/route.ts` - API endpoints

### UI Components
- `src/components/admin/MemberSyncPanel.tsx` - Admin interface
- `src/components/MemberSyncInitializer.tsx` - Auto-sync setup

### Testing
- `test-sync.js` - Test script for the sync system

## 🔧 Setup Complete

### ✅ What's Been Done

1. **Admin Panel Integration**
   - Added "Member Sync" tab to `/admin`
   - Integrated `MemberSyncPanel` component
   - Added navigation between Events, Member Sync, and Registrations

2. **Real-time Sync Setup**
   - Added `MemberSyncInitializer` to app layout
   - Automatic profile change detection
   - Live updates when users change photos

3. **API Endpoints**
   - `POST /api/sync-members` with actions:
     - `sync-all`: Sync all accepted applications
     - `sync-user`: Sync specific user profile

## 🎯 How It Works

### Data Flow
```
Applications Collection (status: "accepted")
    ↓ (email linking)
Users Collection (photoURL, displayName)
    ↓ (sync process)
Members Collection (profilePicture, fullName)
    ↓ (committee update)
Committees Collection (members array)
```

### Sync Process
1. **Find accepted applications** where `status === "accepted"`
2. **Link by email** to users collection
3. **Create/update member records** with:
   - `profilePicture` from users collection
   - `linkedInUrl` from applications collection
   - `fullName` from applications or users
4. **Update committee** members arrays
5. **Remove rejected members** automatically

## 🚀 Usage

### Admin Panel
1. Go to `/admin`
2. Click "Member Sync" tab
3. Use "Sync All Members" to process all applications
4. Use "Sync User Profile" for individual users

### API Usage
```bash
# Sync all members
curl -X POST /api/sync-members -d '{"action":"sync-all"}'

# Sync specific user
curl -X POST /api/sync-members -d '{"action":"sync-user","userEmail":"user@example.com"}'
```

### Testing
```bash
# Run test script (when server is running)
node test-sync.js
```

## 🔄 Real-time Features

- **Auto-sync**: Profile changes sync automatically
- **Photo updates**: Member photos update when users change profile pictures
- **Live monitoring**: Real-time listeners on users collection
- **Cleanup**: Automatic cleanup of listeners to prevent memory leaks

## 📊 Data Structure

### Member Record
```typescript
{
  id: string;           // email_committeeId
  fullName: string;      // from application or user
  email: string;        // linking field
  role: string;         // default: "member"
  profilePicture?: string; // from users.photoURL
  linkedInUrl?: string; // from application
  committeeId: string;   // selectedCommittee
  isActive: boolean;    // true
  createdAt: Date;
  updatedAt: Date;
}
```

## 🎉 Ready to Use!

The system is now fully set up and ready to use. When you run your Next.js server:

1. **Real-time sync** will start automatically
2. **Admin panel** will have the Member Sync tab
3. **API endpoints** will be available
4. **Team page** will show synced members with current photos

The system ensures your team page always displays the most up-to-date member information!
