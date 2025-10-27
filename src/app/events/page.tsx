"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { primeEventCache } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { eventsApi } from "@/lib/firestore";
import { Event } from "@/types";
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
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import Input from "@/components/ui/input";
import { useI18n, getLocale } from "@/i18n/index";
import type { DocumentSnapshot } from "firebase/firestore";

export default function EventsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { t, lang } = useI18n();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(
    undefined
  );
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  const loadEvents = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const { events: newEvents, lastDoc: newLastDoc } =
        await eventsApi.getEvents(
          loadMore ? lastDoc : undefined,
          9 // Load 9 events at a time (3x3 grid)
        );

      if (loadMore) {
        setEvents((prev) => [...prev, ...newEvents]);
      } else {
        setEvents(newEvents);
      }

      setLastDoc(newLastDoc);
      setHasMore(newEvents.length === 9);
    } catch (error) {
      console.error("Error loading events:", error);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Debounce search
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const filteredEvents = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let filtered = events;
    if (q) {
      filtered = events.filter((e) =>
        (e.title ?? "").toLowerCase().includes(q)
      );
    }
    // Sort by newest date first
     return filtered.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}, [events, debouncedQuery]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadEvents(true);
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



  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "cancelled":
      case "completed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-[url('/BG.PNG')] bg-cover bg-center bg-fixed pt-16">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("eventsPage.title")}
            </h1>
            <p className="text-gray-600">{t("eventsPage.subtitle")}</p>
          </div>

          <div className="mb-4">
            <Input
              placeholder={t("eventsPage.searchPlaceholder")}
              aria-label={t("eventsPage.searchAria")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">
                  {t("eventsPage.loadingEvents")}
                </p>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {t("eventsPage.noEventsFound")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("eventsPage.noUpcoming")}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="flex flex-col h-full overflow-hidden rounded-lg hover:shadow-lg transition-shadow"
                  >
                    {/* Image + Status */}
                    <div className="relative">
                      <div className="aspect-video w-full bg-gray-100 flex items-center justify-center">
                        {event.imageUrls && event.imageUrls.length > 0 ? (
                          <img
                            src={event.imageUrls[0]}
                            alt={event.title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "/file.svg";
                              e.currentTarget.className =
                                "w-16 h-16 opacity-60 object-contain";
                            }}
                          />
                        ) : (
                          <img
                            src="/file.svg"
                            alt={t("eventDetails.noImage")}
                            className="w-16 h-16 opacity-60"
                          />
                        )}
                      </div>
                      <span
                        className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {event.status}
                      </span>
                    </div>

                    <CardHeader>
                      <CardTitle className="text-xl font-bold leading-tight">
                        {event.title}
                      </CardTitle>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 pt-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          {event.startDate && event.endDate ? (
                            <span>
                              {formatDate(new Date(event.startDate))} —{" "}
                              {formatDate(new Date(event.endDate))}
                            </span>
                          ) : event.startDate ? (
                            <span>{formatDate(new Date(event.startDate))}</span>
                          ) : (
                            <span>No date available</span>
                          )}
                        </div>

                        <div className="flex items-center min-w-0">
                          <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-grow">
                      <CardDescription className="line-clamp-3">
                        {event.description}
                      </CardDescription>
                    </CardContent>

                    <div className="flex flex-col items-start gap-4 pt-4">
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {event.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {event.tags.length > 3 && (
                            <span className="text-xs text-gray-500 self-center">
                              +{event.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <Button
                        className="w-full"
                        size="sm"
                        onMouseEnter={() => primeEventCache(event)}
                        onClick={(e) => {
                          e.preventDefault();
                          primeEventCache(event);
                          router.push(`/event/${event.id}`);
                        }}
                      >
                        {t("eventsPage.viewDetails")}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outline"
                    className="border-[#25818a] text-[#25818a] hover:bg-[#25818a] hover:text-white"
                  >
                    {loadingMore ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        {t("eventsPage.loading")}
                      </div>
                    ) : (
                      t("eventsPage.loadMore")
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
