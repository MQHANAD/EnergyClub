"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { eventsApi, registrationsApi } from "@/lib/firestore";
import { Event, Registration, EventQuestion } from "@/types";
import Navigation from "@/components/Navigation";
import LoadingSpinner from "@/components/register/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  Eye,
  Check,
  X,
  Pencil,
  Upload,
  Clock,
  MapPin,
  Download,
} from "lucide-react";
import { useI18n, getLocale } from "@/i18n/index";
import Input from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { exportResponsesToExcel, exportMultiAreaToExcel } from "@/lib/exportResponses";
import ResponsesTable from "@/components/admin/ResponsesTable";
import QuestionBuilder from "@/components/admin/QuestionBuilder";

export default function AdminDashboard() {
  const {
    user,
    userProfile,
    isOrganizer,
    isAdmin,
    isEventManager,
    loading: authLoading,
  } = useAuth();
  const canAccess = Boolean(isOrganizer || isAdmin || isEventManager);
  const router = useRouter();
  const { t, lang } = useI18n();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"events" | "registrations">("events");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  // Registrations search
  const [regQuery, setRegQuery] = useState<string>("");
  const [regDebouncedQuery, setRegDebouncedQuery] = useState<string>("");

  // Registrations grouping and pagination
  const DEFAULT_GROUP_LIMIT = 2;
  const [showMore, setShowMore] = useState<{
    [k in "waitlist" | "confirmed" | "cancelled"]?: boolean;
  }>({});

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "active" as Event["status"],
    imageUrls: [] as string[],
    requireStudentId: false,
    autoAcceptRegistrations: false,
    questions: [] as EventQuestion[],
    memberQuestions: [] as EventQuestion[],
    isTeamEvent: false,
    startDate: "",
    endDate: "",
    location: "",
    maxAttendees: 100,
    minTeamSize: 2,
    maxTeamSize: 10,
  });
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const filteredRegistrations = useMemo(() => {
    const q = regDebouncedQuery.trim().toLowerCase();
    if (!q) return registrations;
    return registrations.filter((r) => {
      const email = (r.userEmail ?? "").toString().toLowerCase();
      const uEmail = (r.universityEmail ?? "").toString().toLowerCase();
      const name = (r.userName ?? "").toString().toLowerCase();
      return email.includes(q) || uEmail.includes(q) || name.includes(q);
    });
  }, [registrations, regDebouncedQuery]);

  const groupedRegistrations: Record<
    "waitlist" | "confirmed" | "cancelled",
    Registration[]
  > = useMemo(
    () => ({
      waitlist: filteredRegistrations.filter((r) => r.status === "waitlist"),
      confirmed: filteredRegistrations.filter((r) => r.status === "confirmed"),
      cancelled: filteredRegistrations.filter((r) => r.status === "cancelled"),
    }),
    [filteredRegistrations]
  );

  const statusOrder: Array<"waitlist" | "confirmed" | "cancelled"> = [
    "waitlist",
    "confirmed",
    "cancelled",
  ];

  // Redirect if not authorized
  useEffect(() => {
    if (!authLoading && userProfile !== null) {
      if (!user) {
        router.push("/login");
      } else if (!canAccess) {
        router.push("/");
      }
    }
  }, [user, userProfile, canAccess, authLoading, router]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all events (including hidden for admin view)
      const { events: allEvents } = await eventsApi.getEvents(undefined, 100, true);
      console.log("🔥 Admin fetched events:", allEvents); // <--- ADD THIS
      setEvents(allEvents);
    } catch (error) {
      console.error("Error loading events:", error);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadEventRegistrations = async (eventId: string) => {
    try {
      const eventRegistrations = await registrationsApi.getEventRegistrations(
        eventId
      );
      setRegistrations(eventRegistrations);
    } catch (error) {
      console.error("Error loading registrations:", error);
      setError("Failed to load registrations. Please try again.");
    }
  };

  useEffect(() => {
    if (user && canAccess) {
      loadEvents();
    }
  }, [user, isOrganizer, isAdmin, isEventManager]);

  // Debounce registrations search query
  useEffect(() => {
    const h = setTimeout(() => setRegDebouncedQuery(regQuery), 300);
    return () => clearTimeout(h);
  }, [regQuery]);

  const handleViewRegistrations = async (event: Event) => {
    setSelectedEvent(event);
    await loadEventRegistrations(event.id);
    setView("registrations");
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await eventsApi.deleteEvent(eventId);
      await loadEvents(); // Reload events list
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete event. Please try again.");
    }
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      description: event.description,
      status: event.status,
      imageUrls: event.imageUrls || [],
      requireStudentId: event.requireStudentId || false,
      autoAcceptRegistrations: event.autoAcceptRegistrations || false,
      questions: event.questions || [],
      memberQuestions: event.memberQuestions || [],
      isTeamEvent: event.isTeamEvent || false,
      startDate: event.startDate || "",
      endDate: event.endDate || "",
      location: event.location || "",
      maxAttendees: event.maxAttendees || 100,
      minTeamSize: event.minTeamSize || 2,
      maxTeamSize: event.maxTeamSize || 10,
    });
    setEditModalOpen(true);
  };

  const handlePhotoUpload = async (files: FileList) => {
    if (!editingEvent) return;

    const totalPhotos = editForm.imageUrls.length + files.length;
    if (totalPhotos > 10) {
      alert("Maximum 10 photos allowed.");
      return;
    }

    setUploadProgress("Uploading...");
    const storage = getStorage();
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          // 5MB limit
          alert("File size too large. Max 5MB per file.");
          continue;
        }

        const fileName = `events/${editingEvent.id}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        newUrls.push(downloadURL);
      }

      setEditForm((prev) => ({
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

  const handlePhotoRemove = async (index: number) => {
    if (!editingEvent) return;

    const urlToRemove = editForm.imageUrls[index];
    setEditForm((prev) => ({
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

  const handleSave = async () => {
    if (!editingEvent) return;

    setSaving(true);
    try {
      await eventsApi.updateEvent(editingEvent.id, {
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
        imageUrls: editForm.imageUrls,
        requireStudentId: editForm.requireStudentId,
        autoAcceptRegistrations: editForm.autoAcceptRegistrations,
        questions: editForm.questions,
        memberQuestions: editForm.memberQuestions,
        isTeamEvent: editForm.isTeamEvent,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        location: editForm.location,
        maxAttendees: editForm.maxAttendees,
        minTeamSize: editForm.minTeamSize,
        maxTeamSize: editForm.maxTeamSize,
      });

      // Refresh events
      await loadEvents();

      setEditModalOpen(false);
      setEditingEvent(null);
      alert("Event updated successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Approve a registration: set status to confirmed (triggers email via Cloud Function) and refresh list
  const handleApproveRegistration = async (registration: Registration) => {
    if (!selectedEvent) return;
    try {
      setProcessingId(registration.id);
      await registrationsApi.approveRegistration(
        registration.id,
        selectedEvent.id
      );
      await loadEventRegistrations(selectedEvent.id);
    } catch (error) {
      console.error("Error approving registration:", error);
      setError("Failed to approve registration. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject a registration: set status to cancelled and refresh list
  const handleRejectRegistration = async (registration: Registration) => {
    if (!selectedEvent) return;
    if (!confirm("Reject this registration?")) return;

    try {
      setProcessingId(registration.id);
      await registrationsApi.rejectRegistration(
        registration.id,
        selectedEvent.id
      );
      await loadEventRegistrations(selectedEvent.id);
    } catch (error) {
      console.error("Error rejecting registration:", error);
      setError("Failed to reject registration. Please try again.");
      setProcessingId(null);
    }
  };

  // Resend ticket email
  const handleResendEmail = async (registrationId: string) => {
    if (!selectedEvent) return;
    try {
      setResendingId(registrationId);

      // Import functions dynamically or use the exported instance
      const { functions } = await import('@/lib/firebase');
      const { httpsCallable } = await import('firebase/functions');

      const resendEmail = httpsCallable(functions, 'resendTicketEmail');
      await resendEmail({ registrationId });

      alert("Ticket email resent successfully!");
    } catch (error) {
      console.error("Error resending email:", error);
      setError("Failed to resend email. Please try again.");
    } finally {
      setResendingId(null);
    }
  };

  const formatDate = (date: Date) => {
    const formatted = new Intl.DateTimeFormat(getLocale(lang), {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);




    // Add "at" between date and time (for English locales)
    const hasTime = /\d{1,2}:\d{2}/.test(formatted);
    return hasTime ? formatted.replace(/(\d{4})(, )/, "$1 at ") : formatted;
  };

  const getDuration = (start: Date, end: Date) => {
    const diffMs = (end.getTime() - start.getTime()) + 1;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? "1 day" : `${diffDays} days`;
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      // Event statuses
      case "active":
        return "bg-blue-100 text-blue-800";
      case "hidden":
        return "bg-gray-100 text-gray-800";
      case "registration_completed":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-red-100 text-red-800";
      // Registration statuses
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "waitlist":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user || !canAccess) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-[url('/BG.PNG')] bg-cover bg-center bg-fixed pt-16">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("nav.admin")}
            </h1>
            <p className="text-gray-600">{t("admin.manageDesc")}</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-4">
              <button
                onClick={() => setView("events")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${view === "events"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {t("admin.eventsTab", { count: events.length })}
              </button>
              {selectedEvent && (
                <button
                  onClick={() => setView("registrations")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${view === "registrations"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {t("admin.registrationsTab", {
                    title: selectedEvent.title,
                    count: registrations.length,
                  })}
                </button>
              )}
            </nav>
          </div>

          {view === "events" ? (
            <>
              <div className="mb-6">
                <Button onClick={() => router.push("/admin/create-event")}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("admin.createNewEvent")}
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2">
                    <span className="loading loading-infinity loading-xl"></span>
                    <span>{t("admin.loadingEvents")}</span>
                  </div>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {t("admin.noEventsTitle")}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("admin.noEventsDesc")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <Card
                      key={event.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">
                              {event.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {event.description}
                            </CardDescription>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              event.status
                            )}`}
                          >
                            {event.status}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Event Date */}
                          <div className="flex flex-col gap-2 text-sm text-gray-600">
                            {/* Start Date */}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span>
                                {event.startDate
                                  ? formatDate(new Date(event.startDate))
                                  : "No date available"}
                              </span>
                            </div>

                            {/* Duration (if both start and end exist) */}
                            {event.startDate && event.endDate && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span>Duration: {getDuration(new Date(event.startDate), new Date(event.endDate))}</span>
                              </div>
                            )}

                            {/* Location */}
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>


                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            {event.currentAttendees} / {event.maxAttendees}{" "}
                            {t("admin.attendees")}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {!isEventManager && (
                              <Button
                                onClick={() => handleViewRegistrations(event)}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {t("admin.viewRegistrations")}
                              </Button>
                            )}
                            <Button
                              onClick={() => openEditModal(event)}
                              variant="outline"
                              size="sm"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {!isEventManager && (
                              <Button
                                onClick={() => handleDeleteEvent(event.id)}
                                variant="outline"
                                className="text-red-600 hover:text-red-700 md:w-auto w-full h-auto"
                              >
                                <Trash2 className="h-4 w-4" />
                                {t("admin.delete")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {selectedEvent && (
                <div className="mb-6">
                  <Button
                    onClick={() => setView("events")}
                    variant="outline"
                    className="mb-4"
                  >
                    {t("admin.backToEvents")}
                  </Button>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("admin.registrationsFor", {
                      title: selectedEvent.title,
                    })}
                  </h2>
                  <p className="text-gray-600">
                    {t("admin.registrationsCount", {
                      count: filteredRegistrations.length,
                      plural: filteredRegistrations.length !== 1 ? "s" : "",
                    })}
                  </p>
                  {/* Export Button */}
                  {filteredRegistrations.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={async () => {
                        if (!selectedEvent) return;

                        const eventTitle = selectedEvent.title.toLowerCase();
                        const isHackathon = eventTitle.includes('hackathon');
                        const isDebate = eventTitle.includes('debate');

                        // For Hackathons and Debates, export all areas
                        if (isHackathon || isDebate) {
                          const baseEventName = isHackathon ? 'Hackathon' : 'Debate';

                          // Find all related events (all hackathons or all debates)
                          const relatedEvents = events.filter(event =>
                            event.title.toLowerCase().includes(baseEventName.toLowerCase())
                          );

                          // Fetch registrations for each area
                          const areaDataPromises = relatedEvents.map(async (event) => {
                            const regs = await registrationsApi.getEventRegistrations(event.id);

                            // Extract area name from event title
                            let areaName = 'Unknown';
                            if (event.title.toLowerCase().includes('eastern')) {
                              areaName = 'Eastern Region';
                            } else if (event.title.toLowerCase().includes('western')) {
                              areaName = 'Western Region';
                            } else if (event.title.toLowerCase().includes('central') || event.title.toLowerCase().includes('riyadh')) {
                              areaName = 'Riyadh Region';
                            }

                            return {
                              areaName,
                              registrations: regs,
                              questions: event.questions || [],
                              memberQuestions: event.memberQuestions || [],
                            };
                          });

                          const areaData = await Promise.all(areaDataPromises);

                          exportMultiAreaToExcel({
                            areaData,
                            baseEventName,
                          });
                        } else {
                          // Regular single-event export
                          exportResponsesToExcel({
                            registrations: filteredRegistrations,
                            questions: selectedEvent.questions || [],
                            memberQuestions: selectedEvent.memberQuestions || [],
                            eventTitle: selectedEvent.title,
                          });
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export to Excel
                    </Button>
                  )}
                  <div className="mt-4 max-w-md">
                    <Input
                      placeholder={t("admin.registrations.searchPlaceholder")}
                      aria-label={t("admin.registrations.searchAria")}
                      value={regQuery}
                      onChange={(e) => setRegQuery(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {t("admin.noRegistrationsTitle")}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("admin.noRegistrationsDesc")}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-4">
                  <ResponsesTable
                    registrations={filteredRegistrations}
                    questions={selectedEvent?.questions || []}
                    memberQuestions={selectedEvent?.memberQuestions || []}
                    onApprove={(id) => {
                      const reg = registrations.find(r => r.id === id);
                      if (reg) handleApproveRegistration(reg);
                    }}
                    onReject={(id) => {
                      const reg = registrations.find(r => r.id === id);
                      if (reg) handleRejectRegistration(reg);
                    }}
                    onResend={handleResendEmail}
                    processingId={processingId}
                    resendingId={resendingId}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Event title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="z-50 bg-white">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value: Event["status"]) =>
                  setEditForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white cursor-pointer">
                  <SelectItem
                    value="active"
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    Active
                  </SelectItem>
                  <SelectItem
                    value="registration_completed"
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    Registration Completed (visible, no new registrations)
                  </SelectItem>
                  <SelectItem
                    value="hidden"
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    Hidden (not visible to public)
                  </SelectItem>
                  <SelectItem
                    value="completed"
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    Completed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={editForm.endDate}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Event location"
              />
            </div>

            {/* Capacity Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="maxAttendees">Max Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min="1"
                  value={editForm.maxAttendees}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, maxAttendees: parseInt(e.target.value) || 100 }))
                  }
                />
              </div>
              {editForm.isTeamEvent && (
                <>
                  <div>
                    <Label htmlFor="minTeamSize">Min Team Size</Label>
                    <Input
                      id="minTeamSize"
                      type="number"
                      min="1"
                      value={editForm.minTeamSize}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, minTeamSize: parseInt(e.target.value) || 2 }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxTeamSize">Max Team Size</Label>
                    <Input
                      id="maxTeamSize"
                      type="number"
                      min="1"
                      value={editForm.maxTeamSize}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, maxTeamSize: parseInt(e.target.value) || 10 }))
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <Label>Photos</Label>
              <div className="space-y-2">
                {editForm.imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {editForm.imageUrls.map((url, index) => (
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
                  <Label htmlFor="photo-upload" className="cursor-pointer">
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireStudentId"
                checked={editForm.requireStudentId}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    requireStudentId: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="requireStudentId" className="text-sm font-medium text-gray-700">
                Require Student ID for registration
              </Label>
            </div>

            {/* Auto-Accept Registrations Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoAcceptRegistrations"
                checked={editForm.autoAcceptRegistrations}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    autoAcceptRegistrations: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <div className="flex flex-col">
                <Label htmlFor="autoAcceptRegistrations" className="text-sm font-medium text-gray-700">
                  Auto-Accept Registrations
                </Label>
                <span className="text-xs text-gray-500">
                  When enabled, registrations are confirmed immediately and tickets sent automatically
                </span>
              </div>
            </div>

            {/* Team Event Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isTeamEvent"
                checked={editForm.isTeamEvent}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    isTeamEvent: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="isTeamEvent" className="text-sm font-medium text-gray-700">
                Team Registration Event
              </Label>
            </div>

            {/* Questions */}
            <div className="border-t pt-4 mt-4">
              <QuestionBuilder
                title={editForm.isTeamEvent ? "Team Questions" : "Registration Questions"}
                questions={editForm.questions}
                onChange={(questions) =>
                  setEditForm((prev) => ({ ...prev, questions }))
                }
              />
            </div>

            {/* Member Questions (only for team events) */}
            {editForm.isTeamEvent && (
              <div className="border-t pt-4 mt-4">
                <QuestionBuilder
                  title="Member Questions (asked per team member)"
                  questions={editForm.memberQuestions}
                  onChange={(memberQuestions) =>
                    setEditForm((prev) => ({ ...prev, memberQuestions }))
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <span className="loading loading-infinity loading-sm mr-2"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
