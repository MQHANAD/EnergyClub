"use client";

import React, { useState, useEffect } from "react";
import { eventsApi } from "@/lib/firestore";
import { Event } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import Events from "./Events";
import { useI18n } from "@/i18n/index";

interface EventItem {
  id: string;
  title: string;
  short: string;
  content: React.ReactNode;
  images: string[];
}

export default function UpcomingEvents() {
  const { loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const { events } = await eventsApi.getEvents(undefined, 3);
        const transformedEvents: EventItem[] = events.map((event: Event) => ({
          id: event.id,
          title: event.title,
          short:
            event.description.slice(0, 100) +
            (event.description.length > 100 ? "..." : ""),
          content: <p>{event.description}</p>,
          images:
            event.imageUrls && event.imageUrls.length > 0
              ? event.imageUrls
              : ["/file.svg"],
        }));
        setUpcomingEvents(transformedEvents);
      } catch (err) {
        console.error("Error fetching upcoming events:", err);
        setError("Failed to load upcoming events. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <span className="loading loading-infinity loading-xl"></span>
          <span>Loading upcoming events...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <Events
      events={upcomingEvents}
      title={t("events.title")}
      showButtons={false}
    />
  );
}
