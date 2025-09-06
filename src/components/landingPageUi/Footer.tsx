"use client";

import Link from "next/link";
import { Linkedin, Instagram, X } from "lucide-react";
import { useI18n } from "@/i18n/index";

export default function Footer({ primary = "#114DAF", accent = "#f8cd5c" }) {
  const { t } = useI18n();

  const navLinks = [

    { key: "about", href: "#about" },
    { key: "events", href: "/events" },
    // { key: "partners", href: "#partners" },
    { key: "joinUs", href: "/register" },
  ];

  return (
    <footer id="Footer" className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Branding */}
          <div className="md:col-span-2">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-lg font-bold text-[#25818a]">
                {t("footer.brandName")}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {t("footer.brandDesc")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="mb-3 text-sm font-semibold text-[#25818a]">
              {t("footer.quickLinks")}
            </p>
            <ul className="space-y-2 text-sm text-gray-60">
              {navLinks.map(({ key, href }) => (
                <li key={key}>
                  <Link href={href} className="hover:text-gray-900">
                    {t(`navigation.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-3 text-sm font-semibold text-[#25818a]">
              {t("footer.contact")}
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                {t("footer.email")}:{" "}
                <a
                  href="mailto:contact@energyhub.events"
                  className="hover:text-gray-900 underline"
                >
                  contact@energyhub.events
                </a>
              </li>

              <li>{t("footer.location")}</li>
              <h1>Female Energy Club</h1>
              <div className="flex gap-3">
                <Link href="https://www.linkedin.com/company/female-energy-club21/" target="_blank" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5 text-[#f8cd5c] hover:opacity-80" />
                </Link>
                <Link href="https://www.instagram.com/fec_kfupm?igsh=aG5keWp0enkyM2Jx" target="_blank" aria-label="Instagram">
                  <Instagram className="h-5 w-5 text-[#f8cd5c] hover:opacity-80" />
                </Link>
                <Link href="https://x.com/f_energyclub?s=21" target="_blank" aria-label="X">
                  <X className="h-5 w-5 text-[#f8cd5c] hover:opacity-80" />
                </Link>
              </div>
              <h1>KFUPM Energy Week</h1>
              <div className="flex gap-3">
                <Link href="https://www.linkedin.com/company/kfupm-energy-week/" target="_blank" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5 text-[#f8cd5c] hover:opacity-80" />
                </Link>
              </div>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6 text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} {t("footer.brandName")}. {t("footer.rights")} <span>
            Website Developed by{' '}
            <a
              href="https://mqhanad.github.io/Portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 font-medium text-[#25818a]"
            >
              Muhannad Alduraywish
            </a> and <a
              href="https://omaralshahrani.great-site.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 font-medium text-[#25818a]"
            >
              Omar Alshahrani
            </a>.
          </span>
        </div>
      </div>
    </footer>
  );
}
