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
  <div className="relative sm:mb-50">
    {/* Fixed Background + Title Layer */}
    <motion.div className="fixed inset-0 z-0 flex items-end justify-center md:pb-12 pb-3 pointer-events-none">
      {/* Blurry / Transparent Background Image */}
      <motion.div
        className="absolute inset-0 bg-[url('/VisualIdentity.svg')] bg-bottom bg-contain bg-no-repeat blur-lg"
        style={{ opacity: bgOpacity }}
      />

      {/* Title on top of the background */}
      <div className="relative z-10 mb-2">
        <h1
          className="text-white [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000] font-bold text-center leading-none select-none"
          style={{ fontSize: "clamp(3rem, 17vw, 17rem)" }}
        >
          {t("brand.short")}
        </h1>
      </div>
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
