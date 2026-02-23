// Enums matching Prisma schema

// How progress is recorded each day
export enum RecordingType {
  YES_NO = "YES_NO", // Done / Not done (0 or 1)
  COUNT = "COUNT", // Integer count (0, 1, 2, ...)
  VALUE = "VALUE", // Decimal measurement (e.g., 7.5 hours)
}

// Goal reset interval
export enum GoalInterval {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  CUSTOM = "CUSTOM",
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

  // Recording type: how progress is logged each day
  recordingType: RecordingType;

  // Goal configuration: target within an interval
  goalInterval: GoalInterval;
  goalTarget?: number | null; // Target count/value for the interval
  customIntervalDays?: number | null; // Every X days (for CUSTOM interval)

  // Scheduling: which days the habit appears on (empty = every day)
  scheduledDaysOfWeek: number[]; // Array of weekdays 0-6 (Sun-Sat)

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
  recordingType: RecordingType;
  goalInterval: GoalInterval;
  goalTarget?: number;
  customIntervalDays?: number;
  scheduledDaysOfWeek?: number[];
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
