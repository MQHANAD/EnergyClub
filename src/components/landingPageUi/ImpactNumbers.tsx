"use client";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { useI18n } from "@/i18n/index";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

const stats = [
  { key: "attendees", value: 2000 },
  { key: "workingMembers", value: 280 },
  { key: "universities", value: 8 },
  { key: "panels", value: 4 },
  { key: "majorEvents", value: 7 },
];

export default function ImpactNumbers() {
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });
  const { t } = useI18n();

  return (
    <section ref={ref} className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-light text-gray-900 mb-16 text-center"
        >
          {t("impact.title")}
        </motion.h2>

        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-5"
        >
          {stats.map((s, i) => (
            <motion.div key={i} variants={item} className="group text-center">
              <div className="text-5xl font-light text-gray-900 mb-3">
                {inView ? (
                  <CountUp
                    start={0}
                    end={s.value}
                    duration={2.5}
                    separator=","
                    delay={0.2}
                  />
                ) : (
                  0
                )}
                <span className="text-3xl text-[#25818a]">+</span>
              </div>
              <div className="text-sm text-gray-500 font-light tracking-wide uppercase">
                {t(`impact.stats.${s.key}`)}
              </div>
              <div className="w-8 h-0.5 bg-gray-300 mx-auto mt-4 group-hover:bg-[#25818a] transition-colors duration-300" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
