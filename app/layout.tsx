import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import VisitorAnalytics from "@/components/VisitorAnalytics";
import WelcomeLoader from "@/components/WelcomeLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Proilan M. Adolfo — Portfolio",
  appleWebApp: {
    capable: true,
    title: "Proilan",
    statusBarStyle: "default",
  },
  description:
    "Portfolio of Proilan M. Adolfo, BSIT 4th Year student at Bukidnon State University.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body><WelcomeLoader /><div className="page-entry">{children}</div>{process.env.VERCEL_ENV === "production" && <VisitorAnalytics />}</body>
    </html>
  );
}
