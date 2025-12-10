"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/index";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({ className }: { className?: string }) {
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
      className={cn(
        "rounded-md border border-black/30 bg-gray/10 text-black hover:bg-black/20 px-3 py-1.5 text-sm transition cursor-pointer",
        className
      )}
      aria-label={t("langSwitcher.label")}
      title={t("langSwitcher.label")}
    >
      {lang === "ar" ? t("langSwitcher.en") : t("langSwitcher.ar")}
    </button>
  );
}
