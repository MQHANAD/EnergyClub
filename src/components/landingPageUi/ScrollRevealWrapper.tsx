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
    offset: ["start end", "end end"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1]);
  const titleOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1]);

  return (
    <div ref={containerRef} className="relative w-full bg-transparent">
      {/* === LAYER 1: CONTENT === 
          mb-[30dvh]: This sets the "Reveal Window" height.
      */}
      <div className="relative z-10 w-full bg-white shadow-xl mb-[30dvh]">
        {children}
      </div>

      {/* === LAYER 2: REVEAL COMPONENT === 
          h-[30dvh]: Matches the margin above exactly so there is no math gap.
      */}
      <div className="fixed bottom-0 left-0 right-0 z-0 flex h-[30dvh] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#25818a] via-[#1a6d75] to-[#0f5960]">
        {/* IMAGE
            1. Removed 'mt-10': This was pushing the image down and creating the gap.
            2. top-[-1px]: Pulls the image up slightly to ensure it tucks under the white content.
            3. h-full: Ensures the container fills the available space.
        */}
        <motion.div
          className="absolute top-[-5px] w-[110%] h-23 bg-[url('/Banner.svg')] bg-cover bg-top bg-no-repeat"
          style={{ scale }}
        />

        {/* TITLE */}
        <motion.h1
          className="relative z-20 text-center font-bold leading-none text-white select-none drop-shadow-lg pb-15"
          style={{
            fontSize: "clamp(3rem, 15vw, 12rem)",
            opacity: titleOpacity,
          }}
        >
          {t("brand.short")}
        </motion.h1>
      </div>
    </div>
  );
}
