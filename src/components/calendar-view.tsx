"use client";

import { useState } from "react";
import {
  getCalendarGrid,
  normalizeDate,
  isToday,
  getHabitsForDate,
  isHabitCompleteOnDate,
} from "@/lib/habit-utils";
import { Habit, HabitProgressEvent } from "@/types/habit";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
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
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {dates.map((date, index) => {
          const isCurrentMonth = date.getMonth() === month;
          const isSelected =
            normalizeDate(date) === normalizeDate(selectedDate);
          const isTodayDate = isToday(date);
          const scheduledHabits = getHabitsForDate(habits, date);
          const completedCount = scheduledHabits.filter((h) =>
            isHabitCompleteOnDate(h, progressEvents, normalizeDate(date)),
          ).length;
          const totalCount = scheduledHabits.length;

          return (
            <DayCell
              key={index}
              date={date}
              isCurrentMonth={isCurrentMonth}
              isSelected={isSelected}
              isToday={isTodayDate}
              totalHabits={totalCount}
              completedHabits={completedCount}
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
  onClick: () => void;
}

function DayCell({
  date,
  isCurrentMonth,
  isSelected,
  isToday,
  totalHabits,
  completedHabits,
  onClick,
}: DayCellProps) {
  const hasHabits = totalHabits > 0;
  const completionRatio = hasHabits ? completedHabits / totalHabits : 0;
  const allComplete = completionRatio === 1;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center rounded-lg transition-all duration-150",
        "aspect-square",
        "hover:bg-muted",
        !isCurrentMonth && "opacity-30",
        isSelected && "bg-primary shadow-sm",
        isToday && !isSelected && "ring-1 ring-primary/40 bg-primary/5",
      )}
    >
      {/* Day number */}
      <span
        className={cn(
          "text-xs font-medium transition-colors",
          isSelected ? "text-primary-foreground" : "text-foreground",
          !isCurrentMonth && "text-muted-foreground",
        )}
      >
        {date.getDate()}
      </span>

      {/* Progress indicator */}
      {hasHabits && (
        <div
          className={cn(
            "absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5",
            "transition-transform duration-200",
            isSelected && "scale-110",
          )}
        >
          {/* Progress dots */}
          {totalHabits <= 4 ? (
            // Show individual dots for 4 or fewer habits
            <div className="flex items-center gap-0.5">
              {Array.from({ length: totalHabits }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    i < completedHabits
                      ? isSelected
                        ? "bg-primary-foreground"
                        : "bg-success"
                      : isSelected
                        ? "bg-primary-foreground/30"
                        : "bg-muted-foreground/20",
                  )}
                />
              ))}
            </div>
          ) : (
            // Show progress bar for more habits
            <div
              className={cn(
                "w-6 h-1.5 rounded-full overflow-hidden",
                isSelected
                  ? "bg-primary-foreground/30"
                  : "bg-muted-foreground/20",
              )}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isSelected ? "bg-primary-foreground" : "bg-success",
                )}
                style={{ width: `${completionRatio * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* All complete celebration indicator */}
      {allComplete && isCurrentMonth && (
        <div
          className={cn(
            "absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center",
            isSelected
              ? "bg-primary-foreground text-primary"
              : "bg-success text-success-foreground",
          )}
        >
          <Check className="w-2 h-2" />
        </div>
      )}
    </button>
  );
}
