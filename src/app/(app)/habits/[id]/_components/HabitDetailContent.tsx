"use client";

import { useHabitsContext } from "@/contexts/habits-context";
import { CalendarView } from "./CalendarView";
import { HabitForm } from "@/components/habits/HabitForm";
import {
  CreateHabitInput,
  GoalInterval,
  RecordingType,
  WEEKDAY_NAMES,
} from "@/types/habit";
import {
  formatDate,
  calculateCurrentStreak,
  calculateBestStreak,
  calculateTotalValue,
  normalizeDate,
  isHabitCompleteOnDate,
  isStreakSecure,
  isHabitScheduledForDate,
  getProgressValueOnDate,
  shouldShowCheckmark,
} from "@/lib/habit-utils";
import { HabitIconDisplay } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Flame,
  CalendarDays,
  Target,
  Pencil,
  ArrowLeft,
  Repeat,
  Check,
  Plus,
  Minus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useState, ViewTransition } from "react";

interface HabitDetailContentProps {
  habitId: string;
}

export function HabitDetailContent({ habitId }: HabitDetailContentProps) {
  const { habits, tags, progressEvents, updateHabit, addTag, logProgress } =
    useHabitsContext();

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
  const totalValue = calculateTotalValue(habit, progressEvents);
  const habitTags = tags.filter((t) => habit.tagIds.includes(t.id));

  // Get progress for selected date
  const selectedDateStr = normalizeDate(selectedDate);
  const selectedDateProgress = progressEvents.find(
    (p) => p.habitId === habit.id && p.date === selectedDateStr,
  );
  const selectedDateValue = selectedDateProgress?.value ?? 0;
  const isSelectedDateComplete = isHabitCompleteOnDate(
    habit,
    progressEvents,
    selectedDateStr,
  );

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
    // Build description based on goal interval
    let intervalDesc = "";
    switch (habit.goalInterval) {
      case GoalInterval.DAILY:
        intervalDesc = "Daily";
        break;
      case GoalInterval.WEEKLY:
        intervalDesc = "Weekly";
        break;
      case GoalInterval.MONTHLY:
        intervalDesc = "Monthly";
        break;
      case GoalInterval.CUSTOM:
        intervalDesc = `Every ${habit.customIntervalDays ?? 1} days`;
        break;
      default:
        intervalDesc = "Unknown";
    }

    // Add scheduled days info if applicable
    if (habit.scheduledDaysOfWeek && habit.scheduledDaysOfWeek.length > 0) {
      const days = habit.scheduledDaysOfWeek
        .map((d) => WEEKDAY_NAMES[d].slice(0, 3))
        .join(", ");
      return `${intervalDesc} (${days})`;
    }
    return intervalDesc;
  };

  const streakProgress =
    bestStreak > 0 ? (currentStreak / bestStreak) * 100 : 0;

  return (
    <div className="h-full pb-28 lg:pb-6">
      {/* Hero Header */}
      <header className="relative overflow-visible -mt-16 pt-16 lg:mt-0 lg:pt-0">
        {/* Background gradient */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: habit.color
              ? `radial-gradient(ellipse at 50% 0%, ${habit.color}40 0%, transparent 70%)`
              : "radial-gradient(ellipse at 50% 0%, var(--primary) 0%, transparent 70%)",
          }}
        />

        <div className="relative px-4 lg:px-6 py-8 lg:py-10">
          {/* Edit button - floating */}
          <Button
            onClick={() => setIsFormOpen(true)}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 lg:top-6 lg:right-6 h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card z-10"
          >
            <Pencil className="w-4 h-4" />
          </Button>

          {/* Mobile: centered stacked layout */}
          <div className="flex flex-col items-center text-center lg:hidden">
            {/* Large habit icon with glow */}
            <div className="relative mb-6">
              <div
                className="absolute inset-0 blur-2xl opacity-40 scale-150"
                style={{
                  backgroundColor: habit.color || "var(--primary)",
                }}
              />
              <ViewTransition name={`habit-icon-${habitId}`}>
                <div
                  className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: habit.color
                      ? `${habit.color}20`
                      : "var(--primary)/10",
                    color: habit.color || "var(--primary)",
                  }}
                >
                  <HabitIconDisplay
                    iconName={habit.icon}
                    className="w-10 h-10"
                  />
                </div>
              </ViewTransition>
            </div>

            {/* Habit name */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
                  {habit.name}
                </h1>
                {!habit.isGoodHabit && (
                  <span className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide rounded bg-destructive/10 text-destructive">
                    Limit
                  </span>
                )}
              </div>
              {habit.description && (
                <p className="text-muted-foreground max-w-md">
                  {habit.description}
                </p>
              )}
            </div>

            {/* Tags */}
            {habitTags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                {habitTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2.5 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: tag.color
                        ? `${tag.color}15`
                        : "var(--muted)",
                      color: tag.color || "var(--muted-foreground)",
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Inline details pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground">
                <Repeat className="w-3 h-3" />
                {getRepeatDescription()}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground">
                <CalendarDays className="w-3 h-3" />
                Since {formatDate(habit.startDate, "short")}
              </span>
            </div>
          </div>

          {/* Desktop: left-aligned horizontal layout */}
          <div className="hidden lg:flex items-start gap-6">
            {/* Habit icon with glow */}
            <div className="relative shrink-0">
              <div
                className="absolute inset-0 blur-2xl opacity-40 scale-150"
                style={{
                  backgroundColor: habit.color || "var(--primary)",
                }}
              />
              {/* Avoid duplicate ViewTransition names by leaving the desktop icon unwrapped */}
              <div
                className="relative w-16 h-16 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: habit.color
                    ? `${habit.color}20`
                    : "var(--primary)/10",
                  color: habit.color || "var(--primary)",
                }}
              >
                <HabitIconDisplay iconName={habit.icon} className="w-8 h-8" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
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
                <p className="text-sm text-muted-foreground mb-3">
                  {habit.description}
                </p>
              )}

              {/* Tags and details inline */}
              <div className="flex flex-wrap items-center gap-2">
                {habitTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: tag.color
                        ? `${tag.color}15`
                        : "var(--muted)",
                      color: tag.color || "var(--muted-foreground)",
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground">
                  <Repeat className="w-3 h-3" />
                  {getRepeatDescription()}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground">
                  <CalendarDays className="w-3 h-3" />
                  Since {formatDate(habit.startDate, "short")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two column layout on desktop */}
      <div className="px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Stats */}
          <div className="lg:col-span-5 space-y-6">
            {/* Stats Grid */}
            <div className="space-y-3">
              {/* Current Streak with Week View */}
              <div className="relative overflow-hidden bg-card rounded-3xl border border-border/50 p-6">
                <div className="relative">
                  {/* Header with progress ring */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-5">
                      {/* Simple flame icon with glow */}
                      <div className="relative flex items-center justify-center w-20 h-20">
                        <div
                          className={cn(
                            "absolute inset-0 blur-2xl opacity-40 scale-125 transition-all duration-300",
                            isStreakSecure(habit, progressEvents)
                              ? "opacity-60"
                              : "opacity-40",
                          )}
                          style={{
                            backgroundColor: isStreakSecure(
                              habit,
                              progressEvents,
                            )
                              ? "var(--warning)"
                              : habit.color || "var(--primary)",
                          }}
                        />
                        <Flame
                          fill="currentColor"
                          className={cn(
                            "relative w-12 h-12 transition-all duration-300",
                            isStreakSecure(habit, progressEvents)
                              ? "text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]"
                              : "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]",
                          )}
                          style={{
                            color:
                              !isStreakSecure(habit, progressEvents) &&
                              habit.color
                                ? habit.color
                                : isStreakSecure(habit, progressEvents)
                                  ? "#f97316"
                                  : undefined,
                          }}
                        />
                      </div>

                      {/* Streak number and text */}
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-5xl font-display font-bold tracking-tight text-foreground">
                            {currentStreak}
                          </span>
                          <span className="text-lg text-muted-foreground font-medium">
                            {currentStreak === 1 ? "day" : "days"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Current Streak
                          </p>
                          {bestStreak > 0 && currentStreak > 0 && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                              {Math.round(streakProgress)}% of best
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Week view */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        This Week
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          const today = new Date();
                          const completed = [];
                          for (let i = 6; i >= 0; i--) {
                            const date = new Date(today);
                            date.setDate(today.getDate() - i);
                            const dateStr = normalizeDate(date);
                            const isScheduled = isHabitScheduledForDate(
                              habit,
                              date,
                            );
                            const value = getProgressValueOnDate(
                              progressEvents,
                              habit.id,
                              dateStr,
                            );
                            if (isScheduled && value > 0) completed.push(date);
                          }
                          return `${completed.length}/7 completed`;
                        })()}
                      </p>
                    </div>

                    <div className="grid grid-cols-7 gap-2.5">
                      {(() => {
                        const today = new Date();
                        const weekDays = [];
                        for (let i = 6; i >= 0; i--) {
                          const date = new Date(today);
                          date.setDate(today.getDate() - i);
                          const dateStr = normalizeDate(date);
                          const isScheduled = isHabitScheduledForDate(
                            habit,
                            date,
                          );
                          const value = getProgressValueOnDate(
                            progressEvents,
                            habit.id,
                            dateStr,
                          );
                          const isComplete = value > 0;
                          const isInStreak = shouldShowCheckmark(
                            habit,
                            progressEvents,
                            date,
                          );
                          const isToday =
                            normalizeDate(date) === normalizeDate(today);

                          weekDays.push(
                            <div
                              key={dateStr}
                              className="flex flex-col items-center gap-2"
                            >
                              <span
                                className={cn(
                                  "text-xs font-bold uppercase transition-colors",
                                  isToday
                                    ? "text-primary"
                                    : "text-muted-foreground/60",
                                )}
                              >
                                {date
                                  .toLocaleDateString("en-US", {
                                    weekday: "short",
                                  })
                                  .charAt(0)}
                              </span>
                              <div className="relative w-full">
                                {/* Glow effect for completed days */}
                                {isComplete && (
                                  <div
                                    className="absolute inset-0 rounded-xl blur-md opacity-40"
                                    style={{
                                      backgroundColor:
                                        habit.color || "var(--primary)",
                                    }}
                                  />
                                )}
                                <div
                                  className={cn(
                                    "relative w-full aspect-square rounded-xl transition-all duration-300 border-2",
                                    isToday && [
                                      "ring-2 ring-offset-2 ring-offset-background scale-105",
                                      isScheduled &&
                                        !isComplete &&
                                        "border-primary",
                                    ],
                                    isInStreak &&
                                      !isComplete &&
                                      "border-primary/50",
                                    isComplete &&
                                      "shadow-[0_4px_12px_var(--primary)_40] shadow-primary/40 bg-primary border-primary",
                                  )}
                                >
                                  {/* Checkmark for completed days */}
                                  {isComplete && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Check className="w-4 h-4 text-white font-bold drop-shadow" />
                                    </div>
                                  )}
                                  {/* Right arrow for days in streak without progress */}
                                  {!isToday && isInStreak && !isComplete && (
                                    <ArrowRight
                                      className={cn(
                                        "absolute inset-0 m-auto w-4 h-4 text-primary/60",
                                      )}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>,
                          );
                        }
                        return weekDays;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Value (for count/value habits) */}
              {(habit.recordingType === RecordingType.COUNT ||
                habit.recordingType === RecordingType.VALUE) && (
                <div className="col-span-2 bg-card rounded-2xl border border-border p-4 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
                  <div className="flex items-center gap-2 text-accent-foreground mb-2">
                    <Target className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-medium">
                      Total
                    </span>
                  </div>
                  <span className="text-2xl font-display font-bold">
                    {totalValue}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">logged</p>
                </div>
              )}
            </div>

            {/* Quick-Log Panel - Desktop only, inline */}
            <div className="hidden lg:block bg-card rounded-2xl border border-border p-5">
              <h3 className="font-semibold mb-3">
                {formatDate(selectedDateStr, "long")}
              </h3>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {isSelectedDateComplete ? (
                    <span className="text-primary flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : selectedDateValue > 0 ? (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">{selectedDateValue}</span>
                      <span>/ {habit.goalTarget ?? 1}</span>
                    </span>
                  ) : (
                    "Not logged yet"
                  )}
                </p>

                {habit.recordingType === RecordingType.YES_NO ? (
                  <Button
                    variant={isSelectedDateComplete ? "outline" : "default"}
                    size="default"
                    onClick={() =>
                      handleLogProgressForDate(isSelectedDateComplete ? 0 : 1)
                    }
                    className={cn("gap-2")}
                  >
                    <Check className="w-4 h-4" />
                    {isSelectedDateComplete ? "Done" : "Mark Complete"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() =>
                        handleLogProgressForDate(selectedDateValue - 1)
                      }
                      disabled={selectedDateValue <= 0}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      value={selectedDateValue}
                      onChange={(e) =>
                        handleLogProgressForDate(parseInt(e.target.value) || 0)
                      }
                      className="w-16 h-9 text-center font-semibold"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() =>
                        handleLogProgressForDate(selectedDateValue + 1)
                      }
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Calendar */}
          <div className="lg:col-span-7">
            <div>
              <div className="bg-card rounded-2xl border border-border p-4 lg:p-6">
                <CalendarView
                  habit={habit}
                  progressEvents={progressEvents.filter(
                    (p) => p.habitId === habit.id,
                  )}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Quick-Log Panel - Mobile only */}
      <div
        className="fixed left-0 right-0 lg:hidden z-10 bottom-16"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="m-2 rounded bg-card/95 backdrop-blur-md border-t border-border p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">
                {formatDate(selectedDateStr, "long")}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isSelectedDateComplete ? (
                  <span className="text-success flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Completed
                  </span>
                ) : selectedDateValue > 0 ? (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">{selectedDateValue}</span>
                    <span>/ {habit.goalTarget ?? 1}</span>
                  </span>
                ) : (
                  "Tap to log progress"
                )}
              </p>
            </div>

            {habit.recordingType === RecordingType.YES_NO ? (
              <Button
                variant={isSelectedDateComplete ? "outline" : "default"}
                size="lg"
                onClick={() =>
                  handleLogProgressForDate(isSelectedDateComplete ? 0 : 1)
                }
                className={cn("gap-2 min-w-35")}
              >
                <Check className="w-5 h-5" />
                {isSelectedDateComplete ? "Done" : "Mark Complete"}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() =>
                    handleLogProgressForDate(selectedDateValue - 1)
                  }
                  disabled={selectedDateValue <= 0}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <Input
                  type="number"
                  min={0}
                  value={selectedDateValue}
                  onChange={(e) =>
                    handleLogProgressForDate(parseInt(e.target.value) || 0)
                  }
                  className="w-20 h-10 text-center text-lg font-semibold"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() =>
                    handleLogProgressForDate(selectedDateValue + 1)
                  }
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            )}
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
