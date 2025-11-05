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

  const dummyEvents: EventItem[] = [
    {
      id: "energy-week",
      title: t("events.items.energyWeek.title"),
      short: t("events.items.energyWeek.short"),
      content: <p>{t("events.items.energyWeek.content")}</p>,
      images: [
        "/ev1/p1.jpg",
        "/ev1/p2.jpg",
        "/ev1/p3.jpg",
        "/ev1/p4.jpg",
        "/ev1/p5.jpg",
        "/ev1/p6.jpg",
        "/ev1/p7.jpg",
        "/ev1/p8.jpg",
        "/ev1/p9.jpg",
        "/ev1/p10.jpg",
      ],
    },
    {
      id: "shark-tank",
      title: t("events.items.sharkTank.title"),
      short: t("events.items.sharkTank.short"),
      content: <p>{t("events.items.sharkTank.content")}</p>,
      images: [
        "/ev2/p1.JPG",
        "/ev2/p2.JPG",
        "/ev2/p3.JPG",
        "/ev2/p4.JPG",
        "/ev2/p5.JPG",
        "/ev2/p6.JPG",
      ],
    },
    {
      id: "green-h2",
      title: t("events.items.greenH2.title"),
      short: t("events.items.greenH2.short"),
      content: <p>{t("events.items.greenH2.content")}</p>,
      images: ["/ev3/P1.png", "/ev3/P3.svg", "/ev3/p5.png"],
    },
  ];

  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [pastEvents, setPastEvents] = useState<EventItem[]>(dummyEvents);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const { events } = await eventsApi.getEvents(undefined, 1000);
        const upcoming: EventItem[] = [];
        const past: EventItem[] = [...dummyEvents];
        events.forEach((event: Event) => {
          const transformed: EventItem = {
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
          };
          if (event.status === "active") {
            upcoming.push(transformed);
          } else if (event.status === "completed") {
            past.push(transformed);
          }
        });
        setUpcomingEvents(upcoming);
        setPastEvents(past);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again.");
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
          <span>Loading events...</span>
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
    <>
      {upcomingEvents.length > 0 && (
        <Events events={upcomingEvents} title={t("events.title1")} />
      )}
      {pastEvents.length > 0 && (
        <Events events={pastEvents} title={t("events.title")} />
      )}
    </>
  );
}
