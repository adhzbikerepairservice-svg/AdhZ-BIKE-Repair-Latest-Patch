import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Lexend } from "next/font/google";
import ChatWidget from "@/components/ChatWidget";
import BackToTop from "@/components/BackToTop";
import ScrollReveal from "@/components/ScrollReveal";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

// Lexend is the typeface used by e.gov.ph; one variable font covers headings and body text.
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "ADHZ Bike Repair & Service",
  description: "Healing bikes, one ride at a time. Bike repair and service in Balanga City, Bataan. Pick a mechanic and a time.",
};

export const viewport: Viewport = { viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${lexend.variable} ${mono.variable}`}>
      <body>
        <div className="wrap">
          <SiteNav />
          <main>{children}</main>
          <SiteFooter />
          <ScrollReveal />
          <BackToTop />
          <ChatWidget />
        </div>
      </body>
    </html>
  );
}
