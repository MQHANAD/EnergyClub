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
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    },
    exit: { opacity: 0, y: 20 },
  };

  return (
    <section id="events" className="mx-auto max-w-6xl px-6 py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="mb-16 text-4xl font-light text-gray-900 text-center"
      >
        {titleText}
      </motion.h2>

      <AnimatePresence mode="wait">
        <motion.div
          key={showAll ? "all" : "limited"}
          variants={container}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
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
              className="group text-left bg-white cursor-pointer border-b-2 border-transparent hover:border-gray-300 transition-all duration-300"
            >
              <div className="relative aspect-[4/3] w-full mb-4 overflow-hidden">
                <Image
                  src={e.images[0]}
                  alt={e.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-light text-gray-900 group-hover:text-gray-700 transition-colors">
                  {e.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {e.short}
                </p>
                <div className="w-8 h-0.5 bg-gray-300 group-hover:bg-gray-400 transition-colors" />
              </div>
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* CTA Buttons */}
      {events.length > 3 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="/events"
            className="px-8 py-3 font-light text-white tracking-wide transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            {t("events.ctaRegister")}
          </Link>

          <button
            onClick={() => setShowAll(!showAll)}
            className="px-8 py-3 font-light text-gray-700 border border-gray-300 tracking-wide transition-all hover:border-gray-400 hover:text-gray-900"
          >
            {showAll ? t("events.showLess") : t("events.showMore")}
          </button>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActive(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>

              <div className="grid md:grid-cols-2 gap-8 p-8">
                {/* Image Slider */}
                <div className="space-y-4">
                  <div className="relative aspect-[4/3] w-full bg-gray-100">
                    {active.images.length > 0 && (
                      <Image
                        src={active.images[slideIdx]}
                        alt={`${active.title} image ${slideIdx + 1}`}
                        fill
                        className="object-cover"
                      />
                    )}
                    
                    {active.images.length > 1 && (
                      <>
                        <button
                          onClick={prev}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={next}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {active.images.length > 1 && (
                    <div className="flex gap-2 justify-center">
                      {active.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setSlideIdx(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === slideIdx ? 'bg-gray-600' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-light text-gray-900">
                    {active.title}
                  </h3>
                  <div className="text-gray-600 leading-relaxed">
                    {active.content}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}