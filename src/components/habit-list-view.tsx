"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
import { Plus, Minus, ChevronDown, Loader2 } from "lucide-react";

interface HabitListViewProps {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  onLogProgress: (habitId: string, date: string, value: number) => void;
  onAddHabit: () => void;
}

const INITIAL_DAYS = 2; // Today and Yesterday
const LOAD_MORE_BATCH = 7; // Load a week at a time

interface DayGroup {
  date: Date;
  dateStr: string;
  label: string;
  habits: Habit[];
}

function formatDayLabel(date: Date, today: Date): string {
  const todayStr = normalizeDate(today);
  const dateStr = normalizeDate(date);
  const yesterday = addDays(today, -1);
  const yesterdayStr = normalizeDate(yesterday);

  if (dateStr === todayStr) {
    return "Today";
  } else if (dateStr === yesterdayStr) {
    return "Yesterday";
  } else {
    // Format as "Wed, Feb 26"
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
}

function getDayGroups(
  habits: Habit[],
  today: Date,
  daysToShow: number,
): DayGroup[] {
  const groups: DayGroup[] = [];

  // Start from today and go backwards
  for (let i = 0; i < daysToShow; i++) {
    const date = addDays(today, -i);
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

function DayGroupComponent({
  group,
  progressEvents,
  onLogProgress,
}: {
  group: DayGroup;
  progressEvents: HabitProgressEvent[];
  onLogProgress: (habitId: string, date: string, value: number) => void;
}) {
  return (
    <div>
      {/* Day Header */}
      <div className="px-4 py-2 bg-muted/50 sticky top-0 z-10">
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
  );
}

export function HabitListView({
  habits,
  progressEvents,
  onLogProgress,
  onAddHabit,
}: HabitListViewProps) {
  const today = useMemo(() => new Date(), []);
  const [daysToShow, setDaysToShow] = useState(INITIAL_DAYS);
  const [showOlder, setShowOlder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Find the earliest habit start date to know when to stop loading
  const earliestStartDate = useMemo(() => {
    if (habits.length === 0) return null;
    const dates = habits.map((h) => new Date(h.startDate.split("T")[0]));
    return new Date(Math.min(...dates.map((d) => d.getTime())));
  }, [habits]);

  // Get all day groups up to daysToShow
  const allDayGroups = useMemo(
    () => getDayGroups(habits, today, daysToShow),
    [habits, today, daysToShow],
  );

  // Split into initial (today + yesterday) and older groups
  const initialGroups = useMemo(() => {
    return getDayGroups(habits, today, INITIAL_DAYS);
  }, [habits, today]);

  const olderGroups = useMemo(() => {
    if (!showOlder) return [];
    return allDayGroups.slice(INITIAL_DAYS);
  }, [allDayGroups, showOlder]);

  // Compute if we have more days to load
  const hasMoreDays = useMemo(() => {
    if (!showOlder) return true;
    if (!earliestStartDate) return false;

    // Check if we've passed the earliest start date
    const oldestLoadedDate = addDays(today, -(daysToShow - 1));
    if (oldestLoadedDate < earliestStartDate) {
      return false;
    }

    return true;
  }, [showOlder, daysToShow, earliestStartDate, today]);

  // Load more days when scrolling
  const loadMoreDays = useCallback(() => {
    if (!hasMoreDays || isLoading) return;

    setIsLoading(true);
    // Small delay for smoother UX
    setTimeout(() => {
      setDaysToShow((prev) => prev + LOAD_MORE_BATCH);
      setIsLoading(false);
    }, 100);
  }, [hasMoreDays, isLoading]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!showOlder || !hasMoreDays) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading && hasMoreDays) {
          loadMoreDays();
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0,
      },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [showOlder, isLoading, loadMoreDays, hasMoreDays]);

  const handleShowOlder = () => {
    setShowOlder(true);
    setDaysToShow(INITIAL_DAYS + LOAD_MORE_BATCH);
  };

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

  if (initialGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-muted-foreground text-center">
          No habits scheduled for today or yesterday.
        </p>
        <Button onClick={onAddHabit} className="mt-4">
          <Plus className="w-4 h-4 mr-2" />
          Add Habit
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {/* Today and Yesterday */}
      {initialGroups.map((group) => (
        <DayGroupComponent
          key={group.dateStr}
          group={group}
          progressEvents={progressEvents}
          onLogProgress={onLogProgress}
        />
      ))}

      {/* Show Older Button or Older Days */}
      {!showOlder ? (
        <div className="p-4 flex justify-center">
          <Button
            variant="ghost"
            onClick={handleShowOlder}
            className="text-muted-foreground"
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Show older
          </Button>
        </div>
      ) : (
        <>
          {/* Older day groups */}
          {olderGroups.map((group) => (
            <DayGroupComponent
              key={group.dateStr}
              group={group}
              progressEvents={progressEvents}
              onLogProgress={onLogProgress}
            />
          ))}

          {/* Infinite scroll loader - only show if there are more days to load */}
          {hasMoreDays ? (
            <div ref={loadMoreRef} className="p-4 flex justify-center">
              {isLoading && (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              )}
            </div>
          ) : (
            <div className="p-4 flex justify-center">
              <span className="text-sm text-muted-foreground">
                Nothing more to show
              </span>
            </div>
          )}
        </>
      )}

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
