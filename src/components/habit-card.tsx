"use client";

import {
  Habit,
  HabitProgressEvent,
  HabitTag,
  CompletionType,
  RepeatType,
} from "@/types/habit";
import {
  isHabitCompleteOnDate,
  getProgressValueOnDate,
  getDisplayProgressValue,
  calculateCurrentStreak,
  isStreakSecure,
} from "@/lib/habit-utils";
import { HabitIconDisplay } from "@/lib/habit-icons";
import {
  Check,
  Minus,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HabitCardProps {
  habit: Habit;
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  date: string;
  onLogProgress: (habitId: string, value: number) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

export function HabitCard({
  habit,
  tags,
  progressEvents,
  date,
  onLogProgress,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const isComplete = isHabitCompleteOnDate(habit, progressEvents, date);
  const displayValue = getDisplayProgressValue(habit, progressEvents, date);
  const todayValue = getProgressValueOnDate(progressEvents, habit.id, date);
  const streak = calculateCurrentStreak(habit, progressEvents);
  const habitTags = tags.filter((t) => habit.tagIds.includes(t.id));

  const isIntervalHabit =
    habit.repeatType === RepeatType.WEEKLY ||
    habit.repeatType === RepeatType.MONTHLY;

  const handleQuickComplete = () => {
    if (habit.completionType === CompletionType.YES_NO) {
      onLogProgress(habit.id, todayValue >= 1 ? 0 : 1);
    } else {
      onLogProgress(habit.id, todayValue + 1);
    }
  };

  const handleIncrement = () => {
    onLogProgress(habit.id, todayValue + 1);
  };

  const handleDecrement = () => {
    if (todayValue > 0) {
      onLogProgress(habit.id, todayValue - 1);
    }
  };

  // Calculate progress percentage for visual indicator
  const progressPercent = habit.targetOccurrences
    ? Math.min((displayValue / habit.targetOccurrences) * 100, 100)
    : isComplete
      ? 100
      : 0;

  return (
    <div
      className={cn(
        "group relative rounded-lg border transition-all duration-200",
        "bg-card hover:shadow-sm",
        isComplete
          ? "border-success/30 bg-linear-to-r from-success/5 to-transparent"
          : "border-border hover:border-border/80",
      )}
    >
      {/* Progress bar background */}
      {habit.completionType === CompletionType.X_OCCURRENCES && (
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out",
              isComplete ? "bg-success/10" : "bg-primary/5",
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="relative px-3 py-2.5 flex items-center gap-3">
        {/* Completion button */}
        {habit.completionType === CompletionType.YES_NO ? (
          <button
            onClick={handleQuickComplete}
            className={cn(
              "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200",
              "border",
              isComplete
                ? "bg-success border-success text-success-foreground"
                : "border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground",
            )}
          >
            <Check
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isComplete && "scale-110",
              )}
            />
          </button>
        ) : (
          <div className="shrink-0 flex items-center gap-0.5">
            <button
              onClick={handleDecrement}
              disabled={todayValue === 0}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                "border border-border hover:border-primary/50 hover:bg-primary/5",
                "disabled:opacity-30 disabled:pointer-events-none",
              )}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleIncrement}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                "border border-border hover:border-primary/50 hover:bg-primary/5",
              )}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 flex items-start gap-2.5">
              {/* Habit icon */}
              <div 
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: habit.color ? `${habit.color}15` : undefined,
                  color: habit.color || undefined 
                }}
              >
                <HabitIconDisplay iconName={habit.icon} className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Name and type badge */}
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-foreground truncate">
                    {habit.name}
                  </h3>
                  {!habit.isGoodHabit && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-md bg-destructive/10 text-destructive">
                      Limit
                    </span>
                  )}
                </div>

                {/* Tags */}
                {habitTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {habitTags.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground"
                        style={
                        tag.color
                          ? {
                              backgroundColor: `${tag.color}15`,
                              color: tag.color,
                            }
                          : {}
                      }
                    >
                      {tag.name}
                    </span>
                  ))}
                  {habitTags.length > 2 && (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
                      +{habitTags.length - 2}
                    </span>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* Progress display */}
            <div className="flex items-center gap-3">
              {habit.completionType === CompletionType.X_OCCURRENCES && (
                <div className="text-right">
                  <div className="flex items-baseline gap-0.5">
                    <span
                      className={cn(
                        "text-xl font-display font-semibold",
                        isComplete ? "text-success" : "text-foreground",
                      )}
                    >
                      {displayValue}
                    </span>
                    {habit.targetOccurrences && (
                      <span className="text-sm text-muted-foreground">
                        /{habit.targetOccurrences}
                      </span>
                    )}
                  </div>
                  {isIntervalHabit && todayValue > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      +{todayValue} today
                    </p>
                  )}
                </div>
              )}

              {/* Streak */}
              {streak > 0 && (
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg",
                  isStreakSecure(habit, progressEvents)
                    ? "bg-warning/10 text-warning"
                    : "bg-muted text-muted-foreground"
                )}>
                  <Flame className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{streak}</span>
                </div>
              )}

              {/* Options menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      "opacity-0 group-hover:opacity-100",
                      "hover:bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onEdit(habit)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(habit.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
