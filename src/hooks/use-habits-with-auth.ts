"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
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
import {
  fetchHabits,
  fetchTags,
  fetchProgress,
  createHabit as createHabitDb,
  updateHabitInDb,
  deleteHabitFromDb,
  createTag as createTagDb,
  updateTagInDb,
  deleteTagFromDb,
  logProgressInDb,
  deleteProgressFromDb,
  migrateLocalDataToDb,
} from "@/lib/storage/db-storage";

const STORAGE_KEYS = {
  HABITS: "habits-app-habits",
  TAGS: "habits-app-tags",
  PROGRESS: "habits-app-progress",
  MIGRATED: "habits-app-migrated",
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

export interface PendingLocalData {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
}

export interface HabitsState {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  isLoaded: boolean;
  isAuthenticated: boolean;
  pendingLocalData: PendingLocalData | null;
  isSyncing: boolean;
}

export interface HabitsActions {
  syncLocalData: () => Promise<void>;
  dismissSync: () => void;
  addHabit: (input: CreateHabitInput) => Promise<Habit>;
  updateHabit: (input: UpdateHabitInput) => Promise<Habit | null>;
  deleteHabit: (id: string) => Promise<void>;
  reorderHabits: (habitIds: string[]) => void;
  getHabit: (id: string) => Habit | undefined;
  getHabitWithTags: (id: string) => HabitWithTags | undefined;
  addTag: (input: CreateTagInput) => Promise<HabitTag>;
  updateTag: (
    id: string,
    input: Partial<CreateTagInput>,
  ) => Promise<HabitTag | null>;
  deleteTag: (id: string) => Promise<void>;
  getTag: (id: string) => HabitTag | undefined;
  logProgress: (input: LogProgressInput) => Promise<HabitProgressEvent>;
  updateProgress: (
    id: string,
    input: Partial<LogProgressInput>,
  ) => Promise<HabitProgressEvent | null>;
  deleteProgress: (id: string) => Promise<void>;
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

export interface InitialData {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  isAuthenticated: boolean;
}

export function useHabitsWithAuth(
  initialData?: InitialData,
): HabitsState & HabitsActions {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isAuthLoading = status === "loading";

  // Use initialData if provided and authenticated via SSR
  const hasValidInitialData = Boolean(
    initialData?.isAuthenticated && initialData.habits !== undefined,
  );

  const [data, setData] = useState<StoredData>({
    habits: hasValidInitialData && initialData ? initialData.habits : [],
    tags: hasValidInitialData && initialData ? initialData.tags : [],
    progressEvents:
      hasValidInitialData && initialData ? initialData.progressEvents : [],
  });
  // If we have valid initial data from SSR, we're already loaded
  const [isLoaded, setIsLoaded] = useState(hasValidInitialData);
  const [pendingLocalData, setPendingLocalData] =
    useState<PendingLocalData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastAuthState = useRef<boolean | null>(
    hasValidInitialData ? true : null,
  );

  const { habits, tags, progressEvents } = data;

  // Wrapper setters
  const setHabits = useCallback(
    (updater: Habit[] | ((prev: Habit[]) => Habit[])) => {
      setData((prev) => ({
        ...prev,
        habits: typeof updater === "function" ? updater(prev.habits) : updater,
      }));
    },
    [],
  );

  const setTags = useCallback(
    (updater: HabitTag[] | ((prev: HabitTag[]) => HabitTag[])) => {
      setData((prev) => ({
        ...prev,
        tags: typeof updater === "function" ? updater(prev.tags) : updater,
      }));
    },
    [],
  );

  const setProgressEvents = useCallback(
    (
      updater:
        | HabitProgressEvent[]
        | ((prev: HabitProgressEvent[]) => HabitProgressEvent[]),
    ) => {
      setData((prev) => ({
        ...prev,
        progressEvents:
          typeof updater === "function"
            ? updater(prev.progressEvents)
            : updater,
      }));
    },
    [],
  );

  // Load data based on auth state
  useEffect(() => {
    if (isAuthLoading) return;

    const loadData = async () => {
      if (isAuthenticated) {
        // Check if we have local data that could be migrated
        const localHabits = getFromStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
        const localTags = getFromStorage<HabitTag[]>(STORAGE_KEYS.TAGS, []);
        const localProgress = getFromStorage<HabitProgressEvent[]>(
          STORAGE_KEYS.PROGRESS,
          [],
        );
        const alreadyMigrated = getFromStorage<boolean>(
          STORAGE_KEYS.MIGRATED,
          false,
        );

        // If we have local data and haven't migrated, set pending data for user prompt
        if (
          !alreadyMigrated &&
          (localHabits.length > 0 || localTags.length > 0)
        ) {
          setPendingLocalData({
            habits: localHabits,
            tags: localTags,
            progressEvents: localProgress,
          });
        }

        // Fetch from DB
        try {
          const [dbHabits, dbTags, dbProgress] = await Promise.all([
            fetchHabits(),
            fetchTags(),
            fetchProgress(),
          ]);
          setData({
            habits: dbHabits,
            tags: dbTags,
            progressEvents: dbProgress,
          });
        } catch (error) {
          console.error("Failed to fetch from DB:", error);
          // Fall back to localStorage
          setData({
            habits: localHabits,
            tags: localTags,
            progressEvents: localProgress,
          });
        }
      } else {
        // Load from localStorage
        const localHabits = getFromStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
        const localTags = getFromStorage<HabitTag[]>(STORAGE_KEYS.TAGS, []);
        const localProgress = getFromStorage<HabitProgressEvent[]>(
          STORAGE_KEYS.PROGRESS,
          [],
        );
        setData({
          habits: localHabits,
          tags: localTags,
          progressEvents: localProgress,
        });
        // Reset pending when logged out
        setPendingLocalData(null);
      }
      setIsLoaded(true);
    };

    // Only reload if auth state actually changed
    if (lastAuthState.current !== isAuthenticated) {
      lastAuthState.current = isAuthenticated;
      setIsLoaded(false);
      loadData();
    }
  }, [isAuthenticated, isAuthLoading]);

  // Persist to localStorage when not authenticated
  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      setToStorage(STORAGE_KEYS.HABITS, data.habits);
      setToStorage(STORAGE_KEYS.TAGS, data.tags);
      setToStorage(STORAGE_KEYS.PROGRESS, data.progressEvents);
    }
  }, [data, isLoaded, isAuthenticated]);

  // ============ Sync Functions ============

  const syncLocalData = useCallback(async (): Promise<void> => {
    if (!pendingLocalData || !isAuthenticated) return;

    setIsSyncing(true);
    try {
      await migrateLocalDataToDb(pendingLocalData);
      setToStorage(STORAGE_KEYS.MIGRATED, true);

      // Refetch from DB to get merged data
      const [dbHabits, dbTags, dbProgress] = await Promise.all([
        fetchHabits(),
        fetchTags(),
        fetchProgress(),
      ]);
      setData({
        habits: dbHabits,
        tags: dbTags,
        progressEvents: dbProgress,
      });
      setPendingLocalData(null);
    } catch (error) {
      console.error("Sync failed:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [pendingLocalData, isAuthenticated]);

  const dismissSync = useCallback((): void => {
    // Mark as migrated so we don't prompt again
    setToStorage(STORAGE_KEYS.MIGRATED, true);
    setPendingLocalData(null);
  }, []);

  // ============ Habit CRUD ============

  const addHabit = useCallback(
    async (input: CreateHabitInput): Promise<Habit> => {
      if (isAuthenticated) {
        const newHabit = await createHabitDb(input);
        setHabits((prev) => [...prev, newHabit]);
        return newHabit;
      } else {
        const now = new Date().toISOString();
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
          createdAt: now,
          updatedAt: now,
          tagIds: input.tagIds || [],
        };
        setHabits((prev) => [...prev, newHabit]);
        return newHabit;
      }
    },
    [isAuthenticated, setHabits],
  );

  const updateHabit = useCallback(
    async (input: UpdateHabitInput): Promise<Habit | null> => {
      if (isAuthenticated) {
        const updated = await updateHabitInDb(input);
        if (updated) {
          setHabits((prev) =>
            prev.map((h) => (h.id === updated.id ? updated : h)),
          );
        }
        return updated;
      } else {
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
      }
    },
    [isAuthenticated, habits, setHabits],
  );

  const deleteHabit = useCallback(
    async (id: string): Promise<void> => {
      if (isAuthenticated) {
        await deleteHabitFromDb(id);
      }
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setProgressEvents((prev) => prev.filter((p) => p.habitId !== id));
    },
    [isAuthenticated, setHabits, setProgressEvents],
  );

  const reorderHabits = useCallback(
    (habitIds: string[]): void => {
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
        for (const habit of habitMap.values()) {
          reordered.push(habit);
        }
        return reordered;
      });
    },
    [setHabits],
  );

  const getHabit = useCallback(
    (id: string): Habit | undefined => habits.find((h) => h.id === id),
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

  // ============ Tag CRUD ============

  const addTag = useCallback(
    async (input: CreateTagInput): Promise<HabitTag> => {
      if (isAuthenticated) {
        const newTag = await createTagDb(input);
        setTags((prev) => [...prev, newTag]);
        return newTag;
      } else {
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
      }
    },
    [isAuthenticated, setTags],
  );

  const updateTag = useCallback(
    async (
      id: string,
      input: Partial<CreateTagInput>,
    ): Promise<HabitTag | null> => {
      if (isAuthenticated) {
        const updated = await updateTagInDb(id, input);
        if (updated) {
          setTags((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t)),
          );
        }
        return updated;
      } else {
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
      }
    },
    [isAuthenticated, tags, setTags],
  );

  const deleteTag = useCallback(
    async (id: string): Promise<void> => {
      if (isAuthenticated) {
        await deleteTagFromDb(id);
      }
      setTags((prev) => prev.filter((t) => t.id !== id));
      setHabits((prev) =>
        prev.map((h) => ({
          ...h,
          tagIds: h.tagIds.filter((tagId) => tagId !== id),
          updatedAt: new Date().toISOString(),
        })),
      );
    },
    [isAuthenticated, setTags, setHabits],
  );

  const getTag = useCallback(
    (id: string): HabitTag | undefined => tags.find((t) => t.id === id),
    [tags],
  );

  // ============ Progress Operations ============

  const logProgress = useCallback(
    async (input: LogProgressInput): Promise<HabitProgressEvent> => {
      if (isAuthenticated) {
        const newProgress = await logProgressInDb(input);
        setProgressEvents((prev) => {
          const existingIndex = prev.findIndex(
            (p) => p.habitId === input.habitId && p.date === input.date,
          );
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newProgress;
            return updated;
          }
          return [...prev, newProgress];
        });
        return newProgress;
      } else {
        const existingIndex = progressEvents.findIndex(
          (p) => p.habitId === input.habitId && p.date === input.date,
        );

        const newProgress: HabitProgressEvent = {
          id:
            existingIndex >= 0
              ? progressEvents[existingIndex].id
              : generateId(),
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
          setProgressEvents((prev) => {
            const updated = [...prev];
            updated[existingIndex] = newProgress;
            return updated;
          });
        } else {
          setProgressEvents((prev) => [...prev, newProgress]);
        }

        return newProgress;
      }
    },
    [isAuthenticated, progressEvents, setProgressEvents],
  );

  const updateProgress = useCallback(
    async (
      id: string,
      input: Partial<LogProgressInput>,
    ): Promise<HabitProgressEvent | null> => {
      const existing = progressEvents.find((p) => p.id === id);
      if (!existing) return null;

      // For authenticated users, use logProgress which handles upsert
      if (
        isAuthenticated &&
        input.habitId &&
        input.date &&
        input.value !== undefined
      ) {
        return logProgress({
          habitId: input.habitId,
          date: input.date,
          value: input.value,
          note: input.note,
        });
      }

      // For local storage, update directly
      const updated: HabitProgressEvent = {
        ...existing,
        ...input,
      };

      setProgressEvents((prev) => prev.map((p) => (p.id === id ? updated : p)));

      return updated;
    },
    [isAuthenticated, progressEvents, setProgressEvents, logProgress],
  );

  const deleteProgress = useCallback(
    async (id: string): Promise<void> => {
      if (isAuthenticated) {
        await deleteProgressFromDb(id);
      }
      setProgressEvents((prev) => prev.filter((p) => p.id !== id));
    },
    [isAuthenticated, setProgressEvents],
  );

  const getProgressForHabit = useCallback(
    (habitId: string): HabitProgressEvent[] =>
      progressEvents.filter((p) => p.habitId === habitId),
    [progressEvents],
  );

  const getProgressForDate = useCallback(
    (date: string): HabitProgressEvent[] =>
      progressEvents.filter((p) => p.date === date),
    [progressEvents],
  );

  const getProgressForHabitOnDate = useCallback(
    (habitId: string, date: string): HabitProgressEvent | undefined =>
      progressEvents.find((p) => p.habitId === habitId && p.date === date),
    [progressEvents],
  );

  return {
    habits,
    tags,
    progressEvents,
    isLoaded,
    isAuthenticated,
    pendingLocalData,
    isSyncing,
    syncLocalData,
    dismissSync,
    addHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    getHabit,
    getHabitWithTags,
    addTag,
    updateTag,
    deleteTag,
    getTag,
    logProgress,
    updateProgress,
    deleteProgress,
    getProgressForHabit,
    getProgressForDate,
    getProgressForHabitOnDate,
  };
}
