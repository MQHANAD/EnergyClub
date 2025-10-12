"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { eventsApi, registrationsApi } from "@/lib/firestore";
import { Event, Registration } from "@/types";
import Navigation from "@/components/Navigation";
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
  const [userEmail, setUserEmail] = useState("");
  const [userEmailError, setUserEmailError] = useState<string | null>(null);

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

      // Check if user is already registered
      if (user) {
        try {
          const userRegistrations = await registrationsApi.getUserRegistrations(
            user.uid
          );
          const existingRegistration = userRegistrations.find(
            (reg) => reg.eventId === id
          );
          setUserRegistration(existingRegistration || null);
        } catch (error) {
          console.error("Error checking registration status:", error);
        }
      }
    } catch (error) {
      console.error("Error loading event:", error);
      setError("Failed to load event details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id, user]);

  const validateEmail = (email: string): string | null => {
    const value = (email || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address.";
    }
    return null;
  };

  const handleRegister = async () => {
    if (!event || !user || !userProfile) return;

    const emailErr = validateEmail(userEmail);
    setUserEmailError(emailErr);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    try {
      setRegistering(true);
      setError(null);

      await registrationsApi.registerForEvent(
        event.id,
        user.uid,
        userProfile.displayName,
        userEmail,
        registrationReason.trim() || undefined
      );

      await loadEvent(); // refresh registration info
      setRegistrationReason("");
      setUserEmail("");
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

  if (loading) return <div>Loading...</div>;
  if (error && !event) return <div>{error}</div>;
  if (!event) return null;

  const isEventFull = event.currentAttendees >= event.maxAttendees;
  const canRegister =
    user && !userRegistration && event.status === "active" && !isEventFull;

  return (
    <div className="min-h-screen bg-[url('/BG.PNG')] bg-cover bg-center bg-fixed">
      <div className="min-h-screen bg-gradient-to-br from-gray-50/95 to-gray-100/95 backdrop-blur-sm">
        <Navigation />
        <div className="pt-20 pl-5">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="group hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-sm">{t("eventDetails.backToEvents")}</span>
          </Button>
        </div>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
          {/* Event Info */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
            <CardHeader className="space-y-4 pb-6">
              <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                {event.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("eventDetails.organizedBy", { name: event.organizerName })}
              </CardDescription>
            </CardHeader>

            {/* Event Image */}
            {event.imageUrls && event.imageUrls.length > 0 && (
              <div className="overflow-hidden rounded-xl mb-4">
                <img
                  src={event.imageUrls[0]}
                  alt={event.title}
                  className="w-full h-auto object-contain transition-transform duration-500 hover:scale-105"
                />
              </div>
            )}


            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </CardContent>
          </Card>

          {/* Registration Card */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">
                {t("eventDetails.registrationTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-l-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!user ? (
                <div className="text-center space-y-4 py-4">
                  <p className="text-gray-600">{t("eventDetails.pleaseSignIn")}</p>
                  <Button onClick={() => router.push("/login")} className="w-full">
                    {t("eventDetails.signIn")}
                  </Button>
                </div>
              ) : userRegistration ? (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-green-700 font-semibold text-lg">
                      {t("eventDetails.alreadyRegistered")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {t("eventDetails.youRegisteredOn", {
                      date: formatDate(userRegistration.registrationTime),
                    })}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t("Email address") || "Email"}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="email"
                      id="email"
                      placeholder={t("Enter you personal email") || "Enter your email"}
                      value={userEmail}
                      onChange={(e) => {
                        const v = e.target.value;
                        setUserEmail(v);
                        setUserEmailError(validateEmail(v));
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 ${
                        userEmailError
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400"
                      }`}
                      required
                    />
                    {userEmailError && (
                      <p className="text-sm text-red-600">{userEmailError}</p>
                    )}
                  </div>

                  {/* Why Interested */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">
                      {t("eventDetails.whyInterested")}
                      <span className="text-gray-400 ml-1 font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder={t("eventDetails.whyPlaceholder")}
                      value={registrationReason}
                      onChange={(e) => setRegistrationReason(e.target.value)}
                      rows={4}
                      className="w-full resize-none border-2 focus:ring-2 focus:ring-offset-1 transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  {/* Register Button */}
                  <Button
                    onClick={handleRegister}
                    disabled={registering || !!userEmailError}
                    className="w-full font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registering ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t("eventDetails.registering")}
                      </span>
                    ) : (
                      t("eventDetails.registerButton")
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
