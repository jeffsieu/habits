import {
  Habit,
  HabitProgressEvent,
  GoalInterval,
  RecordingType,
} from "@/types/habit";

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
 * Returns the number of consecutive days since the streak was last broken
 *
 * For DAILY/CUSTOM habits:
 * - Count back from today until we find a scheduled day that was incomplete
 * - Today is allowed to be incomplete without breaking the streak
 *
 * For WEEKLY/MONTHLY habits:
 * - Count back from today until we find an interval that failed or is doomed
 * - Current interval doesn't break the streak if it can still be completed
 */
export function calculateCurrentStreak(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): number {
  const today = normalizeDate(new Date());
  const todayDate = parseDate(today);
  const startDate = parseDate(habit.startDate.split("T")[0]);

  if (todayDate < startDate) return 0;

  // For daily/custom habits, count days back until we find a failure
  if (
    habit.goalInterval === GoalInterval.DAILY ||
    habit.goalInterval === GoalInterval.CUSTOM
  ) {
    return calculateDailyStreakDays(
      habit,
      progressEvents,
      todayDate,
      startDate,
      today,
    );
  }

  // For weekly/monthly habits, count days back until we find a failed interval
  return calculateIntervalStreakDays(
    habit,
    progressEvents,
    todayDate,
    startDate,
  );
}

/**
 * Calculate streak days for daily/custom habits
 * Returns the number of consecutive days since last failure
 */
function calculateDailyStreakDays(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
  todayDate: Date,
  startDate: Date,
  today: string,
): number {
  let currentDate = todayDate;
  let streakDays = 0;

  while (currentDate >= startDate) {
    const dateStr = normalizeDate(currentDate);
    const isToday = dateStr === today;

    // Check if this is a scheduled day
    if (isHabitScheduledForDate(habit, currentDate)) {
      const isComplete = isHabitCompleteOnDate(habit, progressEvents, dateStr);

      if (!isComplete) {
        if (isToday) {
          // Today is incomplete - don't include it in the streak, but don't break yet
          currentDate = addDays(currentDate, -1);
          continue;
        } else {
          // Past scheduled day was incomplete - streak broken here
          break;
        }
      }
    }

    // This day is part of the streak (either not scheduled or completed)
    streakDays++;
    currentDate = addDays(currentDate, -1);

    if (streakDays > 10000) break; // Safety limit
  }

  return streakDays;
}

/**
 * Calculate streak days for weekly/monthly habits
 * Returns the number of consecutive days since last failed interval
 */
function calculateIntervalStreakDays(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
  todayDate: Date,
  startDate: Date,
): number {
  let currentDate = todayDate;
  let streakDays = 0;
  const processedIntervals = new Set<string>();

  while (currentDate >= startDate) {
    const interval = getHabitIntervalBounds(habit, currentDate);
    const intervalKey = `${normalizeDate(interval.start)}-${normalizeDate(interval.end)}`;

    // Only process each interval once
    if (!processedIntervals.has(intervalKey)) {
      processedIntervals.add(intervalKey);

      const intervalEnded = todayDate > interval.end;

      if (!intervalEnded) {
        // Current ongoing interval
        const canComplete = canIntervalBeCompleted(
          habit,
          progressEvents,
          interval.start,
          interval.end,
          todayDate,
        );

        if (!canComplete) {
          // Current interval is doomed - streak broken
          break;
        }

        // Count all days from interval start to today
        const daysInInterval = daysBetween(interval.start, todayDate) + 1;
        streakDays += daysInInterval;
      } else {
        // Past interval - check if it was completed
        const intervalComplete = isHabitCompleteOnDate(
          habit,
          progressEvents,
          normalizeDate(interval.end),
        );

        if (!intervalComplete) {
          // Interval failed - streak broken
          break;
        }

        // Count all days in this completed interval
        const daysInInterval = daysBetween(interval.start, interval.end) + 1;
        streakDays += daysInInterval;
      }
    }

    // Move to the day before this interval started
    currentDate = addDays(interval.start, -1);

    if (streakDays > 10000) break; // Safety limit
  }

  return streakDays;
}

/**
 * Check if an interval can still be completed given the remaining days
 * Returns false if the interval is "doomed" (cannot be completed no matter what)
 */
function canIntervalBeCompleted(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
  intervalStart: Date,
  intervalEnd: Date,
  today: Date,
): boolean {
  // Get current progress in this interval
  const currentProgress = getProgressValueForInterval(
    habit,
    progressEvents,
    intervalEnd,
  );
  const target = habit.goalTarget ?? 1;

  // Already completed
  if (habit.isGoodHabit && currentProgress >= target) {
    return true;
  }
  if (!habit.isGoodHabit && currentProgress <= target) {
    return true;
  }

  // For bad habits with COUNT/VALUE, we can't determine if it's doomed
  // (we can't "undo" progress), so assume it's doomed if already over target
  if (!habit.isGoodHabit) {
    return false;
  }

  // For good habits, check if we can still reach the target
  // Count remaining scheduled days (including today if scheduled)
  let remainingDays = 0;
  let currentDate = today;

  while (currentDate <= intervalEnd) {
    if (isHabitScheduledForDate(habit, currentDate)) {
      const dateStr = normalizeDate(currentDate);
      const hasProgress = hasProgressOnDate(progressEvents, habit.id, dateStr);

      // Only count days where we haven't already logged progress
      if (!hasProgress) {
        remainingDays++;
      }
    }
    currentDate = addDays(currentDate, 1);
  }

  // For YES_NO habits, max we can add is 1 per day
  if (habit.recordingType === RecordingType.YES_NO) {
    const maxPossibleProgress = currentProgress + remainingDays;
    return maxPossibleProgress >= target;
  }

  // For COUNT and VALUE habits, we can't determine if it's doomed
  // (theoretically unlimited progress per day), so assume it's achievable
  return true;
}

