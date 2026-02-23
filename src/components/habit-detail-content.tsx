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
  normalizeDate,
  isHabitCompleteOnDate,
  isStreakSecure,
} from "@/lib/habit-utils";
import { HabitIconDisplay } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Minus,
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
    logProgress,
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

  // Get progress for selected date
  const selectedDateStr = normalizeDate(selectedDate);
  const selectedDateProgress = progressEvents.find(
    (p) => p.habitId === habit.id && p.date === selectedDateStr
  );
  const selectedDateValue = selectedDateProgress?.value ?? 0;
  const isSelectedDateComplete = isHabitCompleteOnDate(habit, progressEvents, selectedDateStr);

  const handleLogProgressForDate = (value: number) => {
    logProgress({
      habitId: habit.id,
      date: selectedDateStr,
      value: Math.max(0, value),
    });
  };

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
                  <div className={cn(
                    "flex items-center gap-2",
                    isStreakSecure(habit, progressEvents) ? "text-warning" : "text-muted-foreground"
                  )}>
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
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <CalendarView
                habits={[habit]}
                progressEvents={progressEvents.filter((p) => p.habitId === habit.id)}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>

            {/* Log Progress for Selected Date */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">
                    {formatDate(selectedDateStr, "long")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isSelectedDateComplete ? (
                      <span className="text-success flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Completed
                      </span>
                    ) : selectedDateValue > 0 ? (
                      `${selectedDateValue} / ${habit.targetOccurrences ?? 1}`
                    ) : (
                      "Not logged"
                    )}
                  </p>
                </div>

                {habit.completionType === CompletionType.YES_NO ? (
                  <Button
                    variant={isSelectedDateComplete ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLogProgressForDate(isSelectedDateComplete ? 0 : 1)}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {isSelectedDateComplete ? "Done" : "Mark Complete"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleLogProgressForDate(selectedDateValue - 1)}
                      disabled={selectedDateValue <= 0}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      value={selectedDateValue}
                      onChange={(e) => handleLogProgressForDate(parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleLogProgressForDate(selectedDateValue + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
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
