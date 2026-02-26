import {
  Habit,
  HabitProgressEvent,
  GoalInterval,
  RecordingType,
} from "@/types/habit";

/**
 * Represents the streak state at a specific point in time
 */
export interface Streak {
  /** Target progress needed to meet the goal for the current interval */
  goalProgress: number;
  /** Total progress accumulated in the current interval so far */
  totalIntervalProgress: number;
  /** Total progress accumulated across the entire streak (the streak counter) */
  totalProgress: number;
  /** Whether the goal has been completed for the current interval */
  isGoalComplete: boolean;
  /** Length of streak before this day (0 if no previous streak) */
  previousLength: number;
  /** Length of streak including this day */
  newLength: number;
}

/**
 * Statistics for a single day, including progress and streak information
 */
export interface DayStatistics {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Total progress value recorded on this day */
  dayProgress: number;
  /** Streak state after this day's progress, null if streak is broken */
  streak: Streak | null;
}

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
 * Count remaining scheduled days in an interval starting from the day after currentDate
 */
function getRemainingScheduledDaysInInterval(
  habit: Habit,
  currentDate: Date,
  intervalEnd: Date,
): number {
  let count = 0;
  let checkDate = addDays(currentDate, 1);

  while (checkDate <= intervalEnd) {
    if (isHabitScheduledForDate(habit, checkDate)) {
      count++;
    }
    checkDate = addDays(checkDate, 1);
  }

  return count;
}

/**
 * Calculate the pro-rated goal target for the first incomplete interval
 * For habits that start mid-interval, adjust the target proportionally
 *
 * Example:
 * - Weekly habit with target 3, starting on Friday (3 days left in week)
 * - Pro-rated target: ceil(3 * 3/7) = ceil(1.29) = 2
 */
function getProRatedGoalTarget(habit: Habit, date: Date): number {
  const baseTarget = habit.goalTarget ?? 1;

  // Only pro-rate for WEEKLY and MONTHLY intervals
  if (
    habit.goalInterval !== GoalInterval.WEEKLY &&
    habit.goalInterval !== GoalInterval.MONTHLY
  ) {
    return baseTarget;
  }

  const startDate = parseDate(habit.startDate.split("T")[0]);
  const interval = getHabitIntervalBounds(habit, date);

  // Check if this interval contains the habit's start date
  const isFirstInterval =
    startDate >= interval.start && startDate <= interval.end;

  if (!isFirstInterval) {
    // Not the first interval, use full target
    return baseTarget;
  }

  // Calculate the total days in a full interval
  const fullIntervalDays = daysBetween(interval.start, interval.end) + 1;

  // Calculate days from start date to end of interval (inclusive)
  const availableDays = daysBetween(startDate, interval.end) + 1;

  // Pro-rate the target and round up
  const proRatedTarget = Math.ceil(
    (baseTarget * availableDays) / fullIntervalDays,
  );

  // Ensure at least 1 if original target was > 0
  return Math.max(1, proRatedTarget);
}

/**
 * Calculate the streak state for a single day given the previous day's streak
 */
