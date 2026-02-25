import {
  Habit,
  HabitTag,
  HabitProgressEvent,
  CreateHabitInput,
  UpdateHabitInput,
  CreateTagInput,
  LogProgressInput,
} from "@/types/habit";
import { StorageAdapter, PendingLocalData } from "./storage-adapter";
import {
  fetchHabits as fetchHabitsDb,
  fetchTags as fetchTagsDb,
  fetchProgress as fetchProgressDb,
  createHabit as createHabitDb,
  updateHabitInDb,
  deleteHabitFromDb,
  reorderHabitsInDb,
  createTag as createTagDb,
  updateTagInDb,
  deleteTagFromDb,
  logProgressInDb,
  deleteProgressFromDb,
  migrateLocalDataToDb,
} from "./db-storage";

/**
 * Database storage implementation of the storage adapter
 */
export class DatabaseStorageAdapter implements StorageAdapter {
  // Habits
  async fetchHabits(): Promise<Habit[]> {
    return fetchHabitsDb();
  }

  async createHabit(input: CreateHabitInput): Promise<Habit> {
    return createHabitDb(input);
  }

  async updateHabit(input: UpdateHabitInput): Promise<Habit | null> {
    return updateHabitInDb(input);
  }

  async deleteHabit(id: string): Promise<void> {
    return deleteHabitFromDb(id);
  }

  async reorderHabits(habitIds: string[]): Promise<void> {
    return reorderHabitsInDb(habitIds);
  }

  // Tags
  async fetchTags(): Promise<HabitTag[]> {
    return fetchTagsDb();
  }

  async createTag(input: CreateTagInput): Promise<HabitTag> {
    return createTagDb(input);
  }

  async updateTag(
    id: string,
    input: Partial<CreateTagInput>,
  ): Promise<HabitTag | null> {
    return updateTagInDb(id, input);
  }

  async deleteTag(id: string): Promise<void> {
    return deleteTagFromDb(id);
  }

  // Progress
  async fetchProgress(): Promise<HabitProgressEvent[]> {
    return fetchProgressDb();
  }

  async logProgress(input: LogProgressInput): Promise<HabitProgressEvent> {
    return logProgressInDb(input);
  }

  async deleteProgress(id: string): Promise<void> {
    return deleteProgressFromDb(id);
  }

  // Migration
  async migrate(data: PendingLocalData): Promise<void> {
    return migrateLocalDataToDb(data);
  }
}
