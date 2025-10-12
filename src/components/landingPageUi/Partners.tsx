"use client";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/index";

// Marquee row component
const MarqueeRow = ({ direction, items }: { direction: "left" | "right"; items: any[] }) => {
  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex gap-8"
        animate={{
          x: direction === "left" ? [0, -1000] : [-1000, 0],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear",
          },
        }}
      >
        {items.map((_, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 w-48 h-32 bg-gray-100 flex items-center justify-center p-6 transition-all duration-300 hover:bg-gray-200 border border-gray-200"
          >
            <span className="text-sm text-gray-500 font-light">
              Partner {i + 1}
            </span>
          </motion.div>
        ))}
        {/* Duplicate for seamless loop */}
        {items.map((_, i) => (
          <motion.div
            key={`dup-${i}`}
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 w-48 h-32 bg-gray-100 flex items-center justify-center p-6 transition-all duration-300 hover:bg-gray-200 border border-gray-200"
          >
            <span className="text-sm text-gray-500 font-light">
              Partner {i + 1}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default function Partners() {
  const { t } = useI18n();
  const logos = Array.from({ length: 12 });

  return (
    <section id="partners" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-light text-gray-900 mb-4">
            {t("partners.title")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t("partners.description")}
          </p>
        </motion.div>

        {/* Marquee Rows */}
        <div className="space-y-8">
          <MarqueeRow direction="left" items={logos.slice(0, 6)} />
          <MarqueeRow direction="right" items={logos.slice(6, 12)} />
        </div>
      </div>
    </section>
  );
}