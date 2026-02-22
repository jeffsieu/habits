// Enums matching Prisma schema
export enum RepeatType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  CUSTOM = "CUSTOM",
}

export enum CompletionType {
  YES_NO = "YES_NO",
  X_OCCURRENCES = "X_OCCURRENCES",
}

export enum EndConditionType {
  DATE = "DATE",
  TOTAL_DAYS = "TOTAL_DAYS",
  TOTAL_VALUE = "TOTAL_VALUE",
  STREAK = "STREAK",
}

// Core interfaces matching Prisma models
export interface Habit {
  id: string;
  name: string;
  description?: string | null;
  isGoodHabit: boolean;
  color?: string | null; // Hex color code for the habit
  icon?: string | null; // Lucide icon name

  // Repeat configuration
  repeatType: RepeatType;
  repeatWeekDay?: number | null; // 0-6 for Sunday-Saturday (for WEEKLY)
  repeatMonthDay?: number | null; // 1-31 (for MONTHLY)
  customIntervalDays?: number | null; // Every X days (for CUSTOM)
  customDaysOfWeek: number[]; // Array of weekdays 0-6 (for CUSTOM)

  // Completion configuration
  completionType: CompletionType;
  targetOccurrences?: number | null; // Target for X_OCCURRENCES type

  // Date configuration
  startDate: string; // ISO date string
  endConditionType?: EndConditionType | null;
  endConditionValue?: string | null; // Stores date string or numeric value

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Tag IDs for local storage (relations stored separately)
  tagIds: string[];
}

export interface HabitTag {
  id: string;
  name: string;
  color?: string | null; // Hex color code

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface HabitProgressEvent {
  id: string;
  habitId: string;
  date: string; // ISO date string (day being logged)
  value: number; // User-entered amount; 1 for yes/no completion
  note?: string | null;

  // Timestamps
  createdAt: string;
}

// Computed/Extended types
export interface HabitWithTags extends Habit {
  tags: HabitTag[];
}

export interface HabitWithProgress extends Habit {
  progressEvents: HabitProgressEvent[];
}

export interface HabitWithTagsAndProgress extends HabitWithTags {
  progressEvents: HabitProgressEvent[];
}

// Form types for creating/editing
export interface CreateHabitInput {
  name: string;
  description?: string;
  isGoodHabit: boolean;
  color?: string;
  icon?: string;
  repeatType: RepeatType;
  repeatWeekDay?: number;
  repeatMonthDay?: number;
  customIntervalDays?: number;
  customDaysOfWeek?: number[];
  completionType: CompletionType;
  targetOccurrences?: number;
  startDate: string;
  endConditionType?: EndConditionType;
  endConditionValue?: string;
  tagIds?: string[];
}

export interface UpdateHabitInput extends Partial<CreateHabitInput> {
  id: string;
}

export interface CreateTagInput {
  name: string;
  color?: string;
}

export interface LogProgressInput {
  habitId: string;
  date: string;
  value: number;
  note?: string;
}

// Day names for UI
export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAY_SHORT_NAMES = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

// Helper to get ordinal suffix for day of month
export function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatDayOfMonth(day: number): string {
  return `${day}${getOrdinalSuffix(day)}`;
}
