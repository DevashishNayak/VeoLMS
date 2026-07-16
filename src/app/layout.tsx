import type { Metadata } from "next";
import Script from "next/script";
import { Geist_Mono, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SessionProvider } from "@/components/providers/session-provider";
import { auth } from "@/lib/auth";
import { VIDSTACK_DESTROY_GUARD_BOOT } from "@/lib/vidstack-destroy-boot";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VeoLMS — Learn Without Limits",
  description:
    "A modern learning management system. Browse courses, learn at your pace, and track your progress.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Script
          id="veolms-vidstack-destroy-guard"
          strategy="beforeInteractive"
        >
          {VIDSTACK_DESTROY_GUARD_BOOT}
        </Script>
        <SessionProvider session={session}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
