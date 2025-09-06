"use client";
import { motion, Variants } from "framer-motion";
import { useI18n } from "@/i18n/index";

const container: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.15, ease: "easeOut" }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Partners() {
  const { t } = useI18n();
  const logos = Array.from({ length: 6 }); // placeholder for 6 partners

  return (
    <section id="partners" className="bg-gray-50 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="text-3xl font-extrabold text-[#25818a] mb-6"
        >
          {t("partners.title")}
        </motion.h2>
        <p className="mb-6 max-w-prose text-gray-600">
          {t("partners.description")}
        </p>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {logos.map((_, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ scale: 1.05 }}
              className="grid h-24 place-items-center rounded-2xl border border-dashed border-gray-300 bg-white text-gray-400 shadow-sm transition-transform"
            >
              {t("partners.logo", { i: i + 1 })}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
