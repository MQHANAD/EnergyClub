'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { eventsApi } from '@/lib/firestore';
import { Event } from '@/types';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react';
import Input from '@/components/ui/input';
import { useI18n, getLocale } from '@/i18n/index';
import type { DocumentSnapshot } from 'firebase/firestore';

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useI18n();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  const loadEvents = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const { events: newEvents, lastDoc: newLastDoc } = await eventsApi.getEvents(
        loadMore ? lastDoc : undefined,
        9 // Load 9 events at a time (3x3 grid)
      );

      if (loadMore) {
        setEvents(prev => [...prev, ...newEvents]);
      } else {
        setEvents(newEvents);
      }

      setLastDoc(newLastDoc);
      setHasMore(newEvents.length === 9);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadEvents();
    }
  }, [authLoading]);

  // Local search query debounce
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const filteredEvents = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => (e.title ?? '').toLowerCase().includes(q));
  }, [events, debouncedQuery]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadEvents(true);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(getLocale(lang), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <span className="loading loading-infinity loading-xl"></span>
          <span>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-[url('/BG.PNG')] bg-cover bg-center bg-fixed" >
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('eventsPage.title')}
            </h1>
            <p className="text-gray-600">
              {t('eventsPage.subtitle')}
            </p>
          </div>

          <div className="mb-4">
            <Input
              placeholder={t('eventsPage.searchPlaceholder')}
              aria-label={t('eventsPage.searchAria')}
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
              <div className="flex items-center space-x-2">
                <span className="loading loading-infinity loading-xl"></span>
                <span>{t('eventsPage.loadingEvents')}</span>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('eventsPage.noEventsFound')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('eventsPage.noUpcoming')}
              </p>
              
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 flex space-x-4">
                          
                          <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                            {event.imageUrl ? (
                              <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/file.svg';
                                }}
                              />
                            ) : (
                              <img
                                src="/file.svg"
                                alt={t('eventDetails.noImage')}
                                className="w-10 h-10 opacity-60"
                              />
                            )}
                          </div>
                      
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2 whitespace-normal">{event.title}</CardTitle>
                            <CardDescription className="truncate md:w-48 w-32">
                              {event.description}
                            </CardDescription>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 truncate">
                          <MapPin className="h-4 w-4 mr-2" />
                          {event.location}
                        </div>
                        {/* <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          {event.currentAttendees} / {event.maxAttendees} attendees
                        </div> */}
                  {/* Registration status block removed due to missing userRegistration */}
                        {event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {event.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{event.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        <div className="pt-2">
                          <Link href={`/event/${event.id}`}>
                            <Button className="w-full cursor-pointer" size="sm">
                              {t('eventsPage.viewDetails')}
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outline"
                  >
                    {loadingMore ? (
                      <>
                        <span className="loading loading-infinity loading-xl"></span>
                        {t('eventsPage.loading')}
                      </>
                    ) : (
                      t('eventsPage.loadMore')
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