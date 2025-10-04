'use client';

import React, { useEffect, useState } from 'react';
import RegisterTabs from '@/components/register/RegisterTabs';
import EnergyWeekForm from '@/components/register/EnergyWeekForm';
import FemaleEnergyClubForm from '@/components/register/FemaleEnergyClubForm';
import type { Program } from '@/lib/registrationSchemas';
import { Users, Calendar, Award, ArrowRight } from 'lucide-react';

import { db, auth } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  setDoc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';

export default function RegisterPage() {
  const [active, setActive] = useState<Program>('energy_week_2');

  // Registration open flags
  const [openEW2, setOpenEW2] = useState<boolean | null>(null);
  const [openFEC, setOpenFEC] = useState<boolean | null>(null);

  // Auth + admin
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Listen to auth state and load role from /users/{uid}
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      if (!u) {
        setIsAdmin(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', u.uid));
        const data = snap.exists() ? snap.data() as any : {};
        const role = data?.role ?? data?.preferences?.role;
        setIsAdmin(role === 'admin');
        console.log('[admin-check]', { uid: u.uid, role, isAdmin: role === 'admin' });
      } catch (e) {
        console.error('Failed to load user doc for role check:', e);
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  // Listen to registration toggles
  useEffect(() => {
    const ref = doc(db, 'config', 'registration');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? (snap.data() as any) : {};
      setOpenEW2(Boolean(data.energy_week_2_open));
      setOpenFEC(Boolean(data.female_energy_club_open));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    console.log('openEW2 =', openEW2, 'openFEC =', openFEC);
  }, [openEW2, openFEC]);

 

  // Is a given program open right now?
  const isOpenFor = (id: Program) =>
    id === 'energy_week_2' ? !!openEW2 : !!openFEC;

  // Guarded tab change (block if closed)
  const handleTabChange = (next: Program) => {
    if (!isOpenFor(next)) {
      alert('Registration is closed for this opportunity.');
      return;
    }
    setActive(next);
  };

useEffect(() => {
  // still loading? do nothing
  if (openEW2 === null || openFEC === null) return;

  // if the currently selected tab is closed, switch to one that's open
  const activeIsClosed =
    (active === 'energy_week_2' && !openEW2) ||
    (active === 'female_energy_club' && !openFEC);

  if (activeIsClosed) {
    setActive(openEW2 ? 'energy_week_2' : (openFEC ? 'female_energy_club' : active));
  }
}, [active, openEW2, openFEC]);


  // === Admin toggle write ===
  const toggleProgram = async (program: Program, open: boolean) => {
    try {
      if (!user) {
        alert('You must be signed in as an admin to do this.');
        return;
      }
      if (!isAdmin) {
        alert('Only admins can change registration status.');
        return;
      }

      const ref = doc(db, 'config', 'registration');
      const payload =
        program === 'energy_week_2'
          ? { energy_week_2_open: open, updatedAt: Timestamp.now() }
          : { female_energy_club_open: open, updatedAt: Timestamp.now() };

      await setDoc(ref, payload, { merge: true });

       if (program === 'energy_week_2') setOpenEW2(open);
         else setOpenFEC(open);

    if (open) setActive(program);

      console.log('[toggle ok]', program, open);
    } catch (e: any) {
      // This will show Firestore’s error (e.g., “permission-denied”)
      console.error('toggleProgram error:', e?.code, e?.message, e);
      alert('Failed to update. Check console for details.');
    }
  };

  // While we haven't loaded toggles yet
  const togglesLoading = openEW2 === null || openFEC === null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#25818a] to-[#f8cd5c] text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full animate-bounce-custom">
              <Users className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in-down">
              Join Our Energy Community
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto animate-fade-in-up">
              Be part of innovative programs that shape the future of energy.
              Apply now to contribute your skills and passion to meaningful projects.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12 stagger-animation">
              <div className="flex items-center gap-3 text-blue-100 form-transition hover:text-white hover:scale-105">
                <Calendar className="h-5 w-5 flex-shrink-0" />
                <span>Flexible Timeline</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100 form-transition hover:text-white hover:scale-105">
                <Award className="h-5 w-5 flex-shrink-0" />
                <span>Leadership Opportunities</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100 form-transition hover:text-white hover:scale-105">
                <Users className="h-5 w-5 flex-shrink-0" />
                <span>Collaborative Community</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-12">

        {/* Program Selection */}
        <div className="mb-12 animate-fade-in-up">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-slide-in-left">
              Choose Your Program
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-slide-in-right">
              Select the program that aligns with your interests and career goals.
              Both programs offer unique opportunities for growth and impact.
            </p>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {togglesLoading ? (
                // SKELETON while flags load
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[0, 1].map((i) => (
                    <div key={i} className="relative p-6 rounded-xl border-2 bg-white">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-2" />
                      <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse mb-4" />
                      <div className="h-24 w-24 rounded-md border bg-gray-100 animate-pulse" />
                      <div className="absolute top-3 right-3 h-6 w-20 rounded-full bg-gray-200 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <RegisterTabs
                  active={active}
                  onChange={handleTabChange}
                  availability={{
                    energy_week_2: !!openEW2,
                    female_energy_club: !!openFEC,
                  }}
                  showAdmin={isAdmin}
                  onAdminToggle={toggleProgram}
                />
              )}
            </div>

        </div>

        {/* Application Form */}
        <section aria-live="polite" className="relative">
          <div className="mb-6 bg-blue-50 border backdrop-blur-md border-blue-200 rounded-lg p-4 animate-slide-in-left btn-hover-lift">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium animate-pulse-custom">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 form-transition">
                    {active === 'energy_week_2'
                      ? 'Energy Week 2 Application'
                      : 'Female Energy Club Application'}
                  </h3>
                  <p className="text-sm text-gray-600">Estimated completion time: 5-10 minutes</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm text-blue-600 animate-bounce-custom">
                <span>Ready to start?</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Content gate */}
          {togglesLoading ? (
            <p className="mt-6 text-sm text-gray-600">Checking registration status…</p>
          ) : !isOpenFor(active) ? (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-700">Registration is closed</h3>
              <p className="text-sm text-red-700/90">Please check back later.</p>
            </div>
          ) : (
            <div className="transition-all duration-500 ease-in-out">
              {active === 'energy_week_2' ? (
                <div className="animate-fade-in-up">
                  <EnergyWeekForm isOpen={!!openEW2} />
                </div>
              ) : (
                <div className="animate-fade-in-up">
                 <FemaleEnergyClubForm isOpen={!!openFEC} />
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
