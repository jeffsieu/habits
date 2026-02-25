"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabaseContext } from "@/contexts/database-provider";
import { queryKeys } from "@/lib/query-keys";
import { HabitProgressEvent, LogProgressInput } from "@/types/habit";

/**
 * Mutation hook to log progress (create or update)
 */
export function useLogProgress() {
  const { storage, storageType } = useDatabaseContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LogProgressInput) => storage.logProgress(input),
    onMutate: async (input) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.progress(storageType),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.progressForHabit(storageType, input.habitId),
      });

      const previousProgress = queryClient.getQueryData<HabitProgressEvent[]>(
        queryKeys.progress(storageType),
      );

      // Create optimistic progress
      const now = new Date().toISOString();
      const existingProgress = previousProgress?.find(
        (p) => p.habitId === input.habitId && p.date === input.date,
      );

      const optimisticProgress: HabitProgressEvent = {
        id: existingProgress?.id ?? `temp-${Date.now()}`,
        habitId: input.habitId,
        date: input.date,
        value: input.value,
        note: input.note || null,
        createdAt: existingProgress?.createdAt ?? now,
      };

      // Optimistically update progress list
      queryClient.setQueryData<HabitProgressEvent[]>(
        queryKeys.progress(storageType),
        (old) => {
          if (!old) return [optimisticProgress];
          const existingIndex = old.findIndex(
            (p) => p.habitId === input.habitId && p.date === input.date,
          );
          if (existingIndex >= 0) {
            const updated = [...old];
            updated[existingIndex] = optimisticProgress;
            return updated;
          }
          return [...old, optimisticProgress];
        },
      );

      // Update habit-specific progress
      queryClient.setQueryData<HabitProgressEvent[]>(
        queryKeys.progressForHabit(storageType, input.habitId),
        (old) => {
          if (!old) return [optimisticProgress];
          const existingIndex = old.findIndex((p) => p.date === input.date);
          if (existingIndex >= 0) {
            const updated = [...old];
            updated[existingIndex] = optimisticProgress;
            return updated;
          }
          return [...old, optimisticProgress];
        },
      );

      return { previousProgress };
    },
    onError: (err, input, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(
          queryKeys.progress(storageType),
          context.previousProgress,
        );
      }
    },
    onSettled: (data, error, input) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.progress(storageType),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.progressForHabit(storageType, input.habitId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.progressForDate(storageType, input.date),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.progressForHabitOnDate(
          storageType,
          input.habitId,
          input.date,
        ),
      });
    },
  });
}

/**
 * Mutation hook to delete progress
 */
export function useDeleteProgress() {
  const { storage, storageType } = useDatabaseContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storage.deleteProgress(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.progress(storageType),
      });

      const previousProgress = queryClient.getQueryData<HabitProgressEvent[]>(
        queryKeys.progress(storageType),
      );

      // Find the progress to delete for invalidation later
      const deletedProgress = previousProgress?.find((p) => p.id === id);

      // Optimistically remove
      queryClient.setQueryData<HabitProgressEvent[]>(
        queryKeys.progress(storageType),
        (old) => old?.filter((p) => p.id !== id) || [],
      );

      // Also remove from habit-specific query if we know the habit
      if (deletedProgress) {
        queryClient.setQueryData<HabitProgressEvent[]>(
          queryKeys.progressForHabit(storageType, deletedProgress.habitId),
          (old) => old?.filter((p) => p.id !== id) || [],
        );
      }

      return { previousProgress, deletedProgress };
    },
    onError: (err, id, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(
          queryKeys.progress(storageType),
          context.previousProgress,
        );
      }
    },
    onSettled: (data, error, id, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.progress(storageType),
      });
      if (context?.deletedProgress) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.progressForHabit(
            storageType,
            context.deletedProgress.habitId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.progressForDate(
            storageType,
            context.deletedProgress.date,
          ),
        });
      }
    },
  });
}
