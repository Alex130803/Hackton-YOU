import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Creator Outreach",
  description: "Find brands with a fresh trigger, check they're legit, and pitch with sources.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const demo = (process.env.USE_MOCKS ?? "true").toLowerCase() !== "false";
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <header className="sticky top-0 z-10 border-b border-line bg-background/70 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-mono text-sm tracking-widest text-accent">
              CREATOR<span className="text-accent-2">/</span>OUTREACH
            </Link>
            <Link href="/" className="text-sm text-muted hover:text-foreground">Outbound</Link>
            <Link href="/inbound" className="text-sm text-muted hover:text-foreground">Deal Check</Link>
            {demo && (
              <span className="ml-auto rounded-full border border-warn/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-warn">
                mock mode
              </span>
            )}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
