import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/i18n/index";
import { getDirFromLang, type Lang } from "@/i18n/messages";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Energy Hub",
  description: "Discover and register for Energy club and Energy week events",
  icons: {
    icon: [
      "/favicon2.png",
      { url: "/favicon2.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon2.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon2.png", type: "image/png", sizes: "64x64" },
    ],
    shortcut: ["/favicon2.png"],
    apple: [{ url: "/favicon2.png" }],
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
      <body className="antialiased font-sans">
        <AuthProvider>
          <I18nProvider lang={lang}>
            {children}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  console.timeEnd('App Startup');
                `,
              }}
            />
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
