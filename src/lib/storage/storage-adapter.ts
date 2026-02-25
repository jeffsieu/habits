import {
  Habit,
  HabitTag,
  HabitProgressEvent,
  CreateHabitInput,
  UpdateHabitInput,
  CreateTagInput,
  LogProgressInput,
} from "@/types/habit";

export interface PendingLocalData {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
}

/**
 * Storage adapter interface for abstracting storage implementation
 * Supports both local storage and database storage
 */
export interface StorageAdapter {
  // Habits
  fetchHabits(): Promise<Habit[]>;
  createHabit(input: CreateHabitInput): Promise<Habit>;
  updateHabit(input: UpdateHabitInput): Promise<Habit | null>;
  deleteHabit(id: string): Promise<void>;
  reorderHabits(habitIds: string[]): Promise<void>;

  // Tags
  fetchTags(): Promise<HabitTag[]>;
  createTag(input: CreateTagInput): Promise<HabitTag>;
  updateTag(
    id: string,
    input: Partial<CreateTagInput>,
  ): Promise<HabitTag | null>;
  deleteTag(id: string): Promise<void>;

  // Progress
  fetchProgress(): Promise<HabitProgressEvent[]>;
  logProgress(input: LogProgressInput): Promise<HabitProgressEvent>;
  deleteProgress(id: string): Promise<void>;

  // Migration (optional, only available on database adapter)
  migrate?(data: PendingLocalData): Promise<void>;
}

export type StorageType = "local" | "db";
