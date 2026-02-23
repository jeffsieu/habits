"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Habit,
  HabitProgressEvent,
  HabitTag,
  CompletionType,
} from "@/types/habit";
import {
  normalizeDate,
  isHabitScheduledForDate,
  getProgressValueOnDate,
  addDays,
} from "@/lib/habit-utils";
import { HabitIconDisplay } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface HabitListViewProps {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  onLogProgress: (habitId: string, date: string, value: number) => void;
  onAddHabit: () => void;
}

const DAYS_TO_SHOW = 3;

interface DayGroup {
  date: Date;
  dateStr: string;
  label: string;
  habits: Habit[];
}

function formatDayLabel(date: Date, today: Date): string {
  const todayStr = normalizeDate(today);
  const dateStr = normalizeDate(date);
  const tomorrow = addDays(today, 1);
  const tomorrowStr = normalizeDate(tomorrow);

  if (dateStr === todayStr) {
    return "Today";
  } else if (dateStr === tomorrowStr) {
    return "Tomorrow";
  } else {
    // Format as "Wed, Feb 26"
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
}

function getDayGroups(habits: Habit[], today: Date): DayGroup[] {
  const groups: DayGroup[] = [];

  for (let i = 0; i < DAYS_TO_SHOW; i++) {
    const date = addDays(today, i);
    const dateStr = normalizeDate(date);
    const scheduledHabits = habits.filter((habit) =>
      isHabitScheduledForDate(habit, date),
    );

    if (scheduledHabits.length > 0) {
      groups.push({
        date,
        dateStr,
        label: formatDayLabel(date, today),
        habits: scheduledHabits,
      });
    }
  }

  return groups;
}

interface HabitListItemProps {
  habit: Habit;
  dateStr: string;
  progressEvents: HabitProgressEvent[];
  onLogProgress: (habitId: string, date: string, value: number) => void;
}

function HabitListItem({
  habit,
  dateStr,
  progressEvents,
  onLogProgress,
}: HabitListItemProps) {
  const currentValue = getProgressValueOnDate(
    progressEvents,
    habit.id,
    dateStr,
  );
  const isYesNo = habit.completionType === CompletionType.YES_NO;
  const isComplete = isYesNo ? currentValue >= 1 : false;

  const handleCheckboxChange = (checked: boolean) => {
    onLogProgress(habit.id, dateStr, checked ? 1 : 0);
  };

  const handleIncrement = () => {
    onLogProgress(habit.id, dateStr, currentValue + 1);
  };

  const handleDecrement = () => {
    if (currentValue > 0) {
      onLogProgress(habit.id, dateStr, currentValue - 1);
    }
  };

  return (
    <Link
      href={`/habits/${habit.id}`}
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-b-0",
        "hover:bg-muted/30 active:bg-muted/50 transition-colors",
      )}
    >
      {/* Left side: Icon + Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: habit.color
              ? `${habit.color}20`
              : "hsl(var(--muted))",
          }}
        >
          <HabitIconDisplay iconName={habit.icon} className="w-4 h-4" />
        </div>
        <span className="font-medium truncate">{habit.name}</span>
      </div>

      {/* Right side: Controls */}
      <div className="shrink-0 ml-3" onClick={(e) => e.preventDefault()}>
        {isYesNo ? (
          <Checkbox
            checked={isComplete}
            onCheckedChange={handleCheckboxChange}
            className="w-6 h-6"
          />
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDecrement}
              disabled={currentValue <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-medium tabular-nums">
              {currentValue}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleIncrement}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Link>
  );
}

export function HabitListView({
  habits,
  progressEvents,
  onLogProgress,
  onAddHabit,
}: HabitListViewProps) {
  const today = useMemo(() => new Date(), []);
  const dayGroups = useMemo(() => getDayGroups(habits, today), [habits, today]);

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-muted-foreground text-center mb-4">
          No habits yet. Create your first habit to get started!
        </p>
        <Button onClick={onAddHabit}>
          <Plus className="w-4 h-4 mr-2" />
          Add Habit
        </Button>
      </div>
    );
  }

  if (dayGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-muted-foreground text-center">
          No habits scheduled for the next {DAYS_TO_SHOW} days.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {dayGroups.map((group) => (
        <div key={group.dateStr}>
          {/* Day Header */}
          <div className="px-4 py-2 bg-muted/50 sticky top-0">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {group.label}
            </h3>
          </div>

          {/* Habits for this day */}
          <div>
            {group.habits.map((habit) => (
              <HabitListItem
                key={`${habit.id}-${group.dateStr}`}
                habit={habit}
                dateStr={group.dateStr}
                progressEvents={progressEvents}
                onLogProgress={onLogProgress}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Add Habit Button */}
      <div className="p-4">
        <Button variant="outline" className="w-full" onClick={onAddHabit}>
          <Plus className="w-4 h-4 mr-2" />
          Add Habit
        </Button>
      </div>
    </div>
  );
}