function calculateNextDayStreak(
  habit: Habit,
  date: Date,
  dateStr: string,
  dayProgress: number,
  previousStreak: Streak | null,
  isScheduled: boolean,
  progressEventsByDate: Map<string, number>,
): Streak | null {
  // Streaks must always start from a date of progress
  if (dayProgress === 0 && previousStreak === null) {
    return null;
  }

  // Get interval information for this date
  const interval = getHabitIntervalBounds(habit, date);
  // Use pro-rated goal for first interval, or full target otherwise
  const goalProgress = getProRatedGoalTarget(habit, date);

  // Check if we're in a new interval compared to previous day
  const previousDate = addDays(date, -1);
  const previousInterval =
    previousStreak !== null
      ? getHabitIntervalBounds(habit, previousDate)
      : null;

  const isNewInterval =
    previousInterval === null ||
    normalizeDate(interval.start) !== normalizeDate(previousInterval.start);

  // Calculate total progress in this interval
  let totalIntervalProgress: number;

  if (isNewInterval || previousStreak === null) {
    // New interval or no previous streak - start fresh
    totalIntervalProgress = dayProgress;
  } else {
    // Same interval - accumulate progress
    totalIntervalProgress = previousStreak.totalIntervalProgress + dayProgress;
  }

  // For interval-based habits (weekly/monthly), we need to sum ALL progress in the interval
  if (
    habit.goalInterval === GoalInterval.WEEKLY ||
    habit.goalInterval === GoalInterval.MONTHLY
  ) {
    // Recalculate total progress for the entire interval
    totalIntervalProgress = 0;
    let currentDate = interval.start;
    while (currentDate <= date) {
      const currentDateStr = normalizeDate(currentDate);
      totalIntervalProgress += progressEventsByDate.get(currentDateStr) ?? 0;
      currentDate = addDays(currentDate, 1);
    }
  }

  // Determine if goal is complete
  const isGoalComplete = habit.isGoodHabit
    ? totalIntervalProgress >= goalProgress
    : totalIntervalProgress <= goalProgress;

  // Calculate remaining progress needed
  const remainingProgress = habit.isGoodHabit
    ? Math.max(0, goalProgress - totalIntervalProgress)
    : 0; // For bad habits, we don't calculate "remaining" the same way

  // Get remaining scheduled days in interval (after this day)
  const remainingScheduledDays = getRemainingScheduledDaysInInterval(
    habit,
    date,
    interval.end,
  );

  // Determine if streak continues
  let streakContinues = false;
  let incrementLength = false;

  if (isGoalComplete) {
    // Goal is complete - streak definitely continues
    streakContinues = true;
    incrementLength = true;
  } else if (dayProgress > 0) {
    // Has progress on scheduled day but goal not complete yet
    // Check if remaining days can still achieve the goal
    if (habit.recordingType === RecordingType.YES_NO) {
      // For YES_NO, need at least remainingProgress scheduled days
      streakContinues = remainingScheduledDays >= remainingProgress;
    } else {
      // For COUNT/VALUE, be optimistic - as long as there's at least one day left
      streakContinues = remainingScheduledDays >= 1 || remainingProgress === 0;
    }
    incrementLength = streakContinues;
  } else {
    // No progress on scheduled day
    // Check if we can still achieve the goal with remaining days
    if (habit.recordingType === RecordingType.YES_NO) {
      // For YES_NO with no progress, need remainingProgress scheduled days remaining
      streakContinues = remainingScheduledDays >= remainingProgress;
    } else {
      // For COUNT/VALUE with no progress, need at least 1 day to make up the difference
      streakContinues = remainingScheduledDays >= 1 && remainingProgress > 0;
    }
    incrementLength = false; // Don't increment on days with no progress
  }

  // Handle bad habits specially
  if (!habit.isGoodHabit) {
    if (totalIntervalProgress > goalProgress) {
      // Exceeded limit for bad habit - streak is broken
      return null;
    }
    // For bad habits, if we haven't exceeded, the streak continues
    streakContinues = true;
    incrementLength = isScheduled && dayProgress <= goalProgress;
  }

  const previousLength = previousStreak?.newLength ?? 0;
  const newLength = (() => {
    if (!streakContinues) {
      return 0;
    }

    if (streakContinues) {
      return previousLength + 1;
    }

    return previousLength;
  })();

  // Calculate total progress across the entire streak
  const totalProgress = (previousStreak?.totalProgress ?? 0) + dayProgress;

  return {
    goalProgress,
    totalIntervalProgress,
    totalProgress,
    isGoalComplete,
    previousLength,
    newLength,
  };
}

/**
 * Calculate day-by-day statistics with cumulative streak information
 * This is the core function that builds up streak state from the earliest record
 */
export function calculateDayStatistics(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
  upToDate: Date,
): DayStatistics[] {
  const startDate = parseDate(habit.startDate.split("T")[0]);
  const endDate = startOfDay(upToDate);

  // If habit hasn't started yet, return empty array
  if (endDate < startDate) {
    return [];
  }

  // Group progress events by date for O(1) lookup
  const progressEventsByDate = new Map<string, number>();
  for (const event of progressEvents) {
    if (event.habitId !== habit.id) continue;
    const eventDate = normalizeDate(event.date);
    const currentValue = progressEventsByDate.get(eventDate) ?? 0;
    progressEventsByDate.set(eventDate, currentValue + event.value);
  }

  // Build statistics day by day
  const statistics: DayStatistics[] = [];
  let currentDate = startDate;
  let previousStreak: Streak | null = null;

  while (currentDate <= endDate) {
    const dateStr = normalizeDate(currentDate);
    const dayProgress = progressEventsByDate.get(dateStr) ?? 0;
    const isScheduled = isHabitScheduledForDate(habit, currentDate);

    const streak = calculateNextDayStreak(
      habit,
      currentDate,
      dateStr,
      dayProgress,
      previousStreak,
      isScheduled,
      progressEventsByDate,
    );

    statistics.push({
      date: dateStr,
      dayProgress,
      streak,
    });

    previousStreak = streak;
    currentDate = addDays(currentDate, 1);
  }

  return statistics;
}

