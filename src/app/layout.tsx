import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/i18n/index";
import { getDirFromLang, type Lang } from "@/i18n/messages";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Energy Club Web Platform",
  description: "Discover and register for Energy club events",
  icons: {
    icon: [
      "/favicon.png",
      { url: "/favicon.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png", sizes: "64x64" },
    ],
    shortcut: ["/favicon.png"],
    apple: [{ url: "/favicon.png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("lang")?.value as Lang | undefined;
  const lang: Lang = cookieLang === "ar" ? "ar" : "en";
  const dir = getDirFromLang(lang);

  return (
    <html lang={lang} dir={dir}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <I18nProvider lang={lang}>
            {children}
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
