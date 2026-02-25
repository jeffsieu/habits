"use client";

import { useQuery } from "@tanstack/react-query";
import { useDatabaseContext } from "@/contexts/database-provider";
import { queryKeys } from "@/lib/query-keys";
import { HabitWithTags } from "@/types/habit";

/**
 * Query hook to fetch all habits
 */
export function useHabits() {
  const { storage, storageType, isReady } = useDatabaseContext();

  return useQuery({
    queryKey: queryKeys.habits(storageType),
    queryFn: () => storage.fetchHabits(),
    enabled: isReady,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query hook to fetch a single habit by ID
 */
export function useHabit(id: string) {
  const { storage, storageType, isReady } = useDatabaseContext();

  return useQuery({
    queryKey: queryKeys.habit(storageType, id),
    queryFn: async () => {
      const habits = await storage.fetchHabits();
      return habits.find((h) => h.id === id) || null;
    },
    enabled: isReady && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query hook to fetch a habit with its tags
 */
export function useHabitWithTags(id: string) {
  const { storage, storageType, isReady } = useDatabaseContext();

  return useQuery({
    queryKey: queryKeys.habitWithTags(storageType, id),
    queryFn: async (): Promise<HabitWithTags | null> => {
      const [habits, tags] = await Promise.all([
        storage.fetchHabits(),
        storage.fetchTags(),
      ]);
      const habit = habits.find((h) => h.id === id);
      if (!habit) return null;

      return {
        ...habit,
        tags: tags.filter((t) => habit.tagIds.includes(t.id)),
      };
    },
    enabled: isReady && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
