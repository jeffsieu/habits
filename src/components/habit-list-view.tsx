"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Habit,
  HabitProgressEvent,
  HabitTag,
  RecordingType,
} from "@/types/habit";
import {
  normalizeDate,
  isHabitScheduledForDate,
  getProgressValueOnDate,
} from "@/lib/habit-utils";
import { HabitIconDisplay } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Edit3 } from "lucide-react";
import { ValueInputDialog } from "@/components/value-input-dialog";
import { HorizontalDatePicker } from "@/components/horizontal-date-picker";

interface HabitListViewProps {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  onLogProgress: (habitId: string, date: string, value: number) => void;
  onAddHabit: () => void;
}

export function HabitListView({
  habits,
  progressEvents,
  onLogProgress,
  onAddHabit,
}: HabitListViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateStr = useMemo(() => normalizeDate(selectedDate), [selectedDate]);

  // Get habits scheduled for selected date
  const scheduledHabits = useMemo(() => {
    const filtered = habits.filter((habit) =>
      isHabitScheduledForDate(habit, selectedDate),
    );

    // Sort habits: incomplete first, completed at bottom
    // Within each group, maintain custom order (order field)
    return filtered.sort((a, b) => {
      const aProgress = getProgressValueOnDate(progressEvents, a.id, dateStr);
      const bProgress = getProgressValueOnDate(progressEvents, b.id, dateStr);
      const aCompleted = aProgress > 0;
      const bCompleted = bProgress > 0;

      // Primary sort: completion status
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
      }

      // Secondary sort: custom order (lower order numbers come first)
      return a.order - b.order;
    });
  }, [habits, selectedDate, progressEvents, dateStr]);

  if (habits.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <HorizontalDatePicker
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <p className="text-muted-foreground text-center mb-4">
            No habits yet. Create your first habit to get started!
          </p>
          <Button onClick={onAddHabit}>
            <Plus className="w-4 h-4 mr-2" />
            Add Habit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Horizontal Date Picker */}
      <HorizontalDatePicker
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      {/* Habits List */}
      <div className="flex-1 overflow-y-auto">
        {scheduledHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <p className="text-muted-foreground text-center">
              No habits scheduled for this day.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {scheduledHabits.map((habit, index) => (
              <div
                key={`${habit.id}-${dateStr}`}
                className="opacity-0 animate-slide-up"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "both",
                }}
              >
                <HabitListItem
                  habit={habit}
                  dateStr={dateStr}
                  progressEvents={progressEvents}
                  onLogProgress={onLogProgress}
                />
              </div>
            ))}
          </div>
        )}

        {/* Add Habit Button */}
        <div className="p-4">
          <Button variant="outline" className="w-full" onClick={onAddHabit}>
            <Plus className="w-4 h-4 mr-2" />
            Add Habit
          </Button>
        </div>
      </div>
    </div>
  );
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
  const [valueDialogOpen, setValueDialogOpen] = useState(false);

  const currentValue = getProgressValueOnDate(
    progressEvents,
    habit.id,
    dateStr,
  );
  const isYesNo = habit.recordingType === RecordingType.YES_NO;
  const isCount = habit.recordingType === RecordingType.COUNT;
  const isValue = habit.recordingType === RecordingType.VALUE;
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

  const handleValueSubmit = (value: number, mode: "replace" | "add") => {
    if (mode === "replace") {
      onLogProgress(habit.id, dateStr, value);
    } else {
      onLogProgress(habit.id, dateStr, currentValue + value);
    }
  };

  return (
    <Link
      href={`/habits/${habit.id}`}
      className={cn(
        "flex items-center justify-between px-4 py-3 bg-card",
        "hover:bg-accent/50 active:bg-accent/70 transition-colors",
      )}
    >
      {/* Left side: Icon + Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: habit.color
              ? `${habit.color}15`
              : "hsl(var(--muted))",
            color: habit.color || undefined,
          }}
        >
          <HabitIconDisplay iconName={habit.icon} className="w-4 h-4" />
        </div>
        <span className="font-medium truncate">{habit.name}</span>
      </div>

      {/* Right side: Controls */}
      <div className="shrink-0 ml-3" onClick={(e) => e.preventDefault()}>
        {isYesNo && (
          <Checkbox
            checked={isComplete}
            onCheckedChange={handleCheckboxChange}
            className="w-6 h-6"
          />
        )}
        {isCount && (
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
        {isValue && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setValueDialogOpen(true)}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span className="tabular-nums">
                {currentValue > 0
                  ? currentValue.toFixed(1).replace(/\.0$/, "")
                  : "Log"}
              </span>
            </Button>
            <ValueInputDialog
              open={valueDialogOpen}
              onOpenChange={setValueDialogOpen}
              habitName={habit.name}
              currentValue={currentValue}
              habitColor={habit.color}
              onSubmit={handleValueSubmit}
            />
          </>
        )}
      </div>
    </Link>
  );
}
