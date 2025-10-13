"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function ParallaxSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0.8]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);

  return (
    <section 
      ref={ref}
      className="relative h-screen bg-gradient-to-br from-[#25818a] via-[#1a6d75] to-[#0f5960] overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:40px_40px]"></div>
      </div>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-white/10 blur-xl"
        style={{
          y: useTransform(scrollYProgress, [0, 1], [50, -50]),
        }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-[#f8cd5c]/20 blur-2xl"
        style={{
          y: useTransform(scrollYProgress, [0, 1], [-50, 50]),
        }}
      />

      {/* Main Content */}
      <motion.div
        className="relative z-10 h-full flex items-center justify-center"
        style={{ y, opacity, scale }}
      >
        <div className="text-center">
          <motion.h1
            className="text-white font-bold tracking-tighter"
            style={{
              fontSize: "clamp(4rem, 20vw, 20rem)",
              lineHeight: 0.8,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            ENERGY HUB
          </motion.h1>
          
          <motion.p
            className="text-white/80 text-lg mt-8 font-light tracking-widest uppercase"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Powering the Future
          </motion.p>
        </div>
      </motion.div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
    </section>
  );
}