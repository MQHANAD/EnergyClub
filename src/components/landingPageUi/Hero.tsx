"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useI18n } from "@/i18n/index";
import { Button } from "@/components/ui/button";

const container: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Hero() {
  const { t, dir } = useI18n();
  const isRTL = dir === "rtl";
  const alignClass = isRTL ? "md:text-right" : "md:text-left";
  const justifyClass = isRTL ? "md:justify-end" : "md:justify-start";

  return (
    <section
      id="home"
      className="min-h-[80vh] md:h-[92dvh] overflow-hidden pt-8"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/BG.PNG"
          alt={t("hero.bgAlt")}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 " />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 px-4 sm:px-6 py-16 md:py-28 h-full items-center">
        {/* Text */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className={`text-center ${alignClass}`}
        >
          {/* Container for Title and Mobile-only GIF */}
          <div className="flex items-center justify-center md:block gap-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#f8cd5c] mb-4">
              {t("hero.titlePrefix")}{" "}
              <span style={{ color: "#25818a" }}>
                {t("hero.titleEnergyHub")}
              </span>
            </h1>
            {/* Mobile-only GIF - Shown on small screens */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="md:hidden relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 overflow-hidden rounded-2xl shadow-lg mr-4 mb-4"
            >
              <Image
                src="/windTurbine.gif"
                alt={t("hero.gifAlt")}
                fill
                className="object-cover"
              />
            </motion.div>
          </div>

          <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
            {t("hero.tagline")}
          </p>

          <div
            className={`flex flex-wrap justify-center ${justifyClass} gap-3`}
          >
            <motion.a
              href="/events"
              className="rounded-xl px-4 py-2 md:px-5 md:py-3 font-semibold text-white text-sm md:text-base"
              style={{ backgroundColor: "#f8cd5c" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t("hero.ctaExplore")}
            </motion.a>
            <motion.a
              href="/register"
              className="rounded-xl px-4 py-2 md:px-5 md:py-3 font-semibold text-white text-sm md:text-base bg-[#25818a]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t("hero.ctaLearn")}
            </motion.a>
          </div>
        </motion.div>

        {/* Image - Hidden on small screens, shown on medium and up */}
        <motion.div
          variants={container}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="hidden md:block relative w-full max-w-[500px] aspect-square mx-auto  overflow-hidden rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl"
        >
          <Image
            src="/windTurbine.gif"
            alt={t("hero.gifAlt")}
            fill
            className="object-cover"
            priority
          />
        </motion.div>
      </div>
    </section>
  );
}
