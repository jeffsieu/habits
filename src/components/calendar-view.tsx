"use client";

import { useState, useMemo } from "react";
import {
  getCalendarGrid,
  normalizeDate,
  isToday,
  getHabitsForDate,
  isHabitCompleteOnDate,
  addDays,
} from "@/lib/habit-utils";
import { Habit, HabitProgressEvent } from "@/types/habit";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  habits: Habit[];
  progressEvents: HabitProgressEvent[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function CalendarView({
  habits,
  progressEvents,
  selectedDate,
  onDateSelect,
}: CalendarViewProps) {
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const dates = getCalendarGrid(year, month);

  const monthName = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const goToPrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    onDateSelect(today);
  };

  // Pre-compute streak info for all dates
  const streakInfo = useMemo(() => {
    const info: Record<
      string,
      { isComplete: boolean; prevComplete: boolean; nextComplete: boolean }
    > = {};
    dates.forEach((date) => {
      const dateStr = normalizeDate(date);
      const scheduledHabits = getHabitsForDate(habits, date);
      const completedCount = scheduledHabits.filter((h) =>
        isHabitCompleteOnDate(h, progressEvents, dateStr),
      ).length;
      const isComplete =
        scheduledHabits.length > 0 && completedCount === scheduledHabits.length;

      // Check previous day
      const prevDate = addDays(date, -1);
      const prevDateStr = normalizeDate(prevDate);
      const prevScheduled = getHabitsForDate(habits, prevDate);
      const prevCompleted = prevScheduled.filter((h) =>
        isHabitCompleteOnDate(h, progressEvents, prevDateStr),
      ).length;
      const prevComplete =
        prevScheduled.length > 0 && prevCompleted === prevScheduled.length;

      // Check next day
      const nextDate = addDays(date, 1);
      const nextDateStr = normalizeDate(nextDate);
      const nextScheduled = getHabitsForDate(habits, nextDate);
      const nextCompleted = nextScheduled.filter((h) =>
        isHabitCompleteOnDate(h, progressEvents, nextDateStr),
      ).length;
      const nextComplete =
        nextScheduled.length > 0 && nextCompleted === nextScheduled.length;

      info[dateStr] = { isComplete, prevComplete, nextComplete };
    });
    return info;
  }, [dates, habits, progressEvents]);

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          {monthName}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-primary hover:text-primary rounded-lg font-medium text-xs h-7 px-2"
          >
            Today
          </Button>
          <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevMonth}
              className="h-7 w-7 rounded-md hover:bg-card"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-7 w-7 rounded-md hover:bg-card"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {dates.map((date, index) => {
          const dateStr = normalizeDate(date);
          const isCurrentMonth = date.getMonth() === month;
          const isSelected = dateStr === normalizeDate(selectedDate);
          const isTodayDate = isToday(date);
          const scheduledHabits = getHabitsForDate(habits, date);
          const completedCount = scheduledHabits.filter((h) =>
            isHabitCompleteOnDate(h, progressEvents, dateStr),
          ).length;
          const totalCount = scheduledHabits.length;

          const streak = streakInfo[dateStr];
          const dayOfWeek = date.getDay();

          return (
            <DayCell
              key={index}
              date={date}
              isCurrentMonth={isCurrentMonth}
              isSelected={isSelected}
              isToday={isTodayDate}
              totalHabits={totalCount}
              completedHabits={completedCount}
              isStreakStart={streak?.isComplete && !streak?.prevComplete}
              isStreakEnd={streak?.isComplete && !streak?.nextComplete}
              isStreakComplete={streak?.isComplete ?? false}
              isFirstDayOfWeek={dayOfWeek === 0}
              isLastDayOfWeek={dayOfWeek === 6}
              onClick={() => onDateSelect(date)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  totalHabits: number;
  completedHabits: number;
  isStreakStart: boolean;
  isStreakEnd: boolean;
  isStreakComplete: boolean;
  isFirstDayOfWeek: boolean;
  isLastDayOfWeek: boolean;
  onClick: () => void;
}

function DayCell({
  date,
  isCurrentMonth,
  isSelected,
  isToday,
  totalHabits,
  completedHabits,
  isStreakStart,
  isStreakEnd,
  isStreakComplete,
  isFirstDayOfWeek,
  isLastDayOfWeek,
  onClick,
}: DayCellProps) {
  const hasHabits = totalHabits > 0;
  const completionRatio = hasHabits ? completedHabits / totalHabits : 0;

  // Determine streak connector styling
  const showStreakBg = isStreakComplete && isCurrentMonth;
  const streakRoundedLeft = isStreakStart || isFirstDayOfWeek;
  const streakRoundedRight = isStreakEnd || isLastDayOfWeek;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center transition-all duration-150",
        "py-2.5 lg:py-3",
        "hover:bg-muted/50",
        !isCurrentMonth && "opacity-30",
      )}
    >
      {/* Streak background connector */}
      {showStreakBg && (
        <div
          className={cn(
            "absolute inset-y-1 inset-x-0 bg-success/15",
            streakRoundedLeft && "rounded-l-full ml-1",
            streakRoundedRight && "rounded-r-full mr-1",
          )}
        />
      )}

      {/* Day number with selection/today ring */}
      <div
        className={cn(
          "relative z-10 w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-full transition-all",
          isSelected && "bg-primary shadow-sm",
          isToday && !isSelected && "ring-2 ring-primary/40",
        )}
      >
        <span
          className={cn(
            "text-sm lg:text-base font-medium transition-colors",
            isSelected ? "text-primary-foreground" : "text-foreground",
            !isCurrentMonth && "text-muted-foreground",
          )}
        >
          {date.getDate()}
        </span>
      </div>

      {/* Progress indicator dots */}
      {hasHabits && !isStreakComplete && (
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
          {totalHabits <= 3 ? (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: totalHabits }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 h-1 rounded-full transition-colors",
                    i < completedHabits
                      ? "bg-success"
                      : "bg-muted-foreground/20",
                  )}
                />
              ))}
            </div>
          ) : (
            <div className="w-4 h-1 rounded-full overflow-hidden bg-muted-foreground/20">
              <div
                className="h-full rounded-full bg-success transition-all duration-300"
                style={{ width: `${completionRatio * 100}%` }}
              />
            </div>
          )}
        </div>
      )}
    </button>
  );
}
