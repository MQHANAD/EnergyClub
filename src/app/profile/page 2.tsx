'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/register/LoadingSpinner';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { 
  User, 
  Edit3, 
  Save, 
  X, 
  Camera, 
  Mail, 
  Users, 
  ExternalLink,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MemberData {
  id: string;
  fullName: string;
  role: string;
  committeeId: string;
  committeeName?: string;
  profilePicture?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  email: string;
  isMember: boolean;
}

function ProfileContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { t } = useI18n();
  
  // State management
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    displayName: '',
    linkedInUrl: '',
    portfolioUrl: '',
    profilePicture: ''
  });
  
  // File upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !authLoading) {
      fetchMemberData();
    }
  }, [user, authLoading]);

  const fetchMemberData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.email) {
        setError('User email not found');
        return;
      }

      // Get user profile data by UID (avoid duplicate user docs keyed by email)
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      let userData;
      if (!userDoc.exists()) {
        // Create user profile if it doesn't exist (keyed by UID)
        console.log(`Creating user profile for UID: ${user.uid}`);
        userData = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || null,
          linkedIn: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(userRef, userData);
      } else {
        userData = userDoc.data();
      }
      
      // Get member data from members collection by email (doc id may not be email)
      const membersColl = collection(db, 'members');
      const memberQuery = query(membersColl, where('email', '==', user.email));
      const memberSnap = await getDocs(memberQuery);
      
      let memberInfo: MemberData = {
        id: user.email,
        fullName: userData.displayName || user.email.split('@')[0],
        role: 'User',
        committeeId: '',
        email: user.email,
        profilePicture: userData.photoURL || null,
        linkedInUrl: userData.linkedIn || null,
        isMember: false
      };

      if (!memberSnap.empty) {
        const memberData = memberSnap.docs[0].data();
        memberInfo = {
          ...memberInfo,
          fullName: memberData.fullName || userData.displayName || user.email.split('@')[0],
          role: memberData.role || 'Member',
          committeeId: memberData.committeeId || '',
          profilePicture: memberData.profilePicture || userData.photoURL || null,
          linkedInUrl: memberData.linkedInUrl || userData.linkedIn || null,
          portfolioUrl: memberData.portfolioUrl || userData.portfolioUrl || null,
          isMember: true
        };

        // Get committee name
        if (memberData.committeeId) {
          const committeeRef = doc(db, 'committees', memberData.committeeId);
          const committeeDoc = await getDoc(committeeRef);
          if (committeeDoc.exists()) {
            memberInfo.committeeName = committeeDoc.data().name;
          }
        }
      } else {
        // If user is not a member, use role from users when available
        if (userData.role) {
          memberInfo.role = userData.role;
        }
      }

      setMemberData(memberInfo);
      setFormData({
        displayName: memberInfo.fullName,
        linkedInUrl: memberInfo.linkedInUrl || '',
        portfolioUrl: memberInfo.portfolioUrl || '',
        profilePicture: memberInfo.profilePicture || ''
      });
    } catch (err) {
      console.error('Error fetching member data:', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
    // Reset form data to original values
    if (memberData) {
      setFormData({
        displayName: memberData.fullName,
        linkedInUrl: memberData.linkedInUrl || '',
        portfolioUrl: memberData.portfolioUrl || '',
        profilePicture: memberData.profilePicture || ''
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const storage = getStorage();
    const fileName = `profile-pictures/${user?.email}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      if (!user?.email) {
        setError('User email not found');
        return;
      }

      let newProfilePicture = formData.profilePicture;

      // Upload new image if selected
      if (selectedFile) {
        setIsUploading(true);
        try {
          newProfilePicture = await uploadImage(selectedFile);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          setError('Failed to upload image');
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Update user document (keyed by UID)
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        photoURL: newProfilePicture,
        linkedIn: formData.linkedInUrl,
        portfolioUrl: formData.portfolioUrl || null,
        updatedAt: new Date()
      });

      // Update member document if exists (do not create new member docs for non-members)
      const memberQueryForUpdate = query(collection(db, 'members'), where('email', '==', user.email));
      const memberSnapForUpdate = await getDocs(memberQueryForUpdate);
      if (!memberSnapForUpdate.empty) {
        const memberRef = doc(db, 'members', memberSnapForUpdate.docs[0].id);
        await updateDoc(memberRef, {
          fullName: formData.displayName,
          profilePicture: newProfilePicture,
          linkedInUrl: formData.linkedInUrl,
          portfolioUrl: formData.portfolioUrl || null,
          updatedAt: new Date()
        });
      }

      // Update local state immediately
      setMemberData(prev => prev ? {
        ...prev,
        fullName: formData.displayName,
        profilePicture: newProfilePicture,
        linkedInUrl: formData.linkedInUrl,
        portfolioUrl: formData.portfolioUrl
      } : null);

      setIsEditing(false);
      setSelectedFile(null);
      setSuccess('Profile updated successfully! Changes will appear on the team page shortly.');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-24 pb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-light text-gray-900 mb-2">
                Profile Not Found
              </h1>
              <p className="text-gray-600">
                {error || 'Unable to load your profile information.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-light text-gray-900 mb-2">
              My Profile
            </h1>
            <p className="text-gray-600 font-light">
              Manage your personal information and profile settings
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Profile Card */}
          <Card className="p-8 bg-white border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Profile Picture Section */}
              <div className="flex-shrink-0 text-center lg:text-left">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto lg:mx-0">
                    <OptimizedImage
                      src={memberData.profilePicture}
                      alt={memberData.fullName}
                      className="w-full h-full object-cover"
                      fallbackText={memberData.fullName}
                      size={128}
                    />
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {isEditing && (
                  <div className="mt-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {selectedFile && (
                      <p className="text-sm text-blue-600 mt-2">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Information */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <Label className="text-gray-700 font-medium flex items-center mb-2">
                      <User className="w-4 h-4 mr-2" />
                      Full Name
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="Enter your full name"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-light">{memberData.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label className="text-gray-700 font-medium flex items-center mb-2">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Label>
                    <p className="text-gray-900 font-light">{memberData.email}</p>
                  </div>

                  {/* Role */}
                  <div>
                    <Label className="text-gray-700 font-medium flex items-center mb-2">
                      <User className="w-4 h-4 mr-2" />
                      Role
                    </Label>
                    <p className="text-gray-900 font-light">{memberData.role}</p>
                  </div>

                  {/* Committee - Only show for members */}
                  {memberData.isMember && (
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center mb-2">
                        <Users className="w-4 h-4 mr-2" />
                        Committee
                      </Label>
                      <p className="text-gray-900 font-light">
                        {memberData.committeeName || 'Not assigned'}
                      </p>
                    </div>
                  )}

                  {/* LinkedIn */}
                  <div className={memberData.isMember ? "md:col-span-2" : "md:col-span-1"}>
                    <Label className="text-gray-700 font-medium flex items-center mb-2">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      LinkedIn Profile
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.linkedInUrl}
                        onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex items-center">
                        {memberData.linkedInUrl ? (
                          <a
                            href={memberData.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-light flex items-center"
                          >
                            {memberData.linkedInUrl}
                            <ExternalLink className="w-4 h-4 ml-1" />
                          </a>
                        ) : (
                          <p className="text-gray-500 font-light">No LinkedIn profile</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Portfolio */}
                  <div className={memberData.isMember ? "md:col-span-2" : "md:col-span-1"}>
                    <Label className="text-gray-700 font-medium flex items-center mb-2">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Portfolio
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.portfolioUrl}
                        onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                        placeholder="https://yourportfolio.com"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex items-center">
                        {memberData.portfolioUrl ? (
                          <a
                            href={memberData.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-light flex items-center"
                          >
                            {memberData.portfolioUrl}
                            <ExternalLink className="w-4 h-4 ml-1" />
                          </a>
                        ) : (
                          <p className="text-gray-500 font-light">No portfolio added</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-4">
                  {!isEditing ? (
                    <Button onClick={handleEdit} className="flex items-center">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving || isUploading}
                        className="flex items-center bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving || isUploading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        onClick={handleCancel} 
                        variant="outline"
                        className="flex items-center"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
