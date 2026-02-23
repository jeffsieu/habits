"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Habit, HabitProgressEvent, HabitTag, RepeatType, CompletionType } from "@/types/habit";
import {
  normalizeDate,
  isHabitScheduledForDate,
  isHabitCompleteOnDate,
  calculateCurrentStreak,
  getProgressValueOnDate,
  addDays,
  getProgressValueForInterval,
  isStreakSecure,
} from "@/lib/habit-utils";
import { HabitIconDisplay } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";
import { Plus, Minus, Flame, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface HabitGridViewProps {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  onLogProgress: (habitId: string, date: string, value: number) => void;
  onAddHabit: () => void;
  onReorderHabits: (habitIds: string[]) => void;
}

const DAYS_TO_SHOW = 14;
const DAY_ABBREVS = ["S", "M", "T", "W", "T", "F", "S"];

function getDateColumns(today: Date): Date[] {
  const dates: Date[] = [];
  for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
    dates.push(addDays(today, -i));
  }
  return dates;
}

function formatColumnHeader(date: Date): { day: string; date: number } {
  return {
    day: DAY_ABBREVS[date.getDay()],
    date: date.getDate(),
  };
}

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
  );
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

interface SortableHabitRowProps {
  habit: Habit;
  dateColumns: Date[];
  todayStr: string;
  progressEvents: HabitProgressEvent[];
  onCellClick: (habit: Habit, date: Date) => void;
  onLogProgress: (habitId: string, date: string, value: number) => void;
  getStreakDisplay: (habit: Habit) => string;
  getIsStreakSecure: (habit: Habit) => boolean;
  getCurrentPeriodInfo: (
    habit: Habit,
  ) => { label: string; progress: string } | null;
}

