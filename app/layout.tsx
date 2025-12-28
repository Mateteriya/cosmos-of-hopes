import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/constructor/LanguageProvider";
import NotificationManager from "@/components/notifications/NotificationManager";
import BrowserBindingInfo from "@/components/info/BrowserBindingInfo";
import AuthButton from "@/components/auth/AuthButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Вселенная Желаний - Новогодние комнаты",
  description: "Совместное празднование Нового года онлайн. Создавайте шары желаний, украшайте ёлку вместе с друзьями",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <NotificationManager />
          <BrowserBindingInfo />
          <AuthButton />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
