"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabaseContext } from "@/contexts/database-provider";
import { queryKeys } from "@/lib/query-keys";
import { Habit, CreateHabitInput, UpdateHabitInput } from "@/types/habit";

/**
 * Mutation hook to create a new habit
 */
export function useCreateHabit() {
  const { storage, storageType } = useDatabaseContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHabitInput) => storage.createHabit(input),
    onMutate: async (newHabit) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.habits(storageType),
      });

      // Snapshot previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(
        queryKeys.habits(storageType),
      );

      // Optimistically update
      const now = new Date().toISOString();
      const optimisticHabit: Habit = {
        id: `temp-${Date.now()}`,
        name: newHabit.name,
        description: newHabit.description || null,
        isGoodHabit: newHabit.isGoodHabit,
        color: newHabit.color || null,
        icon: newHabit.icon || null,
        recordingType: newHabit.recordingType,
        goalInterval: newHabit.goalInterval,
        goalTarget: newHabit.goalTarget ?? null,
        customIntervalDays: newHabit.customIntervalDays ?? null,
        scheduledDaysOfWeek: newHabit.scheduledDaysOfWeek || [],
        startDate: newHabit.startDate,
        endConditionType: newHabit.endConditionType || null,
        endConditionValue: newHabit.endConditionValue || null,
        order: 0, // Temporary order, will be set by server
        createdAt: now,
        updatedAt: now,
        tagIds: newHabit.tagIds || [],
      };

      queryClient.setQueryData<Habit[]>(
        queryKeys.habits(storageType),
        (old) => [...(old || []), optimisticHabit],
      );

      return { previousHabits };
    },
    onError: (err, newHabit, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(
          queryKeys.habits(storageType),
          context.previousHabits,
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.habits(storageType),
      });
    },
  });
}

/**
 * Mutation hook to update a habit
 */
export function useUpdateHabit() {
  const { storage, storageType } = useDatabaseContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateHabitInput) => storage.updateHabit(input),
    onMutate: async (updatedHabit) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.habits(storageType),
      });

      const previousHabits = queryClient.getQueryData<Habit[]>(
        queryKeys.habits(storageType),
      );

      // Optimistically update
      queryClient.setQueryData<Habit[]>(
        queryKeys.habits(storageType),
        (old) =>
          old?.map((h) =>
            h.id === updatedHabit.id
              ? {
                  ...h,
                  ...updatedHabit,
                  updatedAt: new Date().toISOString(),
                }
              : h,
          ) || [],
      );

      // Also update individual habit query
      queryClient.setQueryData(
        queryKeys.habit(storageType, updatedHabit.id),
        (old: Habit | null | undefined) =>
          old
            ? {
                ...old,
                ...updatedHabit,
                updatedAt: new Date().toISOString(),
              }
            : null,
      );

      return { previousHabits };
    },
    onError: (err, updatedHabit, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(
          queryKeys.habits(storageType),
          context.previousHabits,
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.habits(storageType),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.habit(storageType, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.habitWithTags(storageType, variables.id),
      });
    },
  });
}

/**
 * Mutation hook to delete a habit
 */
export function useDeleteHabit() {
  const { storage, storageType } = useDatabaseContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storage.deleteHabit(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.habits(storageType),
      });

      const previousHabits = queryClient.getQueryData<Habit[]>(
        queryKeys.habits(storageType),
      );

      // Optimistically remove
      queryClient.setQueryData<Habit[]>(
        queryKeys.habits(storageType),
        (old) => old?.filter((h) => h.id !== id) || [],
      );

      return { previousHabits };
    },
    onError: (err, id, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(
          queryKeys.habits(storageType),
          context.previousHabits,
        );
      }
    },
    onSettled: (data, error, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.habits(storageType),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.habit(storageType, id),
      });
      // Also invalidate progress for this habit
      queryClient.invalidateQueries({
        queryKey: queryKeys.progressForHabit(storageType, id),
      });
    },
  });
}
