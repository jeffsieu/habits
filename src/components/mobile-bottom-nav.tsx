"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isHabits = pathname?.startsWith("/habits");
  const isProfile = pathname === "/profile";

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
            isHome
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">Home</span>
        </Link>
        <Link
          href="/habits"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
            isHabits
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-xs font-medium">Habits</span>
        </Link>
        <Link
          href="/profile"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
            isProfile
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
