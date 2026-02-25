import {
  Habit,
  HabitTag,
  HabitProgressEvent,
  CreateHabitInput,
  UpdateHabitInput,
  CreateTagInput,
  LogProgressInput,
} from "@/types/habit";
import { StorageAdapter } from "./storage-adapter";

const STORAGE_KEYS = {
  HABITS: "habits-app-habits",
  TAGS: "habits-app-tags",
  PROGRESS: "habits-app-progress",
} as const;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

/**
 * Local storage implementation of the storage adapter
 */
export class LocalStorageAdapter implements StorageAdapter {
  // Habits
  async fetchHabits(): Promise<Habit[]> {
    return getFromStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
  }

  async createHabit(input: CreateHabitInput): Promise<Habit> {
    const habits = await this.fetchHabits();
    const now = new Date().toISOString();

    // Calculate the next order value (max + 1)
    const maxOrder = habits.reduce((max, h) => Math.max(max, h.order || 0), -1);

    const newHabit: Habit = {
      id: generateId(),
      name: input.name,
      description: input.description || null,
      isGoodHabit: input.isGoodHabit,
      color: input.color || null,
      icon: input.icon || null,
      recordingType: input.recordingType,
      goalInterval: input.goalInterval,
      goalTarget: input.goalTarget ?? null,
      customIntervalDays: input.customIntervalDays ?? null,
      scheduledDaysOfWeek: input.scheduledDaysOfWeek || [],
      startDate: input.startDate,
      endConditionType: input.endConditionType || null,
      endConditionValue: input.endConditionValue || null,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
      tagIds: input.tagIds || [],
    };
    const updated = [...habits, newHabit];
    setToStorage(STORAGE_KEYS.HABITS, updated);
    return newHabit;
  }

  async updateHabit(input: UpdateHabitInput): Promise<Habit | null> {
    const habits = await this.fetchHabits();
    const existingHabit = habits.find((h) => h.id === input.id);
    if (!existingHabit) return null;

    const updatedHabit: Habit = {
      ...existingHabit,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    const updated = habits.map((h) => (h.id === input.id ? updatedHabit : h));
    setToStorage(STORAGE_KEYS.HABITS, updated);
    return updatedHabit;
  }

  async deleteHabit(id: string): Promise<void> {
    const habits = await this.fetchHabits();
    const updated = habits.filter((h) => h.id !== id);
    setToStorage(STORAGE_KEYS.HABITS, updated);

    // Also delete associated progress
    const progress = await this.fetchProgress();
    const updatedProgress = progress.filter((p) => p.habitId !== id);
    setToStorage(STORAGE_KEYS.PROGRESS, updatedProgress);
  }

  async reorderHabits(habitIds: string[]): Promise<void> {
    const habits = await this.fetchHabits();

    // Update order for each habit based on its position in the habitIds array
    const updatedHabits = habits.map((habit) => {
      const newOrder = habitIds.indexOf(habit.id);
      if (newOrder !== -1) {
        return {
          ...habit,
          order: newOrder,
          updatedAt: new Date().toISOString(),
        };
      }
      return habit;
    });

    setToStorage(STORAGE_KEYS.HABITS, updatedHabits);
  }

  // Tags
  async fetchTags(): Promise<HabitTag[]> {
    return getFromStorage<HabitTag[]>(STORAGE_KEYS.TAGS, []);
  }

  async createTag(input: CreateTagInput): Promise<HabitTag> {
    const tags = await this.fetchTags();
    const now = new Date().toISOString();
    const newTag: HabitTag = {
      id: generateId(),
      name: input.name,
      color: input.color || null,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...tags, newTag];
    setToStorage(STORAGE_KEYS.TAGS, updated);
    return newTag;
  }

  async updateTag(
    id: string,
    input: Partial<CreateTagInput>,
  ): Promise<HabitTag | null> {
    const tags = await this.fetchTags();
    const existingTag = tags.find((t) => t.id === id);
    if (!existingTag) return null;

    const updatedTag: HabitTag = {
      ...existingTag,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    const updated = tags.map((t) => (t.id === id ? updatedTag : t));
    setToStorage(STORAGE_KEYS.TAGS, updated);
    return updatedTag;
  }

  async deleteTag(id: string): Promise<void> {
    const tags = await this.fetchTags();
    const updated = tags.filter((t) => t.id !== id);
    setToStorage(STORAGE_KEYS.TAGS, updated);

    // Also remove tag from habits
    const habits = await this.fetchHabits();
    const updatedHabits = habits.map((h) => ({
      ...h,
      tagIds: h.tagIds.filter((tagId) => tagId !== id),
      updatedAt: new Date().toISOString(),
    }));
    setToStorage(STORAGE_KEYS.HABITS, updatedHabits);
  }

  // Progress
  async fetchProgress(): Promise<HabitProgressEvent[]> {
    return getFromStorage<HabitProgressEvent[]>(STORAGE_KEYS.PROGRESS, []);
  }

  async logProgress(input: LogProgressInput): Promise<HabitProgressEvent> {
    const progress = await this.fetchProgress();
    const existingIndex = progress.findIndex(
      (p) => p.habitId === input.habitId && p.date === input.date,
    );

    const now = new Date().toISOString();
    const newProgress: HabitProgressEvent = {
      id: existingIndex >= 0 ? progress[existingIndex].id : generateId(),
      habitId: input.habitId,
      date: input.date,
      value: input.value,
      note: input.note || null,
      createdAt: existingIndex >= 0 ? progress[existingIndex].createdAt : now,
    };

    const updated =
      existingIndex >= 0
        ? progress.map((p, i) => (i === existingIndex ? newProgress : p))
        : [...progress, newProgress];

    setToStorage(STORAGE_KEYS.PROGRESS, updated);
    return newProgress;
  }

  async deleteProgress(id: string): Promise<void> {
    const progress = await this.fetchProgress();
    const updated = progress.filter((p) => p.id !== id);
    setToStorage(STORAGE_KEYS.PROGRESS, updated);
  }
}
