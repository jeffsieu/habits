"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Habit,
  HabitTag,
  HabitProgressEvent,
  CreateHabitInput,
  UpdateHabitInput,
  CreateTagInput,
  LogProgressInput,
  HabitWithTags,
} from "@/types/habit";

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

export interface HabitsState {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  isLoaded: boolean;
}

export interface HabitsActions {
  // Habit CRUD
  addHabit: (input: CreateHabitInput) => Habit;
  updateHabit: (input: UpdateHabitInput) => Habit | null;
  deleteHabit: (id: string) => void;
  getHabit: (id: string) => Habit | undefined;
  getHabitWithTags: (id: string) => HabitWithTags | undefined;

  // Tag CRUD
  addTag: (input: CreateTagInput) => HabitTag;
  updateTag: (id: string, input: Partial<CreateTagInput>) => HabitTag | null;
  deleteTag: (id: string) => void;
  getTag: (id: string) => HabitTag | undefined;

  // Progress operations
  logProgress: (input: LogProgressInput) => HabitProgressEvent;
  updateProgress: (
    id: string,
    input: Partial<LogProgressInput>,
  ) => HabitProgressEvent | null;
  deleteProgress: (id: string) => void;
  getProgressForHabit: (habitId: string) => HabitProgressEvent[];
  getProgressForDate: (date: string) => HabitProgressEvent[];
  getProgressForHabitOnDate: (
    habitId: string,
    date: string,
  ) => HabitProgressEvent | undefined;
}

