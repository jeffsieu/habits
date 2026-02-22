"use client";

import { Habit, HabitProgressEvent, HabitTag } from "@/types/habit";
import {
  getHabitsForDate,
  normalizeDate,
  formatDate,
  isToday,
  isHabitCompleteOnDate,
} from "@/lib/habit-utils";
import { HabitCard } from "./habit-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Sparkles, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayDetailPanelProps {
  selectedDate: Date;
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  onLogProgress: (habitId: string, value: number) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onAddHabit?: () => void;
}

export function DayDetailPanel({
  selectedDate,
  habits,
  tags,
  progressEvents,
  onLogProgress,
  onEditHabit,
  onDeleteHabit,
  onAddHabit,
}: DayDetailPanelProps) {
  const dateStr = normalizeDate(selectedDate);
  const scheduledHabits = getHabitsForDate(habits, selectedDate);
  const isTodayDate = isToday(selectedDate);

  const completedCount = scheduledHabits.filter((h) =>
    isHabitCompleteOnDate(h, progressEvents, dateStr),
  ).length;
  const totalCount = scheduledHabits.length;
  const allComplete = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isTodayDate
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-semibold text-foreground">
                {isTodayDate ? "Today" : formatDate(selectedDate, "short")}
              </h2>
              {isTodayDate && (
                <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded bg-primary/10 text-primary">
                  Now
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(selectedDate, "long")}
            </p>
          </div>
        </div>

        {/* Progress summary */}
        {totalCount > 0 && (
          <div
            className={cn(
              "mt-2 p-2 rounded-lg",
              allComplete
                ? "bg-success/10 border border-success/20"
                : "bg-muted/50",
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground">
                {allComplete ? "All done!" : "Progress"}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  allComplete ? "text-success" : "text-foreground",
                )}
              >
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  allComplete ? "bg-success" : "bg-primary",
                )}
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Habits for the day */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-2 pb-2">
          {scheduledHabits.length > 0 ? (
            scheduledHabits.map((habit, index) => (
              <div
                key={habit.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <HabitCard
                  habit={habit}
                  tags={tags}
                  progressEvents={progressEvents}
                  date={dateStr}
                  onLogProgress={onLogProgress}
                  onEdit={onEditHabit}
                  onDelete={onDeleteHabit}
                />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-0.5">
                No habits scheduled
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {isTodayDate
                  ? "Add a habit to start building your routine"
                  : "No habits were scheduled for this day"}
              </p>
              {onAddHabit && isTodayDate && (
                <Button
                  onClick={onAddHabit}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Habit
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
