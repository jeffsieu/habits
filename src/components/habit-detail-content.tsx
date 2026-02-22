"use client";

import { useHabitsContext } from "@/contexts/habits-context";
import { CalendarView } from "@/components/calendar-view";
import { HabitForm } from "@/components/habit-form";
import { CreateHabitInput, RepeatType, CompletionType, WEEKDAY_NAMES } from "@/types/habit";
import {
  formatDate,
  calculateCurrentStreak,
  calculateBestStreak,
  calculateTotalCompletedDays,
  calculateTotalValue,
} from "@/lib/habit-utils";
import { HabitIconDisplay } from "@/lib/habit-icons";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  Trophy, 
  CalendarDays, 
  Target, 
  Pencil,
  ArrowLeft,
  BarChart3,
  Clock,
  Repeat,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface HabitDetailContentProps {
  habitId: string;
}

export function HabitDetailContent({ habitId }: HabitDetailContentProps) {
  const {
    habits,
    tags,
    progressEvents,
    updateHabit,
    addTag,
  } = useHabitsContext();

  const habit = habits.find((h) => h.id === habitId);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  if (!habit) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <p className="text-muted-foreground">Habit not found</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const currentStreak = calculateCurrentStreak(habit, progressEvents);
  const bestStreak = calculateBestStreak(habit, progressEvents);
  const totalCompletedDays = calculateTotalCompletedDays(habit, progressEvents);
  const totalValue = calculateTotalValue(habit, progressEvents);
  const habitTags = tags.filter((t) => habit.tagIds.includes(t.id));

  const handleFormSubmit = (input: CreateHabitInput) => {
    updateHabit({ id: habit.id, ...input });
  };

  const handleCreateTag = (name: string, color?: string) => {
    return addTag({ name, color });
  };

  const getRepeatDescription = () => {
    switch (habit.repeatType) {
      case RepeatType.DAILY:
        return "Every day";
      case RepeatType.WEEKLY:
        return `Every week (${WEEKDAY_NAMES[habit.repeatWeekDay ?? 1]})`;
      case RepeatType.MONTHLY:
        return `Every month (day ${habit.repeatMonthDay ?? 1})`;
      case RepeatType.CUSTOM:
        if (habit.customDaysOfWeek && habit.customDaysOfWeek.length > 0) {
          const days = habit.customDaysOfWeek.map((d) => WEEKDAY_NAMES[d].slice(0, 3)).join(", ");
          return `Custom (${days})`;
        }
        return `Every ${habit.customIntervalDays ?? 1} days`;
      default:
        return "Unknown";
    }
  };

  const getCompletionDescription = () => {
    if (habit.completionType === CompletionType.YES_NO) {
      return "Yes/No completion";
    }
    return `${habit.targetOccurrences ?? 1} times to complete`;
  };

  return (
    <div className="h-full">
      {/* Header */}
      <header className="border-b border-border bg-linear-to-br from-primary/5 via-transparent to-accent/5">
        <div className="px-4 lg:px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Habit icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: habit.color ? `${habit.color}15` : "var(--muted)",
                  color: habit.color || "var(--muted-foreground)",
                }}
              >
                <HabitIconDisplay iconName={habit.icon} className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                    {habit.name}
                  </h1>
                  {!habit.isGoodHabit && (
                    <span className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide rounded bg-destructive/10 text-destructive">
                      Limit
                    </span>
                  )}
                </div>
                {habit.description && (
                  <p className="text-sm text-muted-foreground">{habit.description}</p>
                )}
                {habitTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {habitTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: tag.color ? `${tag.color}15` : "var(--muted)",
                          color: tag.color || "var(--muted-foreground)",
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button onClick={() => setIsFormOpen(true)} variant="outline" size="sm">
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stats */}
          <div className="lg:col-span-5 space-y-4">
            {/* Streak stats */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h2 className="font-semibold text-sm text-muted-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Statistics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-warning">
                    <Flame className="w-5 h-5" />
                    <span className="text-2xl font-display font-semibold">{currentStreak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-primary">
                    <Trophy className="w-5 h-5" />
                    <span className="text-2xl font-display font-semibold">{bestStreak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-success">
                    <CalendarDays className="w-5 h-5" />
                    <span className="text-2xl font-display font-semibold">{totalCompletedDays}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Days Completed</p>
                </div>
                {habit.completionType === CompletionType.X_OCCURRENCES && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-accent-foreground">
                      <Target className="w-5 h-5" />
                      <span className="text-2xl font-display font-semibold">{totalValue}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Count</p>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h2 className="font-semibold text-sm text-muted-foreground mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Details
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Repeat className="w-4 h-4" />
                    Repeat
                  </span>
                  <span className="font-medium">{getRepeatDescription()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Completion
                  </span>
                  <span className="font-medium">{getCompletionDescription()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Started
                  </span>
                  <span className="font-medium">{formatDate(habit.startDate, "short")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-7">
            <div className="bg-card rounded-xl border border-border p-4">
              <CalendarView
                habits={[habit]}
                progressEvents={progressEvents.filter((p) => p.habitId === habit.id)}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Dialog */}
      <HabitForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        onCreateTag={handleCreateTag}
        tags={tags}
        editingHabit={habit}
      />
    </div>
  );
}
