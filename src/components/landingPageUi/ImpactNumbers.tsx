"use client";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { useI18n } from "@/i18n/index";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } }
};

const stats = [
  { key: "attendees", value: 1500 },
  { key: "workingMembers", value: 200 },
  { key: "universities", value: 8 },
  { key: "panels", value: 4 },
  { key: "majorEvents", value: 7 }
];

export default function ImpactNumbers() {
  const { ref, inView } = useInView({ threshold: 0.3 });
  const { t } = useI18n();

  return (
    <section ref={ref} className="bg-gray-50 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="text-3xl font-extrabold text-[#25818a] mb-8"
        >
          {t("impact.title")}
        </motion.h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              variants={container}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="rounded-3xl bg-white p-6 text-center shadow-sm hover:scale-[1.03] transition-transform"
            >
              <div className="text-3xl font-extrabold text-[#25818a]">
                {inView ? <CountUp start={0} end={s.value} duration={2} separator="," /> : 0}
              </div>
              <div className="mt-2 text-sm text-gray-600">{t(`impact.stats.${s.key}`)}</div>
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full" style={{ backgroundColor: "#f8cd5c" }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


