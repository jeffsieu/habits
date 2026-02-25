import { StorageType } from "./storage/storage-adapter";

/**
 * Query key factory for TanStack Query
 * All keys include storage type to prevent local/db data from being mixed
 */
export const queryKeys = {
  // Habits
  habits: (type: StorageType) => ["habits", type] as const,
  habit: (type: StorageType, id: string) => ["habits", type, id] as const,
  habitWithTags: (type: StorageType, id: string) =>
    ["habits", type, id, "with-tags"] as const,

  // Tags
  tags: (type: StorageType) => ["tags", type] as const,
  tag: (type: StorageType, id: string) => ["tags", type, id] as const,

  // Progress
  progress: (type: StorageType) => ["progress", type] as const,
  progressForHabit: (type: StorageType, habitId: string) =>
    ["progress", type, "habit", habitId] as const,
  progressForDate: (type: StorageType, date: string) =>
    ["progress", type, "date", date] as const,
  progressForHabitOnDate: (type: StorageType, habitId: string, date: string) =>
    ["progress", type, "habit", habitId, "date", date] as const,
};