/**
 * Check if a habit's streak is "secure" (won't be broken)
 *
 * For DAILY/CUSTOM habits:
 * - Secure if today is not scheduled OR today is complete
 *
 * For WEEKLY/MONTHLY habits:
 * - Secure if the current interval can still be completed (not "doomed")
 * - At risk if the interval is doomed (impossible to meet goal with remaining days)
 */
export function isStreakSecure(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): boolean {
  const streak = calculateCurrentStreak(habit, progressEvents);

  if (streak === 0) return false;

  const today = new Date();
  const todayStr = normalizeDate(today);

  // For weekly/monthly habits, check if current interval can still be completed
  if (
    habit.goalInterval === GoalInterval.WEEKLY ||
    habit.goalInterval === GoalInterval.MONTHLY
  ) {
    const interval = getHabitIntervalBounds(habit, today);
    return canIntervalBeCompleted(
      habit,
      progressEvents,
      interval.start,
      interval.end,
      today,
    );
  }

  // For daily/custom habits, check if today is complete or not scheduled
  const isTodayScheduled = isHabitScheduledForDate(habit, today);

  if (!isTodayScheduled) {
    // Not scheduled today, streak is secure
    return true;
  }

  // Today is scheduled - check if it's complete
  return isHabitCompleteOnDate(habit, progressEvents, todayStr);
}

/**
 * Check if a specific date is within the current active streak
 * Returns true if the date is part of the "safe" streak days
 * (days with no progress but still maintaining the streak)
 */
export function isDateWithinStreak(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
  checkDate: Date | string,
): boolean {
  const today = normalizeDate(new Date());
  const todayDate = parseDate(today);
  const checkDateStr =
    typeof checkDate === "string" ? checkDate : normalizeDate(checkDate);
  const checkDateObj =
    typeof checkDate === "string" ? parseDate(checkDate) : checkDate;
  const startDate = parseDate(habit.startDate.split("T")[0]);

  // Can't be in streak if before start date or after today
  if (checkDateObj < startDate || checkDateObj > todayDate) {
    return false;
  }

  // Check if there's a current streak
  const streak = calculateCurrentStreak(habit, progressEvents);
  if (streak === 0) return false;

  // For daily/custom habits
  if (
    habit.goalInterval === GoalInterval.DAILY ||
    habit.goalInterval === GoalInterval.CUSTOM
  ) {
    // Walk back from today to find where the streak breaks
    let currentDate = todayDate;
    while (currentDate >= startDate) {
      const dateStr = normalizeDate(currentDate);

      if (isHabitScheduledForDate(habit, currentDate)) {
        const isComplete = isHabitCompleteOnDate(
          habit,
          progressEvents,
          dateStr,
        );

        if (!isComplete && dateStr !== today) {
          // Found where streak broke - check date is not before this
          return checkDateObj > currentDate;
        }
      }

      // If we've reached the check date while walking back, it's in the streak
      if (dateStr === checkDateStr) {
        return true;
      }

      currentDate = addDays(currentDate, -1);
    }

    return false;
  }

  // For weekly/monthly habits - check if the date's interval is part of the streak

  // Walk back through intervals
  let currentDate = todayDate;
  const processedIntervals = new Set<string>();

  while (currentDate >= startDate) {
    const interval = getHabitIntervalBounds(habit, currentDate);
    const intervalKey = `${normalizeDate(interval.start)}-${normalizeDate(interval.end)}`;

    if (!processedIntervals.has(intervalKey)) {
      processedIntervals.add(intervalKey);

      // Check if this is the interval containing our check date
      if (checkDateObj >= interval.start && checkDateObj <= interval.end) {
        // Check if this interval is part of the streak
        const intervalEnded = todayDate > interval.end;

        if (!intervalEnded) {
          // Current interval - check if it can be completed
          return canIntervalBeCompleted(
            habit,
            progressEvents,
            interval.start,
            interval.end,
            todayDate,
          );
        } else {
          // Past interval - check if it was completed
          return isHabitCompleteOnDate(
            habit,
            progressEvents,
            normalizeDate(interval.end),
          );
        }
      }

      // Check if this interval failed (which would mean dates after it are not in streak)
      const intervalEnded = todayDate > interval.end;

      if (!intervalEnded) {
        const canComplete = canIntervalBeCompleted(
          habit,
          progressEvents,
          interval.start,
          interval.end,
          todayDate,
        );
        if (!canComplete) {
          // Current interval is doomed - dates before today are not in streak
          return false;
        }
      } else {
        const intervalComplete = isHabitCompleteOnDate(
          habit,
          progressEvents,
          normalizeDate(interval.end),
        );
        if (!intervalComplete) {
          // This interval failed - check if our date is after this interval
          return checkDateObj < interval.start;
        }
      }
    }

    currentDate = addDays(interval.start, -1);
  }

  return false;
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
