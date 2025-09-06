"use client";
import Link from "next/link";
import { Linkedin, Instagram, X } from "lucide-react";
import { useI18n } from "@/i18n/index";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const { t, lang } = useI18n();

  const links = [
    { key: "about", href: "#about" },
    { key: "events", href: "#events" },
    // { key: "partners", href: "#partners" },
    { key: "joinUs", href: "/register" },
    // { key: "contact", href: "#Footer" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#25818a] backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          {/* <div className="h-10 w-10 grid place-items-center rounded-xl text-white font-extrabold"> */}
            {/* Logo placeholder */}
          {/* </div> */}
          <span className="font-bold text-[#f8cd5c] text-2xl">
            {t("brand.short")}
          </span>
        </Link>
        <nav className="hidden md:flex gap-6 items-center">
          {links.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="text-[#f8cd5c] hover:opacity-80 text-xl"
            >
              {t(`navigation.${key}`)}
            </Link>
          ))}
        
          <div className="ml-3">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
}
