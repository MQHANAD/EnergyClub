'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { eventsApi, registrationsApi } from '@/lib/firestore';
import { Event, Registration } from '@/types';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Users, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { useI18n, getLocale } from '@/i18n/index';

export default function EventDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { t, lang } = useI18n();

  const [event, setEvent] = useState<Event | null>(null);
  const [userRegistration, setUserRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registrationReason, setRegistrationReason] = useState('');
  const [isFromUniversity, setIsFromUniversity] = useState(false);
  const [universityEmail, setUniversityEmail] = useState('');
  const [universityEmailError, setUniversityEmailError] = useState<string | null>(null);
 
  const loadEvent = async () => {
    if (!id || typeof id !== 'string') return;

    try {
      setLoading(true);
      setError(null);

      const eventData = await eventsApi.getEvent(id);
      if (!eventData) {
        setError('Event not found');
        return;
      }

      setEvent(eventData);

      // Check if user is already registered
      if (user) {
        try {
          const userRegistrations = await registrationsApi.getUserRegistrations(user.uid);
          const existingRegistration = userRegistrations.find(reg => reg.eventId === id);
          setUserRegistration(existingRegistration || null);
        } catch (error) {
          console.error('Error checking registration status:', error);
        }
      }
    } catch (error) {
      console.error('Error loading event:', error);
      setError('Failed to load event details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id, user]);

  useEffect(() => {
    if (!isFromUniversity) {
      setUniversityEmail('');
      setUniversityEmailError(null);
    }
  }, [isFromUniversity]);

  const validateUniversityEmail = (email: string): string | null => {
    const value = (email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please provide a valid university email address.';
    }
    const domain = value.split('@')[1]?.toLowerCase() || '';
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com'];
    if (personalDomains.includes(domain)) {
      return 'Please use your university email domain (no personal email domains).';
    }
    const isUniDomain = /\.edu(\.[a-z]{2})?$/.test(domain) || /\.ac(\.[a-z]{2})?$/.test(domain);
    if (!isUniDomain) {
      return 'Please use a university email domain (e.g., .edu or .ac).';
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
       const emailErr = validateUniversityEmail(universityEmail || '');
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

      // Reload event to get updated attendee count
      await loadEvent();

      // Clear form
      setRegistrationReason('');
    } catch (error) {
      console.error('Error registering for event:', error);
      setError(error instanceof Error ? error.message : 'Failed to register for event. Please try again.');
    } finally {
      setRegistering(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <span className="loading loading-infinity loading-xl"></span>
            <span>{t('eventsPage.loadingEvents')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('eventDetails.goBack')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const isEventFull = event.currentAttendees >= event.maxAttendees;
  const canRegister = user && !userRegistration && event.status === 'active' && !isEventFull;

  return (
    <div className="min-h-screen bg-gray-50 bg-[url('/BG.PNG')] bg-cover bg-center bg-fixed">
      <Navigation />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Button onClick={() => router.back()} variant="outline" className="mb-4 cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('eventDetails.backToEvents')}
            </Button>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <div className="w-full h-64 lg:h-96 overflow-hidden rounded-lg bg-gray-200">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-fill"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  {t('eventDetails.noImage')}
                </div>
              )}
            </div>

            {/* Main Event Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                      <CardDescription className="text-base">
                        {t('eventDetails.organizedBy', { name: event.organizerName })}
                      </CardDescription>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('eventDetails.description')}</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                  </div>

                  {event.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{t('eventDetails.tags')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('eventDetails.detailsTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm w-full">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="w-full break-words">{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-start text-sm w-full">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="w-full break-words">{event.location}</span>
                  </div>

                  {/* <div className="flex items-start text-sm w-full">
                    <Users className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="w-full break-words">
                      {event.currentAttendees} / {event.maxAttendees} attendees
                    </span>
                  </div> */}

                  <div className="flex items-start text-sm w-full">
                    <User className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="w-full break-words">{t('eventDetails.created', { date: formatDate(event.createdAt) })}</span>
                  </div>
                </CardContent>
              </Card>


              {/* Registration */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('eventDetails.registrationTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {!user ? (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        {t('eventDetails.pleaseSignIn')}
                      </p>
                      <Button onClick={() => router.push('/login')}>
                        {t('eventDetails.signIn')}
                      </Button>
                    </div>
                  ) : userRegistration ? (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-green-600 font-medium">{t('eventDetails.alreadyRegistered')}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t('eventDetails.youRegisteredOn', { date: formatDate(userRegistration.registrationTime) })}
                      </p>
                      {userRegistration.reason && (
                        <p className="text-sm text-gray-600 mt-2">
                          {t('eventDetails.reasonLabel', { reason: userRegistration.reason })}
                        </p>
                      )}
                    </div>
                  ) : event.status !== 'active' ? (
                    <div className="text-center">
                      <p className="text-gray-600">
                        {t('eventDetails.eventStatusNotAccepting', { status: event.status })}
                      </p>
                    </div>
                  ) : isEventFull ? (
                    <div className="text-center">
                      <p className="text-red-600 font-medium mb-2">{t('eventDetails.eventFull')}</p>
                      <p className="text-sm text-gray-600">
                        {t('eventDetails.eventFullSubtitle')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="university"
                          checked={isFromUniversity}
                          onChange={(e) => setIsFromUniversity(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <Label htmlFor="university">{t('eventDetails.universityToggle')}</Label>
                      </div>
                      {isFromUniversity && (
                        <div>
                          <Label htmlFor="universityEmail">{t('eventDetails.universityEmail')}</Label>
                          <input
                            type="email"
                            id="universityEmail"
                            placeholder={t('eventDetails.universityEmailPlaceholder')}
                            value={universityEmail}
                            onChange={(e) => {
                              const v = e.target.value;
                              setUniversityEmail(v);
                              setUniversityEmailError(validateUniversityEmail(v));
                            }}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${universityEmailError ? 'border-red-500' : 'border-gray-300'}`}
                            required
                          />
                          {universityEmailError && (
                            <p className="mt-1 text-sm text-red-600">{universityEmailError}</p>
                          )}
                        </div>
                      )}
                      <div>
                        <Label htmlFor="reason">{t('eventDetails.whyInterested')}</Label>
                        <Textarea
                          id="reason"
                          placeholder={t('eventDetails.whyPlaceholder')}
                          value={registrationReason}
                          onChange={(e) => setRegistrationReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <Button
                        onClick={handleRegister}
                        disabled={registering || (isFromUniversity && !!universityEmailError)}
                        className="w-full"
                      >
                        {registering ? (
                          <>
                            <span className="loading loading-infinity loading-xl"></span>
                            {t('eventDetails.registering')}
                          </>
                        ) : (
                          t('eventDetails.registerButton')
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
  );
}