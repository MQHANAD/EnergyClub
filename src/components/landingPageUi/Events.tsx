"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  showMoreLess = false,
}: {
  events: EventItem[];
  primary?: string;
  accent?: string;
  title?: string;
  showMoreLess?: boolean;
}) {
  const [active, setActive] = useState<EventItem | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useI18n();

  const displayedEvents = showMoreLess ? events.slice(0, showAll ? events.length : 3) : events;
  const titleText = title || t("events.title");

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [active]);

  const next = () =>
    setSlideIdx((i) => (active ? (i + 1) % active.images.length : 0));
  const prev = () =>
    setSlideIdx((i) =>
      active ? (i - 1 + active.images.length) % active.images.length : 0
    );

  const goToSlide = (index: number) => setSlideIdx(index);

  // Render modal directly without memoization to avoid re-rendering issues
  const renderModal = () => {
    if (!active || !mounted) return null;

    return createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
            }}
            className="relative w-full max-w-lg lg:max-w-xl bg-white rounded-xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-white sticky top-0 z-20 flex-shrink-0">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 pr-8 line-clamp-2">
                {active.title}
              </h3>
              <button
                onClick={() => setActive(null)}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
                {/* Image Gallery */}
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative aspect-[4/3] w-full bg-gray-50 rounded-lg overflow-hidden">
                    {active.images.length > 0 && (
                      <Image
                        src={active.images[slideIdx]}
                        alt={`${active.title} - Image ${slideIdx + 1}`}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                      />
                    )}

                    {/* Navigation Arrows */}
                    {active.images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prev();
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-200 backdrop-blur-sm"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            next();
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-200 backdrop-blur-sm"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </button>
                      </>
                    )}

                    {/* Slide Counter */}
                    {active.images.length > 1 && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                        {slideIdx + 1} / {active.images.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {active.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                      {active.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            goToSlide(index);
                          }}
                          className={`flex-shrink-0 relative aspect-[4/3] w-20 sm:w-24 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                            index === slideIdx
                              ? "border-gray-900 ring-2 ring-gray-900 ring-opacity-20"
                              : "border-transparent hover:border-gray-400"
                          }`}
                          aria-label={`View image ${index + 1}`}
                        >
                          <Image
                            src={image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                          {index === slideIdx && (
                            <div className="absolute inset-0 bg-black/20" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="prose prose-sm sm:prose-base max-w-none text-gray-600 leading-relaxed overflow-hidden">
                    {active.content}
                  </div>

                  {/* Action Buttons - Sticky at bottom when scrolling */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-2">
                    <Link
                      href="/events"
                      className="flex items-center justify-center gap-2 px-6 py-3 font-medium text-white rounded-lg transition-all hover:opacity-90 text-center"
                      style={{ backgroundColor: primary }}
                    >
                      <span>{t("events.ctaRegister")}</span>
                      <ExternalLink className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={() => setActive(null)}
                      className="px-6 py-3 font-medium text-gray-700 border border-gray-300 rounded-lg transition-all hover:border-gray-400 hover:text-gray-900 cursor-pointer"
                    >
                      {t("events.modal.close")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  };

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
    exit: { opacity: 0, y: 20 },
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <section
      id="events"
      className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20"
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="mb-12 sm:mb-16 text-3xl sm:text-4xl font-bold text-gray-900 text-center"
      >
        {titleText}
      </motion.h2>

      <AnimatePresence mode="wait">
        <motion.div
          key={showMoreLess ? (showAll ? "all" : "limited") : "events"}
          variants={container}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {displayedEvents.map((e) => (
            <motion.button
              key={e.id}
              variants={item}
              whileHover={{ y: -4 }}
              onClick={() => {
                setActive(e);
                setSlideIdx(0);
              }}
              className="group text-left bg-white cursor-pointer border-b-2 border-transparent hover:border-gray-300 transition-all duration-300 w-full"
            >
              <div className="relative aspect-[4/3] w-full mb-4 overflow-hidden rounded-lg">
                <Image
                  src={e.images[0]}
                  alt={e.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                  {e.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                  {e.short}
                </p>
                <div className="w-8 h-0.5 bg-gray-300 group-hover:bg-gray-400 transition-colors" />
              </div>
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={showMoreLess && events.length > 3 ? "mt-12 sm:mt-16 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center" : "mt-12 sm:mt-16 flex justify-center"}
      >
        <Link
          href="/events"
          className="px-6 sm:px-8 py-3 font-bold text-white tracking-wide transition-all hover:opacity-90 text-center rounded-lg"
          style={{ backgroundColor: primary }}
        >
          {t("events.ctaRegister")}
        </Link>

        {showMoreLess && events.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 font-bold text-gray-700 border border-gray-300 tracking-wide transition-all hover:border-gray-400 hover:text-gray-900 rounded-lg cursor-pointer"
          >
            {showAll ? t("events.showLess") : t("events.showMore")}
          </button>
        )}
      </motion.div>

      {/* Modal rendered via portal */}
      {renderModal()}
    </section>
  );
}
