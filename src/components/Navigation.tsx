"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMember } from "@/hooks/useMember";
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu, X, Award } from "lucide-react";
import { useI18n } from "@/i18n/index";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { motion, AnimatePresence } from "framer-motion"; // Import framer-motion
import { VideoText } from "./landingPageUi/videotext";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
export default function Navigation() {
  const { user, userProfile, logout, loading, isOrganizer, isAdmin } =
    useAuth();
  const { isMember } = useMember();
  const canSeeAdmin = Boolean(isOrganizer || isAdmin);
  const router = useRouter();
  const { t } = useI18n();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState("");

  // Define main navigation links (public and always visible)
  const navLinks = [
    { href: "/", label: t("navigation.home") },
    { href: "/events", label: t("nav.events") },
    { href: "/team", label: t("navigation.team") },
    { href: "/register", label: t("navigation.joinUs") },
  ];

  // Define admin links (shown in user dropdown)
  const adminLinks = canSeeAdmin
    ? [
        { href: "/admin", label: t("nav.admin") },
        { href: "/admin/applications", label: t("nav.applications") },
        { href: "/admin/team", label: "Team Management" },
        { href: "/admin/analytics", label: t("nav.analytics") },
      ]
    : [];

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      setDropdownOpen(false);
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Close menus on route change or click outside (basic implementation)
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [router]);

  // Loading Skeleton (kept your original for consistency)
  if (loading) {
    return (
      <nav className="fixed top-4 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl h-16 px-8 py-2.5 flex justify-between items-center rounded-full bg-gray-200 animate-pulse"></div>
      </nav>
    );
  }

  return (
    <header className="fixed top-4 left-0 right-0 z-50">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex justify-between items-center rounded-full border transition-all duration-300 ${
          isScrolled
            ? "bg-white/20 backdrop-blur-lg border-white/30 shadow-xl"
            : "bg-white/10 backdrop-blur-md border-white/20"
        }`}
      >
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onMouseOver={() => setHoveredPath(link.href)}
              onMouseLeave={() => setHoveredPath("")}
              className="relative px-4 py-2 text-sm font-medium text-slate-800 hover:text-black transition-colors"
            >
              {link.label}
              {hoveredPath === link.href && (
                <motion.div
                  className="absolute bottom-0 left-0 h-full w-full bg-white/30 rounded-full -z-10"
                  layoutId="navbar-highlight"
                  transition={{ duration: 0.2 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <OptimizedImage
                  src={userProfile?.photoURL}
                  alt={userProfile?.displayName || 'User'}
                  className="h-8 w-8 rounded-full object-cover cursor-pointer"
                  fallbackText={userProfile?.displayName || 'User'}
                  size={32}
                  loading="lazy"
                />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-3 w-56 bg-white/80 backdrop-blur-lg border border-white/30 rounded-xl shadow-lg"
                  >
                    <div className="p-1">
                      <p className="px-3 py-2 text-sm font-semibold text-gray-800 truncate">
                        {userProfile?.displayName || user.email}
                      </p>
                      <div className="h-px bg-gray-200 my-1"></div>
                      
                      {/* Profile Link */}
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
                      >
                        <User className="h-4 w-4 mr-2" />
                        My Profile
                      </Link>
                      
                      {/* Membership Card Link - Only visible to members */}
                      {isMember && (
                        <Link
                          href="/membership-card"
                          onClick={() => setDropdownOpen(false)}
                          className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
                        >
                          <Award className="h-4 w-4 mr-2" />
                          Membership Card
                        </Link>
                      )}
                      
                      {/* Admin Links */}
                      {adminLinks.length > 0 && (
                        <>
                          <div className="h-px bg-gray-200 my-1"></div>
                          <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                            Admin
                          </div>
                          {adminLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setDropdownOpen(false)}
                              className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </>
                      )}
                      
                      <div className="h-px bg-gray-200 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t("nav.logout")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="relative px-4 py-2 text-sm font-medium text-slate-800 hover:text-black transition-colors"
            >
              {t("nav.signIn")}
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-full text-slate-800 hover:bg-white/30"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed top-20 left-4 right-4 mt-2 p-4 bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl"
          >
            <div className="flex flex-col gap-2">
              {/* Main Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 text-center text-slate-800 font-medium rounded-lg hover:bg-white/30"
                >
                  {link.label}
                </Link>
              ))}
              
              {user ? (
                <>
                  <div className="h-px bg-gray-200 my-2"></div>
                  
                  {/* User Info */}
                  <div className="px-4 py-2 text-center">
                    <p className="font-semibold text-slate-800 truncate">
                      {userProfile?.displayName || user.email}
                    </p>
                  </div>
                  
                  {/* Profile Link */}
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-3 text-slate-800 font-medium rounded-lg hover:bg-white/30"
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </Link>
                  
                  {/* Membership Card Link - Only visible to members */}
                  {isMember && (
                    <Link
                      href="/membership-card"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center px-4 py-3 text-slate-800 font-medium rounded-lg hover:bg-white/30"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Membership Card
                    </Link>
                  )}
                  
                  {/* Admin Links */}
                  {adminLinks.length > 0 && (
                    <>
                      <div className="h-px bg-gray-200 my-2"></div>
                      <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase text-center">
                        Admin
                      </div>
                      {adminLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="px-4 py-3 text-center text-slate-800 font-medium rounded-lg hover:bg-white/30"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </>
                  )}
                  
                  <div className="h-px bg-gray-200 my-2"></div>
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("nav.logout")}
                  </Button>
                </>
              ) : (
                <>
                  <div className="h-px bg-gray-200 my-2"></div>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-center text-slate-800 font-medium rounded-lg hover:bg-white/30"
                  >
                    {t("nav.signIn")}
                  </Link>
                </>
              )}
              
              <div className="mt-3 flex justify-center">
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