/**
 * Calculate current streak for a habit
 * Returns the number of consecutive days in the current active streak
 *
 * Now uses the cumulative day statistics approach for consistency
 */
export function calculateCurrentStreak(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): number {
  const today = new Date();
  const stats = calculateDayStatistics(habit, progressEvents, today);
  console.log("stats", stats);

  if (stats.length === 0) return 0;

  const todayStats = stats[stats.length - 1];

  const streak = todayStats.streak;

  if (!streak) {
    return 0;
  }

  return todayStats.dayProgress > 0 ? streak.newLength : streak.previousLength;
}

/**
 * Calculate the total progress accumulated in the current active streak
 * Returns the sum of all progress values across the entire streak
 * This is what should be displayed as the "streak counter"
 */
export function calculateCurrentStreakProgress(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): number {
  const today = new Date();
  const stats = calculateDayStatistics(habit, progressEvents, today);

  if (stats.length === 0) return 0;

  const todayStats = stats[stats.length - 1];
  return todayStats?.streak?.totalProgress ?? 0;
}

/**
 * Check if a habit's streak is "secure" (won't be broken if no more progress is made today)
 *
 * A streak is secure if:
 * - Today is not scheduled, OR
 * - Today is scheduled and the goal is already complete, OR
 * - Today is scheduled with some progress and enough days remain to complete the goal
 */
export function isStreakSecure(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): boolean {
  const today = new Date();
  const stats = calculateDayStatistics(habit, progressEvents, today);

  if (stats.length === 0) return false;

  const todayStats = stats[stats.length - 1];

  if (!todayStats?.streak) return false;

  // Check if today is scheduled
  const isScheduledToday = isHabitScheduledForDate(habit, today);

  if (!isScheduledToday) {
    // Not scheduled today - streak is secure
    return true;
  }

  // Secure if goal is complete OR if there are still enough days to complete
  if (todayStats.streak.isGoalComplete) {
    return true;
  }

  // Check if we can still complete the interval
  const interval = getHabitIntervalBounds(habit, today);
  const remainingScheduledDays = getRemainingScheduledDaysInInterval(
    habit,
    today,
    interval.end,
  );

  const remainingProgress =
    todayStats.streak.goalProgress - todayStats.streak.totalIntervalProgress;

  if (habit.recordingType === RecordingType.YES_NO) {
    return remainingScheduledDays >= remainingProgress;
  }

  // For COUNT/VALUE, be optimistic
  return remainingScheduledDays >= 1 || remainingProgress <= 0;
}

/**
 * Check if a date should show a checkmark despite having no progress
 * Returns true if the day has no progress but the streak continued
 * (i.e., newLength === previousLength + 1)
 */
export function shouldShowCheckmark(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
  checkDate: Date | string,
): boolean {
  const today = new Date();
  const checkDateStr =
    typeof checkDate === "string" ? checkDate : normalizeDate(checkDate);
  const checkDateObj =
    typeof checkDate === "string" ? parseDate(checkDate) : checkDate;
  const startDate = parseDate(habit.startDate.split("T")[0]);

  // Can't show checkmark if before start date or after today
  if (checkDateObj < startDate || checkDateObj > today) {
    return false;
  }

  const stats = calculateDayStatistics(habit, progressEvents, today);

  // Find the statistics for the check date
  const dateStat = stats.find((s) => s.date === checkDateStr);

  if (!dateStat || !dateStat.streak) return false;

  // Show checkmark if: no progress AND streak continued from previous day
  return (
    dateStat.dayProgress === 0 &&
    dateStat.streak.newLength === dateStat.streak.previousLength + 1
  );
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
 * Uses the day statistics to find the maximum streak length ever achieved
 */
export function calculateBestStreak(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): number {
  const today = new Date();
  const stats = calculateDayStatistics(habit, progressEvents, today);

  let bestStreak = 0;
  for (const stat of stats) {
    if (stat.streak && stat.streak.newLength > bestStreak) {
      bestStreak = stat.streak.newLength;
    }
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
