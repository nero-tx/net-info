import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Net Info — Real-Time Network Intelligence & Speed Monitoring",
  description:
    "Professional, privacy-first network monitoring and diagnostic platform. Measure real-time speed, bufferbloat, jitter, DNS, and WebRTC diagnostics with zero data retention.",
  keywords: [
    "net info",
    "network intelligence",
    "speed test",
    "bufferbloat",
    "latency",
    "jitter",
    "dns diagnostics",
    "webrtc",
    "packet loss",
  ],
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#060913] text-slate-100 bg-grid-pattern selection:bg-cyan-500/20 selection:text-cyan-200">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
