import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";

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
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Grain texture overlay for warmth */}
            <div className="grain-overlay" aria-hidden="true" />
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
