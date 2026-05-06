import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/common/ServiceWorkerRegistration";
import { PWAInstallPrompt } from "@/components/common/PWAInstallPrompt";
import { ThemeProvider } from "@/components/common/ThemeProvider";

export const dynamic = 'force-dynamic';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AuraTrack — Habit Tracker",
  description: "Build better habits with elegant tracking. A world-class habit tracker with streaks, analytics, and beautiful design.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AuraTrack",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var h = new Date().getHours();
                  var theme = 'focus';
                  if (h >= 5 && h < 10) theme = 'dawn';
                  else if (h >= 21 || h < 5) theme = 'midnight';
                  
                  var pref = localStorage.getItem('auratrack-theme');
                  if (pref && pref !== 'auto') theme = pref;
                  
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <ServiceWorkerRegistration />
          <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
