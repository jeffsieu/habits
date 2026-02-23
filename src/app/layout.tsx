import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Habits - Build Better Habits",
  description: "Track your daily habits and build better routines with style",
  openGraph: {
    title: "Habits - Build Better Habits",
    description: "Track your daily habits and build better routines with style",
    siteName: "Habits",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Habits - Build Better Habits",
    description: "Track your daily habits and build better routines with style",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers>
          {/* Grain texture overlay for warmth */}
          <div className="grain-overlay" aria-hidden="true" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
