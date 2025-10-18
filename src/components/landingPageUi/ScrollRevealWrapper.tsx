"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, ReactNode } from "react";
import { useI18n } from "@/i18n/index";

interface ScrollRevealWrapperProps {
  children: ReactNode;
}

export default function ScrollRevealWrapper({
  children,
}: ScrollRevealWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Transform values for the sliding effect
  const mainContentY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <div className="relative md:mb-50 mb-22">
      {/* Fixed Background Layer */}
      <motion.div
        className="fixed inset-0 z-0 bg-gradient-to-br from-[#25818a] via-[#1a6d75] to-[#0f5960] flex items-end justify-center pb-20"
        style={{ opacity: bgOpacity }}
      >
        <h1
          className="text-white font-bold text-center leading-none select-none"
          style={{ fontSize: "clamp(3rem, 12vw, 12rem)" }}
        >
          {t("brand.short")}
        </h1>
      </motion.div>

      {/* Sliding Content Layer */}
      <motion.div
        ref={containerRef}
        style={{ y: mainContentY }}
        className="relative z-10 bg-white"
      >
        {children}
      </motion.div>
    </div>
  );
}
