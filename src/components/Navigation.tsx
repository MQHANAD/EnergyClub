'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Calendar, Settings, Menu, X } from 'lucide-react';
import { useI18n } from '@/i18n/index';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Navigation() {
  const { user, userProfile, logout, loading, isOrganizer } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router]);

  if (loading) {
    return (
      <nav className={`sticky top-0 z-50 bg-white transition-all duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className={`sticky top-0 z-50 bg-[#25818a] transition-all duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main nav items */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt={t('nav.logoAlt')}
                  width={90}
                  height={90}

                />
              </Link>

              {/* Desktop navigation */}
              <div className="hidden md:ml-10 md:flex md:items-baseline md:space-x-4">
                <Link
                  href="/events"
                  className="text-[#f8cd5c] hover:opacity-80 text-xl px-3 py-2 rounded-md"
                >
                  {t('nav.events')}
                </Link>
                {isOrganizer && (
                  <Link
                    href="/admin"
                    className="text-[#f8cd5c] hover:opacity-80 text-xl px-3 py-2 rounded-md"
                  >
                    {t('nav.admin')}
                  </Link>
                )}
                {isOrganizer && (
                  <Link
                    href="/admin/applications"
                    className="text-[#f8cd5c] hover:opacity-80 text-xl px-3 py-2 rounded-md"
                  >
                    {t('nav.applications')}
                  </Link>
                )}
              </div>
            </div>


            {/* Desktop user actions */}
            <div className="hidden md:flex md:items-center md:space-x-4 relative">
              <div className="mr-2">
                <LanguageSwitcher />
              </div>
              {user ? (
                <div className="relative">
                  {/* Trigger */}
                  <button
                    className="flex items-center space-x-2 focus:outline-none cursor-pointer"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    {userProfile?.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt={userProfile.displayName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <span className="text-sm text-[#f8cd5c] hover:opacity-80 hidden lg:inline">
                      {userProfile?.displayName || user.email}
                    </span>
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-50">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <Button size="sm">{t('nav.signIn')}</Button>
                </Link>
              )}
            </div>


            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">{t('nav.openMenu')}</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <Link
              href="/events"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              {t('nav.events')}
            </Link>
            {isOrganizer && (
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
              >
                {t('nav.admin')}
              </Link>
            )}
            {isOrganizer && (
              <Link
                href="/admin/applications"
                className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
              >
                {t('nav.applications')}
              </Link>
            )}

            {user ? (
              <>
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                      {userProfile?.photoURL ? (
                        <img
                          src={userProfile.photoURL}
                          alt={userProfile.displayName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">
                        {userProfile?.displayName || user.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full justify-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('nav.logout')}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <Link href="/login" className="w-full">
                  <Button size="sm" className="w-full justify-center">
                    {t('nav.signIn')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}