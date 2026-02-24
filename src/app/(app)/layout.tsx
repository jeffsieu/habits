"use client";

import { ReactNode, useState, useEffect } from "react";
import { useHabitsContext } from "@/contexts/habits-context";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileAppBar } from "@/components/mobile-app-bar";
import { useRandomQuote } from "@/hooks/use-random-quote";
import { Sparkles } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const { habits, tags, progressEvents, isLoaded, addTag, updateTag } =
    useHabitsContext();
  const quote = useRandomQuote();
  const [hideLoader, setHideLoader] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Client-only mounting to prevent hydration mismatch with Radix UI components
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAddTag = (name: string, color?: string) => {
    return addTag({ name, color });
  };

  const handleUpdateTag = (
    id: string,
    input: Partial<{ name: string; color?: string }>,
  ) => {
    updateTag(id, input);
  };

  useEffect(() => {
    if (isLoaded) {
      const timeout = setTimeout(() => {
        setHideLoader(true);
      }, 300); // wait for fade animation
      return () => clearTimeout(timeout);
    }
  }, [isLoaded]);

  // Show loading screen while data loads
  const showLoading = !isLoaded || !hideLoader || !quote;

  return (
    <div className="relative min-h-screen">
      {/* Main content - only render interactive components after mount */}
      {isMounted && (
        <div
          className={`flex min-h-screen bg-background ${showLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        >
          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block">
            <AppSidebar
              habits={habits}
              tags={tags}
              progressEvents={progressEvents}
              onAddTag={handleAddTag}
              onUpdateTag={handleUpdateTag}
            />
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile app bar */}
            <MobileAppBar />

            {/* Page content with top padding for fixed app bar on mobile, bottom padding for mobile nav */}
            <main className="flex-1 pt-16 pb-16 lg:pt-0 lg:pb-0">
              {children}
            </main>
          </div>

          {/* Mobile bottom navigation */}
          <MobileBottomNav />
        </div>
      )}

      {/* Loading overlay */}
      {showLoading && quote && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-background/60 px-6 transition-opacity duration-300 ${
            isLoaded ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-medium text-lg italic">
                  &ldquo;{quote.text}&rdquo;
                </p>
                {quote.author && (
                  <p className="text-muted-foreground text-sm">
                    — {quote.author}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayoutContent>{children}</AppLayoutContent>;
}
