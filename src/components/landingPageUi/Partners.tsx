"use client";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/index";
import Image from "next/image";

// Marquee row component
const MarqueeRow = ({
  direction,
  items,
  isRTL,
}: {
  direction: "left" | "right";
  items: any[];
  isRTL: boolean;
}) => {
  // Calculate the width of one item including gap (w-48 = 192px + gap-8 = 32px = 224px per item)
  const itemWidth = 124; // 192px width + 32px gap
  const totalWidth = items.length * itemWidth;

  return (
    <div className="overflow-hidden ">
      <motion.div
        className="flex gap-8"
        animate={{
          x: isRTL
            ? direction === "left"
              ? [totalWidth, 0]
              : [0, totalWidth]
            : direction === "left"
            ? [0, -totalWidth]
            : [-totalWidth, 0],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 15,
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
            <span className="text-sm text-gray-500 font-bold">
              <Image
                src="/CEEELogo.png"
                alt="Energy Club Logo"
                width={300}
                height={300}
                className="object-contain"
              />
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
            <span className="text-sm text-gray-500 font-bold">
              <Image
                src="/CEEELogo.png"
                alt="Energy Club Logo"
                width={300}
                height={300}
                className="object-contain"
              />
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default function Partners() {
  const { t, dir } = useI18n();
  const logos = Array.from({ length: 12 });

  return (
    <section id="partners" className="bg-white py-20" dir={dir}>
      <div
        className={`mx-auto w-full ${
          dir === "rtl" ? "text-right" : "text-left"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className={`mb-16 ${dir === "rtl" ? "text-right" : "text-center"}`}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t("partners.title")}
          </h2>
          <p
            className={`text-gray-600 max-w-2xl mx-auto leading-relaxed ${
              dir === "rtl" ? "text-right" : "text-left"
            }`}
          >
            {t("partners.description")}
          </p>
        </motion.div>

        {/* Marquee Rows */}
        <div className={`space-y-8 ${dir === "rtl" ? "space-x-reverse" : ""}`}>
          <MarqueeRow
            direction="left"
            items={logos.slice(0, 6)}
            isRTL={dir === "rtl"}
          />
          <MarqueeRow
            direction="right"
            items={logos.slice(6, 12)}
            isRTL={dir === "rtl"}
          />
        </div>
      </div>
    </section>
  );
}
