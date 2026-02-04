"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu, X, LayoutDashboard, Ticket } from "lucide-react";
import { useI18n } from "@/i18n/index";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { motion, AnimatePresence } from "framer-motion";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface NavigationProps {
  colorScheme?: 'light' | 'dark';
}

export default function Navigation({ colorScheme = 'light' }: NavigationProps) {
  const { user, userProfile, logout, loading, isOrganizer, isAdmin } = useAuth();
  const canSeeAdmin = Boolean(isOrganizer || isAdmin);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMember, setIsMember] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Membership check
  useEffect(() => {
    async function checkMembership() {
      if (user?.email) {
        try {
          const membersRef = collection(db, "members");
          const q = query(membersRef, where("email", "==", user.email));
          const snapshot = await getDocs(q);
          setIsMember(!snapshot.empty);
        } catch (error) {
          console.error("Error checking membership:", error);
          setIsMember(false);
        }
      } else {
        setIsMember(false);
      }
    }
    checkMembership();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navLinks = [
    { href: "/", label: t("navigation.home") },
    { href: "/events", label: t("nav.events") },
    { href: "/team", label: t("navigation.team") },
    { href: "/register", label: t("navigation.joinUs") },
  ];

  const adminLinks = canSeeAdmin
    ? [
      { href: "/admin", label: t("nav.admin") },
      { href: "/admin/applications", label: t("nav.applications") },
      { href: "/admin/team", label: "Team Management" },
      { href: "/admin/analytics", label: t("nav.analytics") },
    ]
    : [];

  const isDark = colorScheme === 'dark';
  const iconColorClass = isDark ? 'text-white' : 'text-slate-800';

  if (loading) {
    return (
      <nav className="fixed top-4 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl h-16 px-8 py-2.5 flex justify-between items-center rounded-full bg-gray-200/50 animate-pulse backdrop-blur-sm" />
      </nav>
    );
  }

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`ml-auto w-fit max-w-none px-2 py-2 flex justify-end items-center rounded-full border transition-all duration-300 md:mx-auto md:w-full md:max-w-7xl md:px-4 md:sm:px-6 md:lg:px-8 md:py-2.5 md:justify-between ${isScrolled || isMobileMenuOpen
          ? "bg-white/80 backdrop-blur-lg border-white/40 shadow-lg"
          : "bg-white/10 backdrop-blur-md border-white/20"
          }`}
      >
        {/* Desktop Nav */}
        <DesktopNav
          navLinks={navLinks}
          isScrolled={isScrolled}
          colorScheme={colorScheme}
        />

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher className={`${!isScrolled && isDark ? 'text-white border-white/30 hover:bg-white/10' : ''}`} />

          {user ? (
            <UserDropdown
              user={user}
              userProfile={userProfile}
              isMember={isMember}
              adminLinks={adminLinks}
              onLogout={handleLogout}
            />
          ) : (
            <LoginButton isScrolled={isScrolled} t={t} pathname={pathname} />
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center ml-auto">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2.5 rounded-full hover:bg-black/5 active:scale-95 transition-all cursor-pointer ${isScrolled || isMobileMenuOpen ? 'text-slate-800' : iconColorClass}`}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navLinks={navLinks}
        user={user}
        userProfile={userProfile}
        isMember={isMember}
        adminLinks={adminLinks}
        onLogout={handleLogout}
        t={t}
        pathname={pathname}
      />
    </header>
  );
}

// --- Sub Components ---

function DesktopNav({ navLinks, isScrolled, colorScheme }: { navLinks: any[], isScrolled: boolean, colorScheme: string }) {
  const [hoveredPath, setHoveredPath] = useState("");
  const isDark = colorScheme === 'dark';
  const textColorClass = isDark ? 'text-white hover:text-gray-200' : 'text-slate-800 hover:text-black';

  return (
    <div className="hidden md:flex items-center gap-1">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onMouseOver={() => setHoveredPath(link.href)}
          onMouseLeave={() => setHoveredPath("")}
          className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-full ${isScrolled ? 'text-slate-800' : textColorClass}`}
        >
          <span className="relative z-10">{link.label}</span>
          {hoveredPath === link.href && (
            <motion.div
              className="absolute inset-0 bg-white/30 rounded-full"
              layoutId="navbar-highlight"
              transition={{ duration: 0.2 }}
            />
          )}
        </Link>
      ))}
    </div>
  );
}

function UserDropdown({ user, userProfile, isMember, adminLinks, onLogout }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none transition-transform active:scale-95 cursor-pointer"
      >
        <OptimizedImage
          src={userProfile?.photoURL}
          alt={userProfile?.displayName || 'User'}
          className="h-9 w-9 rounded-full object-cover border-2 border-white/50"
          fallbackText={userProfile?.displayName || 'User'}
          size={36}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-60 bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl overflow-hidden origin-top-right"
          >
            <div className="p-2 space-y-1">
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userProfile?.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>

              <DropdownLink href="/profile" icon={User} label="My Profile" onClick={() => setIsOpen(false)} />
              <DropdownLink href="/my-tickets" icon={Ticket} label="My Tickets" onClick={() => setIsOpen(false)} />
              {isMember && <DropdownLink href="/member" icon={LayoutDashboard} label="Member Card" onClick={() => setIsOpen(false)} />}

              {adminLinks.length > 0 && (
                <div className="pt-1 mt-1 border-t border-gray-100">
                  <p className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider">Admin</p>
                  {adminLinks.map((link: any) => (
                    <DropdownLink key={link.href} href={link.href} label={link.label} onClick={() => setIsOpen(false)} />
                  ))}
                </div>
              )}

              <div className="h-px bg-gray-100 my-1" />
              <button
                onClick={onLogout}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2.5" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Backdrop to close dropdown on click outside */}
      {isOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)} />}
    </div>
  );
}

function DropdownLink({ href, icon: Icon, label, onClick }: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100/80 rounded-lg transition-colors"
    >
      {Icon ? <Icon className="h-4 w-4 mr-2.5 text-gray-500" /> : <span className="w-4 mr-2.5" />}
      {label}
    </Link>
  );
}

function LoginButton({ isScrolled, t, pathname }: any) {
  return (
    <Link
      href={`/login?from=${encodeURIComponent(pathname)}`}
      className="px-5 py-2.5 text-sm font-medium rounded-full transition-all border border-gray-200 bg-white text-slate-900 hover:bg-gray-100"
    >
      {t("nav.signIn")}
    </Link>
  );
}

function MobileMenu({ isOpen, onClose, navLinks, user, userProfile, isMember, adminLinks, onLogout, t, pathname }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="md:hidden absolute top-[calc(100%+0.5rem)] left-0 right-0 w-full px-4 outline-none"
        >
          <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-2 space-y-1 max-h-[80vh] overflow-y-auto">
              {navLinks.map((link: any) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="block px-4 py-3.5 text-slate-800 font-medium rounded-xl hover:bg-black/5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="h-px bg-gray-200/50 my-2 mx-4" />

              {user ? (
                <>
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-3 mb-3">
                      <OptimizedImage
                        src={userProfile?.photoURL}
                        alt="Profile"
                        className="h-10 w-10 rounded-full bg-gray-100"
                        fallbackText={userProfile?.displayName?.[0] || "U"}
                        size={40}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{userProfile?.displayName || "User"}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <MobileLink href="/profile" icon={User} label="My Profile" onClick={onClose} />
                  <MobileLink href="/my-tickets" icon={Ticket} label="My Tickets" onClick={onClose} />
                  {isMember && <MobileLink href="/member" icon={LayoutDashboard} label="Member Card" onClick={onClose} />}

                  {adminLinks.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Admin Tools</p>
                      {adminLinks.map((link: any) => (
                        <MobileLink key={link.href} href={link.href} label={link.label} onClick={onClose} />
                      ))}
                    </div>
                  )}

                  <div className="mt-2 p-2">
                    <Button onClick={onLogout} variant="ghost" className="w-full justify-center rounded-xl h-11 text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4 mr-2" />
                      {t("nav.logout")}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-2">
                  <Link href={`/login?from=${encodeURIComponent(pathname)}`}>
                    <Button className="w-full rounded-xl h-11 font-semibold text-base">{t("nav.signIn")}</Button>
                  </Link>
                </div>
              )}

              <div className="flex justify-center py-4 border-t border-gray-100 mt-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileLink({ href, icon: Icon, label, onClick }: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center px-4 py-3 text-slate-700 font-medium rounded-xl hover:bg-black/5 ${!Icon ? 'pl-8' : ''}`}
    >
      {Icon && <Icon className="h-5 w-5 mr-3 text-slate-400" />}
      {label}
    </Link>
  );
}
