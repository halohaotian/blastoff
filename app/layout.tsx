import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blastoff — Launch Your Product Everywhere in 5 Minutes",
  description:
    "AI-powered product launch platform. Describe your product once, we generate platform-perfect content and distribute it to Product Hunt, Reddit, Twitter, Hacker News, and 10+ more channels automatically.",
  keywords: [
    "product launch",
    "product hunt",
    "reddit marketing",
    "software launch",
    "indie hacker",
    "distribution",
    "AI content",
    "startup marketing",
  ],
  openGraph: {
    title: "Blastoff — Launch Your Product Everywhere",
    description:
      "One input, 12+ platforms, zero hassle. AI writes the content, we handle the distribution.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700;800;900&family=Figtree:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text)] font-body antialiased">
        {children}
      </body>
    </html>
  );
}
