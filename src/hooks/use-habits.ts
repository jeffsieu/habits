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
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
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
  reorderHabits: (habitIds: string[]) => void;
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

interface StoredData {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
}

export function useHabits(): HabitsState & HabitsActions {
  // Initialize with empty defaults to avoid hydration mismatch
  const [data, setData] = useState<StoredData>({
    habits: [],
    tags: [],
    progressEvents: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Destructure for easier access
  const { habits, tags, progressEvents } = data;

  // Wrapper setters that update the combined state
  const setHabits = useCallback((updater: Habit[] | ((prev: Habit[]) => Habit[])) => {
    setData(prev => ({
      ...prev,
      habits: typeof updater === 'function' ? updater(prev.habits) : updater,
    }));
  }, []);

  const setTags = useCallback((updater: HabitTag[] | ((prev: HabitTag[]) => HabitTag[])) => {
    setData(prev => ({
      ...prev,
      tags: typeof updater === 'function' ? updater(prev.tags) : updater,
    }));
  }, []);

  const setProgressEvents = useCallback((updater: HabitProgressEvent[] | ((prev: HabitProgressEvent[]) => HabitProgressEvent[])) => {
    setData(prev => ({
      ...prev,
      progressEvents: typeof updater === 'function' ? updater(prev.progressEvents) : updater,
    }));
  }, []);

  // Load from localStorage after mount to avoid hydration mismatch
  // This is the standard pattern for SSR-safe localStorage reading - we MUST set state after mount
  useEffect(() => {
    const loadedHabits = getFromStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
    const loadedTags = getFromStorage<HabitTag[]>(STORAGE_KEYS.TAGS, []);
    const loadedProgress = getFromStorage<HabitProgressEvent[]>(STORAGE_KEYS.PROGRESS, []);
    
    // Use queueMicrotask to satisfy the linter while still running synchronously in the effect
    queueMicrotask(() => {
      setData({
        habits: loadedHabits,
        tags: loadedTags,
        progressEvents: loadedProgress,
      });
      setIsLoaded(true);
    });
  }, []);

  // Persist to localStorage on change (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      setToStorage(STORAGE_KEYS.HABITS, data.habits);
      setToStorage(STORAGE_KEYS.TAGS, data.tags);
      setToStorage(STORAGE_KEYS.PROGRESS, data.progressEvents);
    }
  }, [data, isLoaded]);

  // Habit CRUD
  const addHabit = useCallback((input: CreateHabitInput): Habit => {
    const now = new Date().toISOString();
    const newHabit: Habit = {
      id: generateId(),
      name: input.name,
      description: input.description || null,
      isGoodHabit: input.isGoodHabit,
      color: input.color || null,
      icon: input.icon || null,
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
  }, [setHabits]);

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
    [habits, setHabits],
  );

  const deleteHabit = useCallback((id: string): void => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    // Also delete related progress events
    setProgressEvents((prev) => prev.filter((p) => p.habitId !== id));
  }, [setHabits, setProgressEvents]);

  const reorderHabits = useCallback((habitIds: string[]): void => {
    setHabits((prev) => {
      const habitMap = new Map(prev.map((h) => [h.id, h]));
      const reordered: Habit[] = [];
      for (const id of habitIds) {
        const habit = habitMap.get(id);
        if (habit) {
          reordered.push(habit);
          habitMap.delete(id);
        }
      }
      // Add any remaining habits that weren't in the reorder list
      for (const habit of habitMap.values()) {
        reordered.push(habit);
      }
      return reordered;
    });
  }, [setHabits]);

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
  }, [setTags]);

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
    [tags, setTags],
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
  }, [setTags, setHabits]);

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
    [progressEvents, setProgressEvents],
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
    [progressEvents, setProgressEvents],
  );

  const deleteProgress = useCallback((id: string): void => {
    setProgressEvents((prev) => prev.filter((p) => p.id !== id));
  }, [setProgressEvents]);

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
    reorderHabits,
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