function SortableHabitRow({
  habit,
  dateColumns,
  todayStr,
  progressEvents,
  onCellClick,
  onLogProgress,
  getStreakDisplay,
  getIsStreakSecure,
  getCurrentPeriodInfo,
}: SortableHabitRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const streak = getStreakDisplay(habit);
  const streakSecure = getIsStreakSecure(habit);
  const periodInfo = getCurrentPeriodInfo(habit);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-border/50 hover:bg-muted/20 transition-colors group",
        isDragging && "opacity-50 bg-muted/30",
      )}
    >
      {/* Habit name cell */}
      <td className="sticky left-0 z-10 bg-card group-hover:bg-muted/20 transition-colors">
        <div className="flex items-center gap-2 px-2 py-2">
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{
              backgroundColor: habit.color
                ? `${habit.color}20`
                : "var(--muted)",
              color: habit.color || "var(--muted-foreground)",
            }}
          >
            <HabitIconDisplay iconName={habit.icon} className="w-4 h-4" />
          </div>
          <Link
            href={`/habits/${habit.id}`}
            className="text-sm font-medium text-foreground truncate max-w-35 hover:underline hover:decoration-dotted hover:decoration-foreground/50 underline-offset-2"
          >
            {habit.name}
          </Link>
        </div>
      </td>

      {/* Date cells */}
      {dateColumns.map((date, idx) => {
        const dateStr = normalizeDate(date);
        const isScheduled = isHabitScheduledForDate(habit, date);
        const isComplete = isHabitCompleteOnDate(
          habit,
          progressEvents,
          dateStr,
        );
        const currentValue = getProgressValueOnDate(progressEvents, habit.id, dateStr);
        const isToday = dateStr === todayStr;
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isOccurrenceBased = habit.completionType === CompletionType.X_OCCURRENCES;

        return (
          <td key={idx} className={cn("p-0.5", isWeekend && "bg-muted/30")}>
            {isOccurrenceBased ? (
              // Occurrence-based: show count with +/- buttons on hover
              <div
                className={cn(
                  "group relative w-full aspect-square rounded-sm transition-all duration-150 flex items-center justify-center",
                  !isScheduled
                    ? "habit-cell-striped cursor-not-allowed"
                    : isComplete
                      ? "bg-primary"
                      : isToday
                        ? "bg-muted/80 border border-primary/30"
                        : "bg-muted/50",
                )}
              >
                {/* Count display - centered */}
                {isScheduled && currentValue > 0 && (
                  <span className={cn(
                    "text-[10px] font-semibold leading-none z-10",
                    isComplete ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {currentValue}
                  </span>
                )}
                
                {/* Buttons overlay - visible on hover */}
                {isScheduled && (
                  <div className="absolute inset-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Minus button - left */}
                    <button
                      onClick={() => onLogProgress(habit.id, dateStr, Math.max(0, currentValue - 1))}
                      disabled={currentValue <= 0}
                      className={cn(
                        "flex-1 flex items-center justify-center rounded-l-sm transition-colors",
                        currentValue > 0
                          ? isComplete
                            ? "hover:bg-black/20 text-primary-foreground"
                            : "hover:bg-primary/30 text-foreground"
                          : "text-muted-foreground/50 cursor-not-allowed",
                      )}
                      title="Decrease count"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    {/* Plus button - right */}
                    <button
                      onClick={() => onLogProgress(habit.id, dateStr, currentValue + 1)}
                      className={cn(
                        "flex-1 flex items-center justify-center rounded-r-sm transition-colors",
                        isComplete
                          ? "hover:bg-black/20 text-primary-foreground"
                          : "hover:bg-primary/30 text-foreground",
                      )}
                      title="Increase count"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Yes/No: show toggle button
              <button
                onClick={() => isScheduled && onCellClick(habit, date)}
                disabled={!isScheduled}
                className={cn(
                  "w-full aspect-square rounded-sm transition-all duration-150",
                  isScheduled
                    ? isComplete
                      ? "bg-primary hover:bg-primary/90"
                      : isToday
                        ? "bg-muted/80 hover:bg-primary/30 border border-primary/30"
                        : "bg-muted/50 hover:bg-muted"
                    : "habit-cell-striped cursor-not-allowed",
                )}
                title={
                  isScheduled
                    ? isComplete
                      ? "Completed - click to undo"
                      : "Click to complete"
                    : "Not scheduled"
                }
              />
            )}
          </td>
        );
      })}

      {/* Current period cell */}
      <td className="px-1 py-1 bg-primary/5 border-l border-border">
        {periodInfo ? (
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-semibold text-primary">
              {periodInfo.label}
            </span>
            <span className="text-[9px] text-muted-foreground">
              {periodInfo.progress}
            </span>
          </div>
        ) : (
          <div className="w-full h-6" />
        )}
      </td>

      {/* Streak cell */}
      <td className="px-3 py-2 text-right">
        <div className={cn(
          "flex items-center justify-end gap-1",
          streakSecure ? "text-warning" : "text-muted-foreground"
        )}>
          <Flame className="w-3.5 h-3.5" />
          <span className="text-sm font-semibold tabular-nums">
            {streak}
          </span>
        </div>
      </td>
    </tr>
  );
}

export function HabitGridView({
  habits,
  progressEvents,
  onLogProgress,
  onAddHabit,
  onReorderHabits,
}: HabitGridViewProps) {
  const today = useMemo(() => new Date(), []);
  const todayStr = normalizeDate(today);
  const dateColumns = useMemo(() => getDateColumns(today), [today]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleCellClick = (habit: Habit, date: Date) => {
    const dateStr = normalizeDate(date);
    const currentValue = getProgressValueOnDate(
      progressEvents,
      habit.id,
      dateStr,
    );

    if (currentValue > 0) {
      onLogProgress(habit.id, dateStr, 0);
    } else {
      onLogProgress(habit.id, dateStr, 1);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = habits.findIndex((h) => h.id === active.id);
      const newIndex = habits.findIndex((h) => h.id === over.id);
      const reordered = arrayMove(habits, oldIndex, newIndex);
      onReorderHabits(reordered.map((h) => h.id));
    }
  };

  const getStreakDisplay = (habit: Habit) => {
    const streak = calculateCurrentStreak(habit, progressEvents);
    if (habit.repeatType === RepeatType.WEEKLY) {
      return `${streak}w`;
    } else if (habit.repeatType === RepeatType.MONTHLY) {
      return `${streak}m`;
    }
    return streak.toString();
  };

  const getIsStreakSecure = (habit: Habit) => {
    return isStreakSecure(habit, progressEvents);
  };

  const getCurrentPeriodInfo = (habit: Habit) => {
    if (habit.repeatType === RepeatType.WEEKLY) {
      const weekNum = getWeekNumber(today);
      const value = getProgressValueForInterval(habit, progressEvents, today);
      const target = habit.targetOccurrences ?? 1;
      return {
        label: `W${weekNum}`,
        progress: `${value} / ${target}`,
      };
    } else if (habit.repeatType === RepeatType.MONTHLY) {
      const value = getProgressValueForInterval(habit, progressEvents, today);
      const target = habit.targetOccurrences ?? 1;
      const monthName = today.toLocaleString("default", { month: "short" });
      return {
        label: monthName,
        progress: `${value} / ${target}`,
      };
    }
    return null;
  };

  return (
    <div className="w-full overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full border-collapse min-w-200">
          {/* Header row */}
          <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left min-w-50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  All Habits
                </span>
              </div>
            </th>

            {dateColumns.map((date, idx) => {
              const { day, date: dateNum } = formatColumnHeader(date);
              const isToday = normalizeDate(date) === todayStr;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <th
                  key={idx}
                  className={cn(
                    "px-1 py-2 text-center min-w-11 w-11",
                    isWeekend && "bg-muted/30",
                  )}
                >
                  <div
                    className={cn(
                      "flex flex-col items-center gap-0.5",
                      isToday && "relative",
                    )}
                  >
                    {isToday && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase",
                        isToday ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {isToday ? "Today" : `${day} ${dateNum}`}
                    </span>
                  </div>
                </th>
              );
            })}

            {/* Current period column */}
            <th className="px-2 py-2 text-center min-w-15 bg-primary/5 border-l border-border">
              <span className="text-[10px] font-medium text-primary">
                Period
              </span>
            </th>

            {/* Streak column */}
            <th className="px-3 py-2 text-right min-w-12">
              <Flame className="w-3.5 h-3.5 text-muted-foreground inline" />
            </th>
          </tr>
        </thead>

        <SortableContext
          items={habits.map((h) => h.id)}
          strategy={verticalListSortingStrategy}
        >
          <tbody>
            {habits.map((habit) => (
              <SortableHabitRow
                key={habit.id}
                habit={habit}
                dateColumns={dateColumns}
                todayStr={todayStr}
                progressEvents={progressEvents}
                onCellClick={handleCellClick}
                onLogProgress={onLogProgress}
                getStreakDisplay={getStreakDisplay}
                getIsStreakSecure={getIsStreakSecure}
                getCurrentPeriodInfo={getCurrentPeriodInfo}
              />
            ))}

            {/* Add habit row */}
            <tr>
              <td colSpan={dateColumns.length + 3} className="py-2">
                <button
                  onClick={onAddHabit}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add habit
                </button>
              </td>
            </tr>
          </tbody>
        </SortableContext>
      </table>
    </DndContext>
    </div>
  );
}
