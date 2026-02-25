"use client";

import { useQuery } from "@tanstack/react-query";
import { useDatabaseContext } from "@/contexts/database-provider";
import { queryKeys } from "@/lib/query-keys";

/**
 * Query hook to fetch all progress events
 */
export function useProgress() {
  const { storage, storageType, isReady } = useDatabaseContext();

  return useQuery({
    queryKey: queryKeys.progress(storageType),
    queryFn: () => storage.fetchProgress(),
    enabled: isReady,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query hook to fetch progress for a specific habit
 */
export function useProgressForHabit(habitId: string) {
  const { storage, storageType, isReady } = useDatabaseContext();

  return useQuery({
    queryKey: queryKeys.progressForHabit(storageType, habitId),
    queryFn: async () => {
      const progress = await storage.fetchProgress();
      return progress.filter((p) => p.habitId === habitId);
    },
    enabled: isReady && !!habitId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query hook to fetch progress for a specific date
 */
export function useProgressForDate(date: string) {
  const { storage, storageType, isReady } = useDatabaseContext();

  return useQuery({
    queryKey: queryKeys.progressForDate(storageType, date),
    queryFn: async () => {
      const progress = await storage.fetchProgress();
      return progress.filter((p) => p.date === date);
    },
    enabled: isReady && !!date,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query hook to fetch progress for a specific habit on a specific date
 */
export function useProgressForHabitOnDate(habitId: string, date: string) {
  const { storage, storageType, isReady } = useDatabaseContext();

  return useQuery({
    queryKey: queryKeys.progressForHabitOnDate(storageType, habitId, date),
    queryFn: async () => {
      const progress = await storage.fetchProgress();
      return (
        progress.find((p) => p.habitId === habitId && p.date === date) || null
      );
    },
    enabled: isReady && !!habitId && !!date,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
