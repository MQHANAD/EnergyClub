"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { eventsApi, registrationsApi } from "@/lib/firestore";
import { Event, Registration } from "@/types";
import Navigation from "@/components/Navigation";
import LoadingSpinner from "@/components/register/LoadingSpinner";
import { logEventView, logEventRegistration } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  MapPin,
  Users,
  User,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useI18n, getLocale } from "@/i18n/index";

export default function EventDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { t, lang } = useI18n();

  const [event, setEvent] = useState<Event | null>(null);
  const [userRegistration, setUserRegistration] = useState<Registration | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registrationReason, setRegistrationReason] = useState("");
  const [isFromUniversity, setIsFromUniversity] = useState(false);
  const [universityEmail, setUniversityEmail] = useState("");
  const [universityEmailError, setUniversityEmailError] = useState<
    string | null
  >(null);

  const loadEvent = async () => {
    if (!id || typeof id !== "string") return;

    try {
      setLoading(true);
      setError(null);

      const eventData = await eventsApi.getEvent(id);
      if (!eventData) {
        setError("Event not found");
        return;
      }

      setEvent(eventData);
      
      // Log event view for analytics
      logEventView(id, eventData.title);
    } catch (error) {
      console.error("Error loading event:", error);
      setError("Failed to load event details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load event immediately on mount
  useEffect(() => {
    loadEvent();
  }, [id]);

  // Check registration status separately when user is available
  useEffect(() => {
    const checkRegistration = async () => {
      if (user && id && typeof id === "string") {
        try {
          // Use optimized single-event registration check
          const registration = await registrationsApi.getUserEventRegistration(
            user.uid,
            id
          );
          setUserRegistration(registration);
        } catch (error) {
          console.error("Error checking registration status:", error);
        }
      }
    };
    checkRegistration();
  }, [user, id]);

  useEffect(() => {
    if (!isFromUniversity) {
      setUniversityEmail("");
      setUniversityEmailError(null);
    }
  }, [isFromUniversity]);

  const validateUniversityEmail = (email: string): string | null => {
    const value = (email || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please provide a valid university email address.";
    }
    const domain = value.split("@")[1]?.toLowerCase() || "";
    const personalDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "live.com",
      "icloud.com",
    ];
    if (personalDomains.includes(domain)) {
      return "Please use your university email domain (no personal email domains).";
    }
    const isUniDomain =
      /\.edu(\.[a-z]{2})?$/.test(domain) || /\.ac(\.[a-z]{2})?$/.test(domain);
    if (!isUniDomain) {
      return "Please use a university email domain (e.g., .edu or .ac).";
    }
    return null;
  };

  const handleRegister = async () => {
    if (!event || !user || !userProfile) return;

    try {
      setRegistering(true);
      setError(null);

      // Validation
      if (isFromUniversity) {
        const emailErr = validateUniversityEmail(universityEmail || "");
        setUniversityEmailError(emailErr);
        if (emailErr) {
          setError(emailErr);
          setRegistering(false);
          return;
        }
      }

      await registrationsApi.registerForEvent(
        event.id,
        user.uid,
        userProfile.displayName,
        userProfile.email,
        registrationReason.trim() || undefined,
        isFromUniversity,
        universityEmail || undefined
      );

      // Log registration for analytics
      logEventRegistration(event.id, event.title);

      // Reload event to get updated attendee count
      await loadEvent();

      // Clear form
      setRegistrationReason("");
    } catch (error) {
      console.error("Error registering for event:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to register for event. Please try again."
      );
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(getLocale(lang), {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-8">
      {/* Image Skeleton */}
      <div className="w-full h-64 md:h-96 bg-gray-300 rounded-xl"></div>
      
      {/* Content Skeleton */}
      <div className="space-y-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-4">
            <div className="h-8 bg-gray-300 rounded-lg w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </CardContent>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="h-6 bg-gray-300 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="h-6 bg-gray-300 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">{t("common.loading")}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="space-y-6 animate-in fade-in duration-500">
            <Alert variant="destructive" className="border-l-4 shadow-lg">
              <AlertDescription className="text-base">{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.back()} 
              variant="outline"
              className="group hover:bg-gray-100 transition-all duration-200 hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              {t("eventDetails.goBack")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const isEventFull = event.currentAttendees >= event.maxAttendees;
  const canRegister =
    user && !userRegistration && event.status === "active" && !isEventFull;

  return (
    <div className="min-h-screen bg-[url('/BG.PNG')] bg-cover bg-center bg-fixed">
      <div className="min-h-screen bg-gradient-to-br from-gray-50/95 to-gray-100/95 backdrop-blur-sm">
        <Navigation />
         {/* Back Button */}
          <div className=" pt-20 pl-5">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="group hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1 duration-200" />
              <span className="text-sm">{t("eventDetails.backToEvents")}</span>
            </Button>
          </div>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         

          <div className="space-y-6 md:space-y-8">
            {/* Event Image */}
            <div className="group relative overflow-hidden rounded-2xl shadow-2xl bg-white transition-transform duration-300 hover:shadow-3xl">
              {event.imageUrls && event.imageUrls.length > 0 ? (
                <div className="relative w-full aspect-video md:aspect-[21/9] overflow-hidden">
                  <img
                    src={event.imageUrls[0]}
                    alt={event.title}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ) : (
                <div className="w-full aspect-video md:aspect-[21/9] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-400 text-lg font-medium">
                    {t("eventDetails.noImage")}
                  </span>
                </div>
              )}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
              {/* Main Event Info - Takes 2 columns on large screens */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
                  <CardHeader className="space-y-4 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          {event.title}
                        </CardTitle>
                        <CardDescription className="text-base md:text-lg flex items-center gap-2">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span>
                            {t("eventDetails.organizedBy", {
                              name: event.organizerName,
                            })}
                          </span>
                        </CardDescription>
                      </div>
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 shadow-sm transition-all duration-200 hover:shadow-md ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {event.status}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-8">
                    {/* Description */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        {t("eventDetails.description")}
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                        {event.description}
                      </p>
                    </div>

                    {/* Tags */}
                    {event.tags.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {t("eventDetails.tags")}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {event.tags.map((tag, index) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 hover:shadow-md cursor-default animate-in fade-in slide-in-from-bottom-2"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Takes 1 column on large screens */}
              <div className="space-y-6 lg:col-span-1">
                {/* Event Details Card */}
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold">
                      {t("eventDetails.detailsTitle")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group">
                      <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-sm md:text-base text-gray-700 leading-relaxed break-words">
                        {formatDate(event.date)}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group">
                      <MapPin className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-sm md:text-base text-gray-700 leading-relaxed break-words">
                        {event.location}
                      </span>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group">
                      <User className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-sm md:text-base text-gray-700 leading-relaxed break-words">
                        {t("eventDetails.created", {
                          date: formatDate(event.createdAt),
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Registration Card */}
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold">
                      {t("eventDetails.registrationTitle")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {error && (
                      <Alert variant="destructive" className="mb-4 border-l-4 animate-in slide-in-from-top-2 duration-300">
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    )}

                    {!user ? (
                      <div className="text-center space-y-4 py-4">
                        <p className="text-gray-600 text-base">
                          {t("eventDetails.pleaseSignIn")}
                        </p>
                        <Button 
                          onClick={() => router.push("/login")}
                          className="w-full min-h-[44px] font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                        >
                          {t("eventDetails.signIn")}
                        </Button>
                      </div>
                    ) : userRegistration ? (
                      <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in duration-500">
                        <div className="flex items-center justify-center gap-2 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                          <CheckCircle className="h-6 w-6 text-green-600 animate-in zoom-in duration-300" />
                          <span className="text-green-700 font-semibold text-lg">
                            {t("eventDetails.alreadyRegistered")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {t("eventDetails.youRegisteredOn", {
                            date: formatDate(userRegistration.registrationTime),
                          })}
                        </p>
                        {userRegistration.reason && (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              <span className="font-medium">
                                {t("eventDetails.reasonLabel", { reason: "" }).split(":")[0]}:
                              </span>{" "}
                              {userRegistration.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : event.status !== "active" ? (
                      <div className="text-center py-4">
                        <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                          <p className="text-gray-700 font-medium">
                            {t("eventDetails.eventStatusNotAccepting", {
                              status: event.status,
                            })}
                          </p>
                        </div>
                      </div>
                    ) : isEventFull ? (
                      <div className="text-center space-y-3 py-4">
                        <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                          <p className="text-red-700 font-semibold text-lg mb-2">
                            {t("eventDetails.eventFull")}
                          </p>
                          <p className="text-sm text-red-600">
                            {t("eventDetails.eventFullSubtitle")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* University Checkbox */}
                        <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer group">
                          <input
                            type="checkbox"
                            id="university"
                            checked={isFromUniversity}
                            onChange={(e) =>
                              setIsFromUniversity(e.target.checked)
                            }
                            className="h-5 w-5 mt-0.5 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-gray-300 rounded cursor-pointer transition-all duration-200"
                          />
                          <Label 
                            htmlFor="university" 
                            className="text-sm md:text-base font-medium text-gray-700 cursor-pointer group-hover:text-blue-700 transition-colors duration-200"
                          >
                            {t("eventDetails.universityToggle")}
                          </Label>
                        </div>

                        {/* University Email Field */}
                        {isFromUniversity && (
                          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <Label 
                              htmlFor="universityEmail"
                              className="text-sm font-semibold text-gray-700"
                            >
                              {t("eventDetails.universityEmail")}
                              <span className="text-red-500 ml-1">*</span>
                            </Label>
                            <input
                              type="email"
                              id="universityEmail"
                              placeholder={t(
                                "eventDetails.universityEmailPlaceholder"
                              )}
                              value={universityEmail}
                              onChange={(e) => {
                                const v = e.target.value;
                                setUniversityEmail(v);
                                setUniversityEmailError(
                                  validateUniversityEmail(v)
                                );
                              }}
                              className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 text-base ${
                                universityEmailError
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50"
                                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400"
                              }`}
                              required
                              aria-invalid={!!universityEmailError}
                              aria-describedby={universityEmailError ? "email-error" : undefined}
                            />
                            {universityEmailError && (
                              <p 
                                id="email-error"
                                className="text-sm text-red-600 font-medium animate-in slide-in-from-top-1 duration-200"
                              >
                                {universityEmailError}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Registration Reason */}
                        <div className="space-y-2">
                          <Label 
                            htmlFor="reason"
                            className="text-sm font-semibold text-gray-700"
                          >
                            {t("eventDetails.whyInterested")}
                            <span className="text-gray-400 ml-1 font-normal">(Optional)</span>
                          </Label>
                          <Textarea
                            id="reason"
                            placeholder={t("eventDetails.whyPlaceholder")}
                            value={registrationReason}
                            onChange={(e) =>
                              setRegistrationReason(e.target.value)
                            }
                            rows={4}
                            className="resize-none border-2 focus:ring-2 focus:ring-offset-1 transition-all duration-200 hover:border-gray-400 text-base"
                          />
                        </div>

                        {/* Register Button */}
                        <Button
                          onClick={handleRegister}
                          disabled={
                            registering ||
                            (isFromUniversity && !!universityEmailError)
                          }
                          className="w-full min-h-[48px] font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                        >
                          {registering ? (
                            <span className="flex items-center justify-center gap-2">
                              <LoadingSpinner size="sm" variant="white" />
                              <span>{t("eventDetails.registering")}</span>
                            </span>
                          ) : (
                            t("eventDetails.registerButton")
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
