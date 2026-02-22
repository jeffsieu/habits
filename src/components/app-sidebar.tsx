"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Habit } from "@/types/habit";
import { HabitIconDisplay } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  ChevronRight,
  Menu,
  ListTodo,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AppSidebarProps {
  habits: Habit[];
}

function SidebarContent({ habits, onLinkClick }: { habits: Habit[]; onLinkClick?: () => void }) {
  const pathname = usePathname();
  
  return (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="px-4 py-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2" onClick={onLinkClick}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ListTodo className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-lg">Habits</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {/* Home */}
          <Link
            href="/"
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>

          {/* Habits Section */}
          <div className="pt-4">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Habits
            </div>
            <div className="space-y-0.5 mt-1">
              {habits.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No habits yet
                </p>
              ) : (
                habits.map((habit) => {
                  const isActive = pathname === `/habits/${habit.id}`;
                  return (
                    <Link
                      key={habit.id}
                      href={`/habits/${habit.id}`}
                      onClick={onLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: habit.color ? `${habit.color}15` : undefined,
                          color: habit.color || undefined,
                        }}
                      >
                        <HabitIconDisplay iconName={habit.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate flex-1">{habit.name}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </nav>
      </ScrollArea>
    </div>
  );
}

// Desktop sidebar component
export function AppSidebar({ habits }: AppSidebarProps) {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border lg:bg-card">
      <SidebarContent habits={habits} />
    </aside>
  );
}

// Mobile sidebar trigger component
export function MobileSidebarTrigger({ habits }: AppSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SidebarContent habits={habits} onLinkClick={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
