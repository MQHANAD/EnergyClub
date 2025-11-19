"use client";

import Link from "next/link";
import { Linkedin, Instagram, X, Mail, MapPin } from "lucide-react";
import { useI18n } from "@/i18n/index";

export default function Footer({ primary = "#25818a", accent = "#f8cd5c" }) {
  const { t } = useI18n();

  const navLinks = [
    { key: "about", href: "#about" },
    { key: "events", href: "/events" },
    { key: "joinUs", href: "/register" },
  ];

  const socialLinks = [
    {
      name: "Female Energy Club",
      links: [
        {
          platform: "LinkedIn",
          icon: Linkedin,
          href: "https://www.linkedin.com/company/female-energy-club21/",
          color: "#0077b5",
        },
        {
          platform: "Instagram",
          icon: Instagram,
          href: "https://www.instagram.com/fec_kfupm?igsh=aG5keWp0enkyM2Jx",
          color: "#E4405F",
        },
        {
          platform: "X",
          icon: X,
          href: "https://x.com/f_energyclub?s=21",
          color: "#000000",
        },
      ],
    },
    {
      name: "KFUPM Energy Week",
      links: [
        {
          platform: "LinkedIn",
          icon: Linkedin,
          href: "https://www.linkedin.com/company/kfupm-energy-week/",
          color: "#0077b5",
        },
      ],
    },
  ];

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Branding */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <span className="text-xl font-bold text-gray-900">
                {t("footer.brandName")}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed max-w-md">
              {t("footer.brandDesc")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="mb-4 text-sm font-bold text-gray-900 uppercase tracking-wide">
              {t("footer.quickLinks")}
            </p>
            <ul className="space-y-3">
              {navLinks.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200"
                  >
                    {t(`navigation.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <p className="mb-4 text-sm font-bold text-gray-900 uppercase tracking-wide">
              {t("footer.contact")}
            </p>
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                <a
                  href="mailto:contact@energyhub.events"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  contact@energyhub.events
                </a>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-sm text-gray-600">
                  {t("footer.location")}
                </span>
              </div>

              {/* Social Links */}
              <div className="space-y-4 pt-2">
                {socialLinks.map((group, index) => (
                  <div key={index}>
                    <p className="text-xs font-bold text-gray-500 mb-2">
                      {group.name}
                    </p>
                    <div className="flex gap-3">
                      {group.links.map((social) => (
                        <Link
                          key={social.platform}
                          href={social.href}
                          target="_blank"
                          className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                          aria-label={social.platform}
                        >
                          <social.icon className="h-4 w-4 text-gray-600" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 text-center md:text-left">
              © {new Date().getFullYear()} {t("footer.brandName")}.{" "}
              {t("footer.rights")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
