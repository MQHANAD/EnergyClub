"use client";
import { useI18n } from "@/i18n/index";
import { TextReveal } from "./textReveal";
import { motion, type Variants} from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function Hero() {
  const { t } = useI18n();
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });
  const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

  return (
    <section id="about" className="bg-white pt-16 md:pt-24 py-20">
      <div ref={ref} className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 md:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-light text-gray-900 mb-8 text-center"
        >
          {t("hero.titleEnergyHub")}
        </motion.h2>

        <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 text-balance text-base leading-relaxed text-gray-700 sm:text-lg md:text-xl text-center"
          >
            {t("hero.tagline")}
          </motion.p>
      </div>
    </section>
  );
}
