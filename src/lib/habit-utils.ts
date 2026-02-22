import {
  Habit,
  HabitProgressEvent,
  RepeatType,
  CompletionType,
} from "@/types/habit";

/**
 * Normalize a date to YYYY-MM-DD string format (date only, no time)
 */
export function normalizeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/**
 * Parse a normalized date string to Date object (at midnight UTC)
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00.000Z");
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

  switch (habit.repeatType) {
    case RepeatType.WEEKLY:
      const weekStartDay = habit.repeatWeekDay ?? 1; // Default to Monday
      return {
        start: getWeekStart(d, weekStartDay),
        end: getWeekEnd(d, weekStartDay),
      };

    case RepeatType.MONTHLY:
      return {
        start: getMonthStart(d),
        end: getMonthEnd(d),
      };

    case RepeatType.DAILY:
    case RepeatType.CUSTOM:
    default:
      // For daily and custom, the interval is just the single day
      return {
        start: d,
        end: d,
      };
  }
}

/**
 * Check if a habit is scheduled for a specific date based on its repeat rules
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

  switch (habit.repeatType) {
    case RepeatType.DAILY:
      return true;

    case RepeatType.WEEKLY:
      // Weekly habits are visible every day of the week
      // The repeatWeekDay indicates which day the week starts on
      return true;

    case RepeatType.MONTHLY:
      // Monthly habits are visible every day of the month
      // Progress is tracked across the entire calendar month
      return true;

    case RepeatType.CUSTOM:
      const checkDateDay = checkDate.getDay(); // 0-6 (Sunday-Saturday)
      // Check custom days of week
      if (habit.customDaysOfWeek && habit.customDaysOfWeek.length > 0) {
        if (habit.customDaysOfWeek.includes(checkDateDay)) {
          return true;
        }
      }
      // Check custom interval (every X days from start)
      if (habit.customIntervalDays && habit.customIntervalDays > 0) {
        const daysSinceStart = daysBetween(startDate, checkDate);
        return (
          daysSinceStart >= 0 && daysSinceStart % habit.customIntervalDays === 0
        );
      }
      // If no custom config, don't show
      return false;

    default:
      return false;
  }
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

  if (habit.completionType === CompletionType.YES_NO) {
    return progressValue >= 1;
  }

  if (habit.completionType === CompletionType.X_OCCURRENCES) {
    const target = habit.targetOccurrences ?? 1;
    if (habit.isGoodHabit) {
      // At least X occurrences for good habits
      return progressValue >= target;
    } else {
      // At most X occurrences for bad habits (completing means staying below)
      return progressValue <= target;
    }
  }

  return false;
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
 * For daily/custom habits: consecutive scheduled days of completion
 * For weekly habits: consecutive weeks of completion
 * For monthly habits: consecutive months of completion
 */
export function calculateCurrentStreak(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): number {
  const today = normalizeDate(new Date());
  const startDate = parseDate(habit.startDate.split("T")[0]);
  let streak = 0;

  if (habit.repeatType === RepeatType.WEEKLY) {
    // Count consecutive weeks
    const weekStartDay = habit.repeatWeekDay ?? 1;
    let currentWeekStart = getWeekStart(today, weekStartDay);

    while (true) {
      if (currentWeekStart < startDate) break;

      // Use the middle of the week for the interval check
      const midWeek = addDays(currentWeekStart, 3);

      if (
        isHabitCompleteOnDate(habit, progressEvents, normalizeDate(midWeek))
      ) {
        streak++;
        currentWeekStart = addDays(currentWeekStart, -7);
      } else {
        // Allow current week to be incomplete
        if (isSameDay(getWeekStart(today, weekStartDay), currentWeekStart)) {
          currentWeekStart = addDays(currentWeekStart, -7);
          continue;
        }
        break;
      }

      if (streak > 200) break; // Safety limit
    }
  } else if (habit.repeatType === RepeatType.MONTHLY) {
    // Count consecutive months
    let currentDate = parseDate(today);

    while (true) {
      const monthStart = getMonthStart(currentDate);
      if (monthStart < startDate) break;

      // Use the middle of the month for the interval check
      const midMonth = addDays(monthStart, 14);

      if (
        isHabitCompleteOnDate(habit, progressEvents, normalizeDate(midMonth))
      ) {
        streak++;
        // Go to previous month
        currentDate = addDays(monthStart, -1);
      } else {
        // Allow current month to be incomplete
        if (getMonthStart(today).getTime() === monthStart.getTime()) {
          currentDate = addDays(monthStart, -1);
          continue;
        }
        break;
      }

      if (streak > 60) break; // Safety limit (5 years)
    }
  } else {
    // Daily/Custom: count consecutive scheduled days
    let currentDate = parseDate(today);

    while (true) {
      const dateStr = normalizeDate(currentDate);

      if (currentDate < startDate) break;

      if (isHabitScheduledForDate(habit, currentDate)) {
        if (isHabitCompleteOnDate(habit, progressEvents, dateStr)) {
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

      if (streak > 1000) break;
    }
  }

  return streak;
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
 */
export function calculateBestStreak(
  habit: Habit,
  progressEvents: HabitProgressEvent[],
): number {
  const startDate = parseDate(habit.startDate.split("T")[0]);
  const today = parseDate(normalizeDate(new Date()));
  let bestStreak = 0;
  let currentStreak = 0;

  if (habit.repeatType === RepeatType.WEEKLY) {
    const weekStartDay = habit.repeatWeekDay ?? 1;
    let currentWeekStart = getWeekStart(startDate, weekStartDay);
    const todayWeekStart = getWeekStart(today, weekStartDay);

    while (currentWeekStart <= todayWeekStart) {
      const midWeek = addDays(currentWeekStart, 3);
      if (isHabitCompleteOnDate(habit, progressEvents, normalizeDate(midWeek))) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
      currentWeekStart = addDays(currentWeekStart, 7);
    }
  } else if (habit.repeatType === RepeatType.MONTHLY) {
    let currentDate = new Date(startDate);
    
    while (currentDate <= today) {
      const midMonth = addDays(getMonthStart(currentDate), 14);
      if (isHabitCompleteOnDate(habit, progressEvents, normalizeDate(midMonth))) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
  } else {
    // Daily/Custom
    let currentDate = new Date(startDate);
    
    while (currentDate <= today) {
      if (isHabitScheduledForDate(habit, currentDate)) {
        if (isHabitCompleteOnDate(habit, progressEvents, normalizeDate(currentDate))) {
          currentStreak++;
          bestStreak = Math.max(bestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
      currentDate = addDays(currentDate, 1);
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
  const d = typeof date === "string" ? new Date(date) : date;

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
