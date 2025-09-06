"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
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
}: {
    events: EventItem[];
    primary?: string;
    accent?: string;
}) {
    const [active, setActive] = useState<EventItem | null>(null);
    const [slideIdx, setSlideIdx] = useState(0);
    const { t, dir } = useI18n();

    const next = () => setSlideIdx((i) => (active ? (i + 1) % active.images.length : 0));
    const prev = () => setSlideIdx((i) => (active ? (i - 1 + active.images.length) % active.images.length : 0));

    const container: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, ease: "easeOut" } },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
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
                {t("events.title")}
            </motion.h2>
            <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
                {events.map((e) => (
                    <motion.button
                        key={e.id}
                        variants={item}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => { setActive(e); setSlideIdx(0); }}
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
                            <h3 className={`text-lg font-bold ${dir === "rtl" ? "text-right" : "text-left"}`} style={{ color: primary }}>{e.title}</h3>
                            <p className={`mt-1 text-sm text-gray-600 line-clamp-2 ${dir === "rtl" ? "text-right" : "text-left"}`}>{e.short}</p>
                        </div>
                    </motion.button>
                ))}
            </motion.div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-wrap gap-4 justify-center items-center">
                <a href="/events" target="_blank" className="rounded-xl px-6 py-3 font-semibold text-white" style={{ backgroundColor: accent }}>
                    {t("events.ctaRegister")}
                </a>
                <Link href="/register" target="_blank" className="rounded-xl px-6 py-3 font-semibold text-white" style={{ backgroundColor: primary }}>
                    {t("events.ctaJoin")}
                </Link>
            </div>

            {/* Modal */}
            {active && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" aria-modal role="dialog">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl"
                    >
                        <button
                            aria-label={t("events.modal.close")}
                            onClick={() => setActive(null)}
                            className={`absolute top-3 rounded-full p-2 hover:bg-gray-100 z-50 ${dir === "rtl" ? "left-3" : "right-3"
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
                                <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow">
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow">
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="space-y-4 whitespace-pre-line">
                                <h3 className="text-2xl font-bold" style={{ color: primary }}>{active.title}</h3>
                                <div>{active.content}</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </section>
    );
}