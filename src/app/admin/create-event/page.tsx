'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { eventsApi } from '@/lib/firestore';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask, UploadTaskSnapshot } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { EventFormData } from '@/types';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/i18n/index';

export default function CreateEventPage() {
  const { user, userProfile, isOrganizer } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: '',
    location: '',
    maxAttendees: 50,
    tags: [],
    imageUrl: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Utility: add timeout to async ops (upload/create)
  const withTimeout = async <T,>(promise: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        try { if (onTimeout) { onTimeout(); } } catch {}
        reject(new Error(`Operation timed out after ${ms}ms`));
      }, ms);
      promise.then(
        (val) => { clearTimeout(timer); resolve(val); },
        (err) => { clearTimeout(timer); reject(err); }
      );
    });
  };

  // Progress-aware timeout wrapper
  const wrapUploadWithTimeout = async (uploadTask: UploadTask, ms: number, onProgress?: (pct: number) => void): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = null;

      const resetTimer = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          try { uploadTask.cancel(); } catch {}
          reject(new Error(`Upload timed out after ${ms}ms`));
        }, ms);
      };

      resetTimer();

      const unsubscribe = uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          try {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(pct);
            if (onProgress) { onProgress(pct); }
          } catch {}
          resetTimer();
        },
        (err: any) => {
          if (timer) clearTimeout(timer);
          unsubscribe();
          console.error("🔥 Upload error:", err.code, err.message); 
          reject(err);
        },
        async () => {
          if (timer) clearTimeout(timer);
          unsubscribe();
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (e) {
            reject(e as Error);
          }
        }
      );
    });
  };

  // Upload helper
  const uploadImage = async (file: File): Promise<string> => {
    setUploadError(null);
    const storagePath = `events/${user?.uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath); 
    const metadata = { contentType: file.type || 'application/octet-stream' };
    const task = uploadBytesResumable(storageRef, file, metadata);
    const url = await wrapUploadWithTimeout(task, 60000);
    return url;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxAttendees' ? parseInt(value) || 0 : value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError(null);
    setUploadError(null);
    setUploadedUrl(null);

    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress(0);
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, WEBP, GIF).');
      return;
    }
    if (file.size > maxSize) {
      setError('Image size must be 5MB or less.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      if (url && url.length <= 500) {
        setUploadedUrl(url);
      } else {
        setUploadError('Generated image URL is too long; skipping image.');
        setUploadedUrl(null);
      }
    } catch (err: any) {
      console.error('🔥 Immediate image upload failed:', err.code, err.message); // ✅ اطبع تفاصيل
      setUploadError(err.message || 'Image upload failed.');
      setUploadedUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userProfile) return;

    try {
      setError(null);

      // Validation
      if (!formData.title || !formData.description || !formData.date || !formData.location) {
        setError('Please fill in all required fields.');
        return;
      }

      if (formData.maxAttendees <= 0) {
        setError('Maximum attendees must be greater than 0.');
        return;
      }

      const MAX = {
        title: 200,
        description: 2000,
        location: 200,
        imageUrl: 500,
        tagsCount: 10,
      };

      if (formData.title.length > MAX.title) {
        setError(`Title is too long (max ${MAX.title} characters).`);
        return;
      }
      if (formData.description.length > MAX.description) {
        setError(`Description is too long (max ${MAX.description} characters).`);
        return;
      }
      if (formData.location.length > MAX.location) {
        setError(`Location is too long (max ${MAX.location} characters).`);
        return;
      }
      if (formData.tags.length > MAX.tagsCount) {
        setError(`Too many tags (max ${MAX.tagsCount}). Please remove some.`);
        return;
      }

      if (isUploading) {
        setError('Image upload in progress. Please wait for it to finish or remove the image.');
        return;
      }

      setLoading(true);

      // Upload image if needed
      let uploadedUrlLocal: string | undefined = uploadedUrl ?? undefined;
      if (imageFile && !uploadedUrlLocal) {
        setIsUploading(true);
        try {
          const storagePath = `events/${user.uid}/${Date.now()}_${imageFile.name}`;
          const storageRef = ref(storage, storagePath); // ✅
          const metadata = { contentType: imageFile.type || 'application/octet-stream' };
          const uploadTask = uploadBytesResumable(storageRef, imageFile, metadata);

          const url = await wrapUploadWithTimeout(uploadTask, 60000);
          uploadedUrlLocal = url;

          if (uploadedUrlLocal && uploadedUrlLocal.length > 500) {
            console.warn('Image URL exceeds 500 chars; skipping imageUrl to satisfy rules.');
            uploadedUrlLocal = undefined;
          }
        } catch (uploadErr: any) {
          console.error('🔥 Image upload failed; proceeding without image:', uploadErr.code, uploadErr.message);
          setUploadError('Image upload failed; the event will be created without an image.');
          uploadedUrlLocal = undefined;
        } finally {
          setIsUploading(false);
        }
      }

      const baseEventData = {
        title: formData.title,
        description: formData.description,
        date: new Date(formData.date),
        location: formData.location,
        maxAttendees: formData.maxAttendees,
        organizerId: user.uid,
        organizerName: userProfile.displayName,
        status: 'active' as const,
        tags: formData.tags,
      };
      const eventData = uploadedUrlLocal ? { ...baseEventData, imageUrl: uploadedUrlLocal } : baseEventData;

      await withTimeout(eventsApi.createEvent(eventData), 30000);
      router.push('/admin');
    } catch (error: any) {
      console.error('🔥 Error creating event:', error.code, error.message);
      setError(error.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isOrganizer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-[url('/BG.PNG')] bg-cover bg-center bg-fixed">
      <Navigation />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Button onClick={() => router.back()} variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('admin.createPage.backToAdmin')}
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('admin.createPage.pageTitle')}
            </h1>
            <p className="text-gray-600">
              {t('admin.createPage.subtitle')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.createPage.infoTitle')}</CardTitle>
              <CardDescription>
                {t('admin.createPage.infoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="title">{t('admin.createPage.labels.title')}</Label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={t('admin.createPage.labels.placeholders.title')}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">{t('admin.createPage.labels.description')}</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={t('admin.createPage.labels.placeholders.description')}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">{t('admin.createPage.labels.dateTime')}</Label>
                    <input
                      type="datetime-local"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">{t('admin.createPage.labels.location')}</Label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={t('admin.createPage.labels.placeholders.location')}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxAttendees">{t('admin.createPage.labels.maxAttendees')}</Label>
                    <input
                      type="number"
                      id="maxAttendees"
                      name="maxAttendees"
                      value={formData.maxAttendees}
                      onChange={handleInputChange}
                      min="1"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="imageFile">{t('admin.createPage.labels.imageUrl')}</Label>
                    <input
                      type="file"
                      id="imageFile"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-32 rounded-md object-cover"
                        />
                      </div>
                    )}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2 text-sm text-gray-600">{uploadProgress}%</div>
                    )}
                    {uploadError && (
                      <div className="mt-2 text-sm text-amber-600">{uploadError}</div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">{t('admin.createPage.labels.tags')}</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={t('admin.createPage.labels.placeholders.tag')}
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      {t('admin.createPage.labels.add')}
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    onClick={() => router.back()}
                    variant="outline"
                    disabled={loading}
                  >
                    {t('admin.createPage.labels.cancel')}
                  </Button>
                  <Button type="submit" disabled={loading || isUploading}>
                    {loading ? (
                      <>
                        <span className="loading loading-infinity loading-xl"></span>
                        {t('admin.createPage.labels.creating')}
                      </>
                    ) : (
                      t('admin.createPage.labels.createEvent')
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}