"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startTransition } from "react";

export function MobileAppBar() {
  const pathname = usePathname();
  const router = useRouter();

  // Determine title and back button based on route
  const getAppBarContent = () => {
    if (pathname === "/") {
      return { title: "Home", showBack: false };
    } else if (pathname === "/habits") {
      return { title: "Habits", showBack: false };
    } else if (pathname === "/profile") {
      return { title: "Profile", showBack: false };
    } else if (pathname?.startsWith("/habits/")) {
      return { title: "Habits", showBack: true };
    }
    return { title: "", showBack: false };
  };

  const { title, showBack } = getAppBarContent();

  if (!title) return null;

  return (
    <header className="lg:hidden h-16 border-b border-border/50 backdrop-blur-xl fixed top-0 left-0 right-0 z-40 flex items-center px-6 pointer-events-none">
      <div className="pointer-events-auto">
        {showBack ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2 font-display font-semibold text-lg hover:bg-transparent"
            onClick={() => {
              startTransition(() => {
                router.back();
              });
            }}
          >
            <ChevronLeft className="h-5 w-5" />
            {title}
          </Button>
        ) : (
          <h1 className="font-display font-bold text-2xl tracking-tight">
            {title}
          </h1>
        )}
      </div>
    </header>
  );
}