export function useHabits(): HabitsState & HabitsActions {
  // Use lazy initialization to load from localStorage
  const [habits, setHabits] = useState<Habit[]>(() =>
    getFromStorage(STORAGE_KEYS.HABITS, []),
  );
  const [tags, setTags] = useState<HabitTag[]>(() =>
    getFromStorage(STORAGE_KEYS.TAGS, []),
  );
  const [progressEvents, setProgressEvents] = useState<HabitProgressEvent[]>(
    () => getFromStorage(STORAGE_KEYS.PROGRESS, []),
  );
  // Start as true since lazy init already loaded from localStorage
  const [isLoaded] = useState(true);

  // Persist to localStorage on change
  useEffect(() => {
    setToStorage(STORAGE_KEYS.HABITS, habits);
  }, [habits]);

  useEffect(() => {
    setToStorage(STORAGE_KEYS.TAGS, tags);
  }, [tags]);

  useEffect(() => {
    setToStorage(STORAGE_KEYS.PROGRESS, progressEvents);
  }, [progressEvents]);

  // Habit CRUD
  const addHabit = useCallback((input: CreateHabitInput): Habit => {
    const now = new Date().toISOString();
    const newHabit: Habit = {
      id: generateId(),
      name: input.name,
      description: input.description || null,
      isGoodHabit: input.isGoodHabit,
      repeatType: input.repeatType,
      repeatWeekDay: input.repeatWeekDay ?? null,
      repeatMonthDay: input.repeatMonthDay ?? null,
      customIntervalDays: input.customIntervalDays ?? null,
      customDaysOfWeek: input.customDaysOfWeek || [],
      completionType: input.completionType,
      targetOccurrences: input.targetOccurrences ?? null,
      startDate: input.startDate,
      endConditionType: input.endConditionType || null,
      endConditionValue: input.endConditionValue || null,
      createdAt: now,
      updatedAt: now,
      tagIds: input.tagIds || [],
    };
    setHabits((prev) => [...prev, newHabit]);
    return newHabit;
  }, []);

  const updateHabit = useCallback(
    (input: UpdateHabitInput): Habit | null => {
      const existingIndex = habits.findIndex((h) => h.id === input.id);
      if (existingIndex === -1) return null;

      const updated: Habit = {
        ...habits[existingIndex],
        ...input,
        updatedAt: new Date().toISOString(),
      };

      setHabits((prev) => {
        const newHabits = [...prev];
        newHabits[existingIndex] = updated;
        return newHabits;
      });

      return updated;
    },
    [habits],
  );

  const deleteHabit = useCallback((id: string): void => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    // Also delete related progress events
    setProgressEvents((prev) => prev.filter((p) => p.habitId !== id));
  }, []);

  const getHabit = useCallback(
    (id: string): Habit | undefined => {
      return habits.find((h) => h.id === id);
    },
    [habits],
  );

  const getHabitWithTags = useCallback(
    (id: string): HabitWithTags | undefined => {
      const habit = habits.find((h) => h.id === id);
      if (!habit) return undefined;
      return {
        ...habit,
        tags: tags.filter((t) => habit.tagIds.includes(t.id)),
      };
    },
    [habits, tags],
  );

  // Tag CRUD
  const addTag = useCallback((input: CreateTagInput): HabitTag => {
    const now = new Date().toISOString();
    const newTag: HabitTag = {
      id: generateId(),
      name: input.name,
      color: input.color || null,
      createdAt: now,
      updatedAt: now,
    };
    setTags((prev) => [...prev, newTag]);
    return newTag;
  }, []);

  const updateTag = useCallback(
    (id: string, input: Partial<CreateTagInput>): HabitTag | null => {
      const existingIndex = tags.findIndex((t) => t.id === id);
      if (existingIndex === -1) return null;

      const updated: HabitTag = {
        ...tags[existingIndex],
        ...input,
        updatedAt: new Date().toISOString(),
      };

      setTags((prev) => {
        const newTags = [...prev];
        newTags[existingIndex] = updated;
        return newTags;
      });

      return updated;
    },
    [tags],
  );

  const deleteTag = useCallback((id: string): void => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    // Remove tag from all habits
    setHabits((prev) =>
      prev.map((h) => ({
        ...h,
        tagIds: h.tagIds.filter((tagId) => tagId !== id),
        updatedAt: new Date().toISOString(),
      })),
    );
  }, []);

  const getTag = useCallback(
    (id: string): HabitTag | undefined => {
      return tags.find((t) => t.id === id);
    },
    [tags],
  );

  // Progress operations
  const logProgress = useCallback(
    (input: LogProgressInput): HabitProgressEvent => {
      // Check if progress already exists for this habit on this date
      const existingIndex = progressEvents.findIndex(
        (p) => p.habitId === input.habitId && p.date === input.date,
      );

      const newProgress: HabitProgressEvent = {
        id:
          existingIndex >= 0 ? progressEvents[existingIndex].id : generateId(),
        habitId: input.habitId,
        date: input.date,
        value: input.value,
        note: input.note || null,
        createdAt:
          existingIndex >= 0
            ? progressEvents[existingIndex].createdAt
            : new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        // Update existing
        setProgressEvents((prev) => {
          const updated = [...prev];
          updated[existingIndex] = newProgress;
          return updated;
        });
      } else {
        // Add new
        setProgressEvents((prev) => [...prev, newProgress]);
      }

      return newProgress;
    },
    [progressEvents],
  );

  const updateProgress = useCallback(
    (
      id: string,
      input: Partial<LogProgressInput>,
    ): HabitProgressEvent | null => {
      const existingIndex = progressEvents.findIndex((p) => p.id === id);
      if (existingIndex === -1) return null;

      const updated: HabitProgressEvent = {
        ...progressEvents[existingIndex],
        ...input,
      };

      setProgressEvents((prev) => {
        const newProgress = [...prev];
        newProgress[existingIndex] = updated;
        return newProgress;
      });

      return updated;
    },
    [progressEvents],
  );

  const deleteProgress = useCallback((id: string): void => {
    setProgressEvents((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getProgressForHabit = useCallback(
    (habitId: string): HabitProgressEvent[] => {
      return progressEvents.filter((p) => p.habitId === habitId);
    },
    [progressEvents],
  );

  const getProgressForDate = useCallback(
    (date: string): HabitProgressEvent[] => {
      return progressEvents.filter((p) => p.date === date);
    },
    [progressEvents],
  );

  const getProgressForHabitOnDate = useCallback(
    (habitId: string, date: string): HabitProgressEvent | undefined => {
      return progressEvents.find(
        (p) => p.habitId === habitId && p.date === date,
      );
    },
    [progressEvents],
  );

  return {
    // State
    habits,
    tags,
    progressEvents,
    isLoaded,
    // Habit actions
    addHabit,
    updateHabit,
    deleteHabit,
    getHabit,
    getHabitWithTags,
    // Tag actions
    addTag,
    updateTag,
    deleteTag,
    getTag,
    // Progress actions
    logProgress,
    updateProgress,
    deleteProgress,
    getProgressForHabit,
    getProgressForDate,
    getProgressForHabitOnDate,
  };
}
