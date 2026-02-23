"use client";

import { ReactNode } from "react";
import { useHabitsContext } from "@/contexts/habits-context";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileSidebarTrigger } from "@/components/app-sidebar";
import { useRandomQuote } from "@/hooks/use-random-quote";
import { Sparkles } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const { habits, tags, progressEvents, isLoaded, addTag, updateTag } =
    useHabitsContext();
  const quote = useRandomQuote();

  const handleAddTag = (name: string, color?: string) => {
    return addTag({ name, color });
  };

  const handleUpdateTag = (
    id: string,
    input: Partial<{ name: string; color?: string }>,
  ) => {
    updateTag(id, input);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          {quote && (
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
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop only */}
      <AppSidebar
        habits={habits}
        tags={tags}
        progressEvents={progressEvents}
        onAddTag={handleAddTag}
        onUpdateTag={handleUpdateTag}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 lg:hidden">
          <div className="flex items-center gap-2">
            <MobileSidebarTrigger
              habits={habits}
              tags={tags}
              progressEvents={progressEvents}
              onAddTag={handleAddTag}
              onUpdateTag={handleUpdateTag}
            />
          </div>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
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
