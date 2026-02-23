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
  calculateCurrentStreak,
  getProgressValueOnDate,
  addDays,
  isStreakSecure,
} from "@/lib/habit-utils";
import { HabitIconDisplay } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";
import { Plus, Minus, Flame, GripVertical, Check } from "lucide-react";
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

interface SortableHabitRowProps {
  habit: Habit;
  dateColumns: Date[];
  todayStr: string;
  progressEvents: HabitProgressEvent[];
  onCellClick: (habit: Habit, date: Date) => void;
  onLogProgress: (habitId: string, date: string, value: number) => void;
  getStreakDisplay: (habit: Habit) => string;
  getIsStreakSecure: (habit: Habit) => boolean;
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
        const currentValue = getProgressValueOnDate(
          progressEvents,
          habit.id,
          dateStr,
        );
        // Any non-zero progress counts as "completed" for visual styling
        const hasProgress = currentValue > 0;
        const isToday = dateStr === todayStr;
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isOccurrenceBased =
          habit.completionType === CompletionType.X_OCCURRENCES;

        return (
          <td
            key={idx}
            className={cn(
              "p-0.5",
              isWeekend && "bg-muted/30",
              isToday && "px-1",
            )}
          >
            {isOccurrenceBased ? (
              // Occurrence-based: show count with +/- buttons on hover
              <div
                className={cn(
                  "group relative w-full rounded-sm transition-all duration-150 flex items-center justify-center",
                  isToday ? "aspect-2/1" : "aspect-square",
                  !isScheduled
                    ? "habit-cell-striped cursor-not-allowed"
                    : hasProgress
                      ? isToday
                        ? "bg-primary"
                        : "bg-muted-foreground/60"
                      : isToday
                        ? "bg-muted/80 border border-primary/30"
                        : "bg-muted/50",
                )}
              >
                {/* Count display - centered */}
                {isScheduled && currentValue > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-semibold leading-none z-10",
                      hasProgress
                        ? isToday
                          ? "text-primary-foreground"
                          : "text-background"
                        : "text-foreground",
                    )}
                  >
                    {currentValue}
                  </span>
                )}

                {/* Buttons overlay - visible on hover */}
                {isScheduled && (
                  <div className="absolute inset-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Minus button - left */}
                    <button
                      onClick={() =>
                        onLogProgress(
                          habit.id,
                          dateStr,
                          Math.max(0, currentValue - 1),
                        )
                      }
                      disabled={currentValue <= 0}
                      className={cn(
                        "flex-1 flex items-center justify-center rounded-l-sm transition-colors",
                        currentValue > 0
                          ? hasProgress
                            ? isToday
                              ? "hover:bg-black/20 text-primary-foreground"
                              : "hover:bg-black/20 text-background"
                            : "hover:bg-primary/30 text-foreground"
                          : "text-muted-foreground/50 cursor-not-allowed",
                      )}
                      title="Decrease count"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    {/* Plus button - right */}
                    <button
                      onClick={() =>
                        onLogProgress(habit.id, dateStr, currentValue + 1)
                      }
                      className={cn(
                        "flex-1 flex items-center justify-center rounded-r-sm transition-colors",
                        hasProgress
                          ? isToday
                            ? "hover:bg-black/20 text-primary-foreground"
                            : "hover:bg-black/20 text-background"
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
              // Yes/No: show toggle button with checkmark when complete
              <button
                onClick={() => isScheduled && onCellClick(habit, date)}
                disabled={!isScheduled}
                className={cn(
                  "w-full rounded-sm transition-all duration-150 flex items-center justify-center",
                  isToday ? "aspect-2/1" : "aspect-square",
                  isScheduled
                    ? hasProgress
                      ? isToday
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-muted-foreground/60 hover:bg-muted-foreground/70"
                      : isToday
                        ? "bg-muted/80 hover:bg-primary/30 border border-primary/30"
                        : "bg-muted/50 hover:bg-muted"
                    : "habit-cell-striped cursor-not-allowed",
                )}
                title={
                  isScheduled
                    ? hasProgress
                      ? "Completed - click to undo"
                      : "Click to complete"
                    : "Not scheduled"
                }
              >
                {isScheduled && hasProgress && (
                  <Check
                    className={cn(
                      "w-3 h-3",
                      isToday ? "text-primary-foreground" : "text-background",
                    )}
                    strokeWidth={3}
                  />
                )}
              </button>
            )}
          </td>
        );
      })}

      {/* Streak cell */}
      <td className="px-3 py-2 text-right">
        <div
          className={cn(
            "flex items-center justify-end gap-1",
            streakSecure ? "text-warning" : "text-muted-foreground",
          )}
        >
          <Flame className="w-3.5 h-3.5" />
          <span className="text-sm font-semibold tabular-nums">{streak}</span>
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

  // Sort habits: incomplete first, completed at bottom
  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => {
      const aProgress = getProgressValueOnDate(progressEvents, a.id, todayStr);
      const bProgress = getProgressValueOnDate(progressEvents, b.id, todayStr);
      const aCompleted = aProgress > 0;
      const bCompleted = bProgress > 0;
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1;
    });
  }, [habits, progressEvents, todayStr]);

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
    return streak.toString();
  };

  const getIsStreakSecure = (habit: Habit) => {
    return isStreakSecure(habit, progressEvents);
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
                      "px-1 py-2 text-center",
                      isToday ? "min-w-20 w-20" : "min-w-11 w-11",
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

              {/* Streak column */}
              <th className="px-3 py-2 text-right min-w-12">
                <Flame className="w-3.5 h-3.5 text-muted-foreground inline" />
              </th>
            </tr>
          </thead>

          <SortableContext
            items={sortedHabits.map((h) => h.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {sortedHabits.map((habit) => (
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
                />
              ))}

              {/* Add habit row */}
              <tr>
                <td colSpan={dateColumns.length + 2} className="py-2">
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
