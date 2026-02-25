import { Habit, HabitProgressEvent, GoalInterval } from "@/types/habit";

/**
 * Parse a normalized date string to Date object (at midnight local time)
 */
export function parseDate(dateStr: string): Date {
  // Handle ISO format strings like "2026-02-23" or "2026-02-23T00:00:00.000Z"
  const datePart = dateStr.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Normalize a date to YYYY-MM-DD string format (date only, no time)
 * Uses local timezone to match user's perspective
 */
export function normalizeDate(date: Date | string): string {
  // For strings, parse using parseDate to ensure local time interpretation
  const d = typeof date === "string" ? parseDate(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get the start of day for a date
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get difference in days between two dates
 */
export function daysBetween(
  date1: Date | string,
  date2: Date | string,
): number {
  const d1 = typeof date1 === "string" ? parseDate(date1) : startOfDay(date1);
  const d2 = typeof date2 === "string" ? parseDate(date2) : startOfDay(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get the start of the week containing the given date
 * @param date The date to get the week start for
 * @param weekStartDay The day the week starts on (0=Sunday, 1=Monday, etc.)
 */
export function getWeekStart(
  date: Date | string,
  weekStartDay: number = 1,
): Date {
  const d = typeof date === "string" ? parseDate(date) : new Date(date);
  const currentDay = d.getDay();
  const diff = (currentDay - weekStartDay + 7) % 7;
  return addDays(d, -diff);
}

/**
 * Get the end of the week containing the given date
 * @param date The date to get the week end for
 * @param weekStartDay The day the week starts on (0=Sunday, 1=Monday, etc.)
 */
export function getWeekEnd(
  date: Date | string,
  weekStartDay: number = 1,
): Date {
  const weekStart = getWeekStart(date, weekStartDay);
  return addDays(weekStart, 6);
}

/**
 * Get the start of the month containing the given date
 */
export function getMonthStart(date: Date | string): Date {
  const d = typeof date === "string" ? parseDate(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Get the end of the month containing the given date
 */
export function getMonthEnd(date: Date | string): Date {
  const d = typeof date === "string" ? parseDate(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Get the interval boundaries for a habit on a given date
 * Returns the start and end dates of the current tracking period
 */
export function getHabitIntervalBounds(
  habit: Habit,
  date: Date | string,
): { start: Date; end: Date } {
  const d = typeof date === "string" ? parseDate(date) : date;

  switch (habit.goalInterval) {
    case GoalInterval.WEEKLY:
      // Default to Monday as week start
      return {
        start: getWeekStart(d, 1),
        end: getWeekEnd(d, 1),
      };

    case GoalInterval.MONTHLY:
      return {
        start: getMonthStart(d),
        end: getMonthEnd(d),
      };

    case GoalInterval.DAILY:
    case GoalInterval.CUSTOM:
    default:
      // For daily and custom, the interval is just the single day
      return {
        start: d,
        end: d,
      };
  }
}

/**
 * Check if a habit is scheduled for a specific date based on its scheduling rules
 * Uses scheduledDaysOfWeek if set, otherwise shows every day
 */
export function isHabitScheduledForDate(
  habit: Habit,
  date: Date | string,
): boolean {
  const checkDate = typeof date === "string" ? parseDate(date) : date;
  const startDate = parseDate(habit.startDate.split("T")[0]);

  // Don't show habits before their start date
  if (checkDate < startDate) {
    return false;
  }

  // Check end condition if applicable
  if (habit.endConditionType === "DATE" && habit.endConditionValue) {
    const endDate = parseDate(habit.endConditionValue);
    if (checkDate > endDate) {
      return false;
    }
  }

  // Check scheduled days of week if specified
  if (habit.scheduledDaysOfWeek && habit.scheduledDaysOfWeek.length > 0) {
    const checkDateDay = checkDate.getDay(); // 0-6 (Sunday-Saturday)
    if (!habit.scheduledDaysOfWeek.includes(checkDateDay)) {
      return false;
    }
  }

  // For CUSTOM goal interval with customIntervalDays, check if today falls on the interval
  if (
    habit.goalInterval === GoalInterval.CUSTOM &&
    habit.customIntervalDays &&
    habit.customIntervalDays > 0
  ) {
    const daysSinceStart = daysBetween(startDate, checkDate);
    if (daysSinceStart < 0 || daysSinceStart % habit.customIntervalDays !== 0) {
      return false;
    }
  }

  return true;
}

/**
 * Get all habits scheduled for a specific date
 */
export function getHabitsForDate(
  habits: Habit[],
  date: Date | string,
): Habit[] {
  return habits.filter((habit) => isHabitScheduledForDate(habit, date));
}

/**
 * Get progress event for a habit on a specific date
 */
export function getProgressForHabitOnDate(
  progressEvents: HabitProgressEvent[],
  habitId: string,
  date: string,
): HabitProgressEvent | undefined {
  const normalizedDate = normalizeDate(date);
  return progressEvents.find(
    (p) => p.habitId === habitId && normalizeDate(p.date) === normalizedDate,
  );
}

/**
 * Get all progress events for a habit within a date range (inclusive)
 */
export function getProgressForHabitInRange(
  progressEvents: HabitProgressEvent[],
  habitId: string,
  startDate: Date | string,
  endDate: Date | string,
): HabitProgressEvent[] {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  return progressEvents.filter((p) => {
    if (p.habitId !== habitId) return false;
    const pDate = normalizeDate(p.date);
    return pDate >= start && pDate <= end;
  });
}

/**
 * Get aggregated progress value for a habit within its current interval
 * For weekly habits, this sums progress across the entire week
 * For monthly habits, this sums progress across the entire month
 * For daily habits, this returns the value for that specific day
 */
export function getProgressValueForInterval(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
  date: Date | string,
): number {
  const { start, end } = getHabitIntervalBounds(habit, date);
  const intervalProgress = getProgressForHabitInRange(
    progressEvents,
    habit.id,
    start,
    end,
  );
  return intervalProgress.reduce((sum, p) => sum + p.value, 0);
}

/**
 * Check if a habit is complete for a specific date/interval
 * For weekly/monthly habits, checks if the interval target is met
 */
export function isHabitCompleteOnDate(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
  date: string,
): boolean {
  // Get the aggregated progress for the habit's interval
  const progressValue = getProgressValueForInterval(
    habit,
    progressEvents,
    date,
  );

  const target = habit.goalTarget ?? 1;

  if (habit.isGoodHabit) {
    // At least target for good habits
    return progressValue >= target;
  } else {
    // At most target for bad habits (completing means staying at or below)
    return progressValue <= target;
  }
}

/**
 * Get total progress value for a habit on a specific date (single day only)
 */
export function getProgressValueOnDate(
  progressEvents: HabitProgressEvent[],
  habitId: string,
  date: string,
): number {
  const progress = getProgressForHabitOnDate(progressEvents, habitId, date);
  return progress?.value ?? 0;
}

/**
 * Check if a habit has any progress (value > 0) on a specific date
 * Used for streak calculation for weekly/monthly habits where any entry counts
 */
export function hasProgressOnDate(
  progressEvents: HabitProgressEvent[],
  habitId: string,
  date: string,
): boolean {
  return getProgressValueOnDate(progressEvents, habitId, date) > 0;
}

/**
 * Get display progress for a habit - uses interval aggregation for weekly/monthly habits
 */
export function getDisplayProgressValue(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
  date: string,
): number {
  return getProgressValueForInterval(habit, progressEvents, date);
}

/**
 * Calculate current streak for a habit
 * Streaks are always measured in days
 * For weekly/monthly habits: any day with progress counts toward the streak
 * For daily/custom habits: the habit must be complete on that day
 * A streak continues until a scheduled day is missed
 */
export function calculateCurrentStreak(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): number {
  const today = normalizeDate(new Date());
  const startDate = parseDate(habit.startDate.split("T")[0]);
  let streak = 0;

  // For weekly/monthly habits, use hasProgressOnDate (any entry counts)
  // For daily/custom habits, use isHabitCompleteOnDate (must be complete)
  const isIntervalBasedHabit =
    habit.goalInterval === GoalInterval.WEEKLY ||
    habit.goalInterval === GoalInterval.MONTHLY;

  let currentDate = parseDate(today);

  while (true) {
    const dateStr = normalizeDate(currentDate);

    if (currentDate < startDate) break;

    if (isHabitScheduledForDate(habit, currentDate)) {
      // For interval-based habits, any progress counts as maintaining the streak
      // For daily/custom habits, the habit must be complete
      const hasProgress = isIntervalBasedHabit
        ? hasProgressOnDate(progressEvents, habit.id, dateStr)
        : isHabitCompleteOnDate(habit, progressEvents, dateStr);

      if (hasProgress) {
        streak++;
        currentDate = addDays(currentDate, -1);
      } else {
        // Allow current day to be incomplete without breaking streak
        if (dateStr === today) {
          currentDate = addDays(currentDate, -1);
          continue;
        }
        break;
      }
    } else {
      // Skip non-scheduled days
      currentDate = addDays(currentDate, -1);
    }

    if (streak > 1000) break; // Safety limit
  }

  return streak;
}

/**
 * Check if a habit's streak is "secure" (won't be broken by counting today)
 * Returns true if:
 * - streak > 0 AND (today is not scheduled OR today has progress)
 * Returns false if:
 * - streak === 0
 * - streak > 0 but today is scheduled and has no progress (at risk of breaking)
 */
export function isStreakSecure(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): boolean {
  const streak = calculateCurrentStreak(habit, progressEvents);

  if (streak === 0) return false;

  const today = new Date();
  const todayStr = normalizeDate(today);

  // Check if today is scheduled for this habit
  const isTodayScheduled = isHabitScheduledForDate(habit, today);

  if (!isTodayScheduled) {
    // Not scheduled today, streak is secure
    return true;
  }

  // Today is scheduled - check if there's progress
  // For weekly/monthly habits, any progress secures the streak
  // For daily/custom habits, it must be complete
  const isIntervalBasedHabit =
    habit.goalInterval === GoalInterval.WEEKLY ||
    habit.goalInterval === GoalInterval.MONTHLY;

  if (isIntervalBasedHabit) {
    return hasProgressOnDate(progressEvents, habit.id, todayStr);
  }

  return isHabitCompleteOnDate(habit, progressEvents, todayStr);
}

/**
 * Calculate total completed days for a habit
 */
export function calculateTotalCompletedDays(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): number {
  const habitProgress = progressEvents.filter((p) => p.habitId === habit.id);
  return habitProgress.filter((p) => {
    return isHabitCompleteOnDate(habit, progressEvents, p.date);
  }).length;
}

/**
 * Calculate best/longest streak for a habit
 * For weekly/monthly habits: any day with progress counts toward the streak
 * For daily/custom habits: the habit must be complete on that day
 */
export function calculateBestStreak(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): number {
  const startDate = parseDate(habit.startDate.split("T")[0]);
  const today = parseDate(normalizeDate(new Date()));
  let bestStreak = 0;
  let currentStreak = 0;

  // For weekly/monthly habits, use hasProgressOnDate (any entry counts)
  // For daily/custom habits, use isHabitCompleteOnDate (must be complete)
  const isIntervalBasedHabit =
    habit.goalInterval === GoalInterval.WEEKLY ||
    habit.goalInterval === GoalInterval.MONTHLY;

  let currentDate = new Date(startDate);

  while (currentDate <= today) {
    if (isHabitScheduledForDate(habit, currentDate)) {
      const dateStr = normalizeDate(currentDate);
      const hasProgress = isIntervalBasedHabit
        ? hasProgressOnDate(progressEvents, habit.id, dateStr)
        : isHabitCompleteOnDate(habit, progressEvents, dateStr);

      if (hasProgress) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    currentDate = addDays(currentDate, 1);
  }

  return bestStreak;
}

/**
 * Calculate total value (sum of all progress values) for a habit
 */
export function calculateTotalValue(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): number {
  const habitProgress = progressEvents.filter((p) => p.habitId === habit.id);
  return habitProgress.reduce((sum, p) => sum + p.value, 0);
}

/**
 * Check if a habit has reached its end condition
 */
export function hasReachedEndCondition(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): boolean {
  if (!habit.endConditionType || !habit.endConditionValue) {
    return false;
  }

  switch (habit.endConditionType) {
    case "DATE":
      const endDate = parseDate(habit.endConditionValue);
      const today = new Date();
      return today > endDate;

    case "TOTAL_DAYS":
      const targetDays = parseInt(habit.endConditionValue, 10);
      return calculateTotalCompletedDays(habit, progressEvents) >= targetDays;

    case "TOTAL_VALUE":
      const targetValue = parseInt(habit.endConditionValue, 10);
      return calculateTotalValue(habit, progressEvents) >= targetValue;

    case "STREAK":
      const targetStreak = parseInt(habit.endConditionValue, 10);
      return calculateCurrentStreak(habit, progressEvents) >= targetStreak;

    default:
      return false;
  }
}

/**
 * Get all dates in a month
 */
export function getDatesInMonth(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  return dates;
}

/**
 * Get calendar grid for a month (includes padding days from prev/next months)
 */
export function getCalendarGrid(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add padding days from previous month
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    dates.push(addDays(firstDay, -i - 1));
  }

  // Add all days of current month
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  // Add padding days from next month to complete the grid (6 rows)
  const remainingDays = 42 - dates.length; // 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    dates.push(addDays(lastDay, i));
  }

  return dates;
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date | string,
  format: "short" | "long" | "iso" = "short",
): string {
  // Use parseDate for strings to ensure consistent local timezone handling
  const d = typeof date === "string" ? parseDate(date) : date;

  switch (format) {
    case "iso":
      return normalizeDate(d);
    case "long":
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "short":
    default:
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
  }
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  return normalizeDate(date1) === normalizeDate(date2);
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  return isSameDay(date, new Date());
}
