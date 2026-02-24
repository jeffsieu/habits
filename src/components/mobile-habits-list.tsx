"use client";

import { useState, useMemo, startTransition } from "react";
import { Habit, HabitTag, HabitProgressEvent } from "@/types/habit";
import { calculateCurrentStreak } from "@/lib/habit-utils";
import { HabitIconDisplay } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ViewTransition } from "react";

interface MobileHabitsListProps {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
}

export function MobileHabitsList({
  habits,
  tags,
  progressEvents,
}: MobileHabitsListProps) {
  const router = useRouter();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Filter habits based on selected tag
  const filteredHabits = useMemo(() => {
    if (!selectedTagId) {
      return habits;
    }
    return habits.filter((habit) => habit.tagIds.includes(selectedTagId));
  }, [habits, selectedTagId]);

  return (
    <div className="flex flex-col h-full">
      {/* Tag chips */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border/50 px-6 py-4 z-10">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
          <button
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out",
              "border-2 active:scale-95",
              selectedTagId === null
                ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-background border-border hover:border-foreground/20 hover:bg-accent/50 text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setSelectedTagId(null)}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out",
                "border-2 active:scale-95",
                selectedTagId === tag.id
                  ? tag.color
                    ? "text-white shadow-sm"
                    : "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "bg-background hover:bg-accent/50",
              )}
              style={
                selectedTagId === tag.id && tag.color
                  ? {
                      backgroundColor: tag.color,
                      borderColor: tag.color,
                      boxShadow: `0 2px 8px ${tag.color}30`,
                    }
                  : selectedTagId !== tag.id && tag.color
                    ? {
                        borderColor: `${tag.color}40`,
                        color: tag.color,
                      }
                    : selectedTagId !== tag.id
                      ? { borderColor: "var(--border)" }
                      : undefined
              }
              onClick={() => setSelectedTagId(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Habits list */}
      <div className="flex-1 overflow-y-auto">
        {filteredHabits.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground text-sm">No habits to show</p>
          </div>
        ) : (
          <div key={selectedTagId ?? "all"} className="divide-y divide-border">
            {filteredHabits.map((habit, index) => {
              const streak = calculateCurrentStreak(habit, progressEvents);

              return (
                <div
                  key={habit.id}
                  className="opacity-0 animate-slide-up"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <Link
                    href={`/habits/${habit.id}`}
                    className="flex items-center gap-4 px-4 py-3 bg-card hover:bg-accent/50 active:bg-accent/70 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      startTransition(() => {
                        router.push(`/habits/${habit.id}`);
                      });
                    }}
                  >
                    {/* Icon */}
                    <ViewTransition name={`habit-icon-${habit.id}`}>
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: habit.color
                            ? `${habit.color}15`
                            : "hsl(var(--muted))",
                          color: habit.color || undefined,
                        }}
                      >
                        <HabitIconDisplay
                          iconName={habit.icon}
                          className="w-5 h-5"
                        />
                      </div>
                    </ViewTransition>

                    {/* Name and tags */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {habit.name}
                        </p>
                      </div>

                      {habit.tagIds.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {habit.tagIds.map((tagId) => {
                            const tag = tags.find((t) => t.id === tagId);
                            if (!tag) return null;
                            return (
                              <span
                                key={tagId}
                                className="text-xs px-1.5 py-0.5 rounded opacity-80"
                                style={{
                                  backgroundColor: tag.color
                                    ? `${tag.color}20`
                                    : undefined,
                                  color: tag.color || "currentColor",
                                }}
                              >
                                {tag.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {streak > 0 && (
                      <div className="flex items-center text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full shrink-0">
                        <Flame className="w-3.5 h-3.5 mr-1 fill-current" />
                        {streak}
                      </div>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
