"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/index";

export default function LanguageSwitcher() {
  const { lang, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const nextLang = lang === "ar" ? "en" : "ar";

  async function switchLang() {
    try {
      await fetch("/api/lang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: nextLang }),
        cache: "no-store",
      });
    } catch (e) {
      // no-op; still attempt a refresh
    } finally {
      startTransition(() => {
        router.refresh();
      });
    }
  }

  return (
    <button
      type="button"
      onClick={switchLang}
      disabled={pending}
      className="rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/20 px-3 py-1.5 text-sm transition"
      aria-label={t("langSwitcher.label")}
      title={t("langSwitcher.label")}
    >
      {lang === "ar" ? t("langSwitcher.en") : t("langSwitcher.ar")}
    </button>
  );
}