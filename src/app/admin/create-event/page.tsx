"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { eventsApi } from "@/lib/firestore";
import LoadingSpinner from "@/components/register/LoadingSpinner";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTask,
  UploadTaskSnapshot,
  getStorage,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import { EventFormData, EventQuestion } from "@/types";
import Navigation from "@/components/Navigation";
import QuestionBuilder from "@/components/admin/QuestionBuilder";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { ArrowLeft, X, Upload } from "lucide-react";
import { useI18n } from "@/i18n/index";

export default function CreateEventPage() {
  const { user, userProfile, isOrganizer } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    maxAttendees: 50,
    tags: [],
    imageUrls: [],
  });

  const [requireStudentId, setRequireStudentId] = useState(false);
  const [questions, setQuestions] = useState<EventQuestion[]>([]);

  // Team registration state
  const [isTeamEvent, setIsTeamEvent] = useState(false);
  const [minTeamSize, setMinTeamSize] = useState(2);
  const [maxTeamSize, setMaxTeamSize] = useState(10);
  const [memberQuestions, setMemberQuestions] = useState<EventQuestion[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image upload state
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Utility: add timeout to async ops (upload/create)
  const withTimeout = async <T,>(
    promise: Promise<T>,
    ms: number,
    onTimeout?: () => void
  ): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        try {
          if (onTimeout) {
            onTimeout();
          }
        } catch { }
        reject(new Error(`Operation timed out after ${ms}ms`));
      }, ms);
      promise.then(
        (val) => {
          clearTimeout(timer);
          resolve(val);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        }
      );
    });
  };

  // Progress-aware timeout wrapper
  const wrapUploadWithTimeout = async (
    uploadTask: UploadTask,
    ms: number,
    onProgress?: (pct: number) => void
  ): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = null;

      const resetTimer = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            uploadTask.cancel();
          } catch { }
          reject(new Error(`Upload timed out after ${ms}ms`));
        }, ms);
      };

      resetTimer();

      const unsubscribe = uploadTask.on(
        "state_changed",
        (snapshot: UploadTaskSnapshot) => {
          try {
            const pct = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setUploadProgress(`${pct}%`);
            if (onProgress) {
              onProgress(pct);
            }
          } catch { }
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

  // Photo upload helper
  const handlePhotoUpload = async (files: FileList) => {
    if (!user) return;

    const totalPhotos = formData.imageUrls.length + files.length;
    if (totalPhotos > 10) {
      alert("Maximum 10 photos allowed.");
      return;
    }

    setUploadProgress("Uploading...");
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          // 5MB limit
          alert("File size too large. Max 5MB per file.");
          continue;
        }

        const fileName = `events/${user.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        newUrls.push(downloadURL);
      }

      setFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...newUrls],
      }));
      setUploadProgress(null);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress(null);
      alert("Upload failed. Please try again.");
    }
  };

  // Photo remove helper
  const handlePhotoRemove = async (index: number) => {
    if (!user) return;

    const urlToRemove = formData.imageUrls[index];
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));

    // Try to delete from storage
    try {
      const storage = getStorage();
      const fileRef = ref(storage, urlToRemove);
      await deleteObject(fileRef);
    } catch (error) {
      console.warn("Could not delete file from storage:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "maxAttendees" ? parseInt(value) || 0 : value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userProfile) return;

    try {
      setError(null);

      // Validation
      if (
        !formData.title ||
        !formData.description ||
        !formData.startDate ||
        !formData.location
      ) {
        setError("Please fill in all required fields.");
        return;
      }

      if (formData.maxAttendees <= 0) {
        setError("Maximum attendees must be greater than 0.");
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
        setError(
          `Description is too long (max ${MAX.description} characters).`
        );
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

      if (uploadProgress) {
        setError("Photo upload in progress. Please wait for it to finish.");
        return;
      }

      if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
        setError("End date cannot be before start date.");
        return;
      }



      setLoading(true);

      const eventData = {
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        location: formData.location,
        maxAttendees: formData.maxAttendees,
        organizerId: user.uid,
        organizerName: userProfile.displayName,
        status: "active" as const,
        tags: formData.tags,
        imageUrls: formData.imageUrls,
        requireStudentId,
        questions,  // Team-level or general registration questions
        // Team registration fields
        isTeamEvent,
        ...(isTeamEvent && {
          minTeamSize,
          maxTeamSize,
          memberQuestions,  // Questions per team member
        }),
      };


      await withTimeout(eventsApi.createEvent(eventData as any), 30000);
      router.push("/admin");
    } catch (error: any) {
      console.error("🔥 Error creating event:", error.code, error.message);
      setError(error.message || "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isOrganizer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-[url('/BG.PNG')] bg-cover bg-center bg-fixed pt-16">
      <Navigation />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("admin.createPage.backToAdmin")}
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("admin.createPage.pageTitle")}
            </h1>
            <p className="text-gray-600">{t("admin.createPage.subtitle")}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("admin.createPage.infoTitle")}</CardTitle>
              <CardDescription>
                {t("admin.createPage.infoDesc")}
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
                    <Label htmlFor="title">
                      {t("admin.createPage.labels.title")}
                    </Label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={t(
                        "admin.createPage.labels.placeholders.title"
                      )}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">
                      {t("admin.createPage.labels.description")}
                    </Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={t(
                        "admin.createPage.labels.placeholders.description"
                      )}
                      required
                    />
                  </div>



                  <div>
                    <Label htmlFor="startDate" className="block mb-1">
                      Event Start Date
                    </Label>
                    <input
                      type="datetime-local"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate" className="block mb-1">
                      Event End Date
                    </Label>
                    <input
                      type="datetime-local"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>


                  <div>
                    <Label htmlFor="location">
                      {t("admin.createPage.labels.location")}
                    </Label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={t(
                        "admin.createPage.labels.placeholders.location"
                      )}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxAttendees">
                      {t("admin.createPage.labels.maxAttendees")}
                    </Label>
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

                  <div className="md:col-span-2">
                    <Label>Photos</Label>
                    <div className="space-y-2">
                      {formData.imageUrls.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {formData.imageUrls.map((url, index) => (
                            <div key={index} className="relative">
                              <img
                                src={url}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-20 object-cover rounded"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                onClick={() => handlePhotoRemove(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files && handlePhotoUpload(e.target.files)
                          }
                          className="hidden"
                          id="photo-upload"
                          disabled={uploadProgress !== null}
                        />
                        <Label
                          htmlFor="photo-upload"
                          className="cursor-pointer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            disabled={uploadProgress !== null}
                          >
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadProgress || "Add Photos"}
                            </span>
                          </Button>
                        </Label>
                        <span className="text-sm text-gray-500">
                          Max 10 photos, 5MB each
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requireStudentId"
                    checked={requireStudentId}
                    onChange={(e) => setRequireStudentId(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="requireStudentId" className="text-sm font-medium text-gray-700">
                    Require KFUPM ID for registration
                  </Label>
                </div>

                {/* Team Event Toggle */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="isTeamEvent"
                      checked={isTeamEvent}
                      onChange={(e) => setIsTeamEvent(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="isTeamEvent" className="text-sm font-medium text-gray-700">
                      Team Registration (register as a team instead of individual)
                    </Label>
                  </div>

                  {/* Team Size Configuration */}
                  {isTeamEvent && (
                    <div className="ml-6 space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minTeamSize" className="text-sm font-medium text-gray-700">
                            Minimum Team Size
                          </Label>
                          <input
                            type="number"
                            id="minTeamSize"
                            min={1}
                            max={maxTeamSize}
                            value={minTeamSize}
                            onChange={(e) => setMinTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxTeamSize" className="text-sm font-medium text-gray-700">
                            Maximum Team Size
                          </Label>
                          <input
                            type="number"
                            id="maxTeamSize"
                            min={minTeamSize}
                            max={20}
                            value={maxTeamSize}
                            onChange={(e) => setMaxTeamSize(Math.max(minTeamSize, parseInt(e.target.value) || minTeamSize))}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynamic Registration Questions */}
                <div className="border-t border-gray-200 pt-6">
                  <QuestionBuilder
                    questions={questions}
                    onChange={setQuestions}
                    title={isTeamEvent ? "Team Questions (asked once per team)" : undefined}
                  />
                </div>

                {/* Member Questions (only for team events) */}
                {isTeamEvent && (
                  <div className="border-t border-gray-200 pt-6">
                    <QuestionBuilder
                      questions={memberQuestions}
                      onChange={setMemberQuestions}
                      title="Member Questions (asked for each team member)"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="tags">
                    {t("admin.createPage.labels.tags")}
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddTag())
                      }
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={t(
                        "admin.createPage.labels.placeholders.tag"
                      )}
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      variant="outline"
                    >
                      {t("admin.createPage.labels.add")}
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
                    {t("admin.createPage.labels.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || uploadProgress !== null}
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-infinity loading-xl"></span>
                        {t("admin.createPage.labels.creating")}
                      </>
                    ) : (
                      t("admin.createPage.labels.createEvent")
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
