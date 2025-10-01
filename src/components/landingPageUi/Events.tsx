"use client";

import { useState, useEffect } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useI18n } from "@/i18n/index";
import Link from "next/link";

interface EventItem {
  id: string;
  title: string;
  short: string;
  content: React.ReactNode;
  images: string[];
}

export default function Events({
  events,
  primary = "#25818a",
  accent = "#f8cd5c",
  title,
}: {
  events: EventItem[];
  primary?: string;
  accent?: string;
  title?: string;
}) {
  const [active, setActive] = useState<EventItem | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const { t, dir } = useI18n();

  const displayedEvents = events.slice(0, showAll ? events.length : 3);

  const titleText = title || t("events.title");

  const next = () =>
    setSlideIdx((i) => (active ? (i + 1) % active.images.length : 0));
  const prev = () =>
    setSlideIdx((i) =>
      active ? (i - 1 + active.images.length) % active.images.length : 0
    );

  const container: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, ease: "easeOut" },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

  return (
    <section id="events" className="mx-auto max-w-7xl px-6 py-16 ">
      <motion.h2
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mb-6 text-3xl font-extrabold"
        style={{ color: primary }}
      >
        {titleText}
      </motion.h2>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence>
          {displayedEvents.map((e) => (
            <motion.button
              key={e.id}
              variants={item}
              initial="hidden"
              animate="show"
              exit="exit"
              whileHover={{ scale: 1.03 }}
              onClick={() => {
                setActive(e);
                setSlideIdx(0);
              }}
              className="group text-left rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white cursor-pointer"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={e.images[0]}
                  alt={e.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="p-4">
                <h3
                  className={`text-lg font-bold ${
                    dir === "rtl" ? "text-right" : "text-left"
                  }`}
                  style={{ color: primary }}
                >
                  {e.title}
                </h3>
                <p
                  className={`mt-1 text-sm text-gray-600 line-clamp-2 ${
                    dir === "rtl" ? "text-right" : "text-left"
                  }`}
                >
                  {e.short}
                </p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Show More/Less Button - MODIFIED */}
      {/* CTA Buttons - MODIFIED */}
      {
        <div className="mt-10 flex flex-col-reverse sm:flex-row flex-wrap gap-4 justify-center items-center">
          {/* Primary CTA Button (No changes here, it's our main button) */}
          <Link
            href="/events"
            className="rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: accent }}
          >
            {t("events.ctaRegister")}
          </Link>

          {events.length > 3 && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="
        rounded-xl px-6 py-2 
        text-sm
        border-2 
        focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer
        font-semibold text-white shadow-lg transition-transform hover:scale-105
      
      "
                style={
                  {
                    // Outline style
                    backgroundColor: "transparent",
                    color: primary, // Text color matches the primary theme color
                    borderColor: primary, // Border color matches the primary theme color
                    "--tw-ring-color": primary,
                  } as React.CSSProperties & { [key: string]: any }
                }
              >
                {showAll ? "Show Less  ↑" : "Show More ↓"}
              </button>
            </div>
          )}
        </div>
      }

      {/* Modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          aria-modal
          role="dialog"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <button
              aria-label={t("events.modal.close")}
              onClick={() => setActive(null)}
              className={`absolute top-3 rounded-full p-2 hover:bg-gray-100 z-50 ${
                dir === "rtl" ? "left-3" : "right-3"
              }`}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              {/* Slider */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100">
                {active.images.length > 0 && (
                  <Image
                    key={slideIdx}
                    src={active.images[slideIdx]}
                    alt={`${active.title} image ${slideIdx + 1}`}
                    fill
                    className="object-cover"
                  />
                )}
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4 whitespace-pre-line">
                <h3 className="text-2xl font-bold" style={{ color: primary }}>
                  {active.title}
                </h3>
                <div>{active.content}</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
