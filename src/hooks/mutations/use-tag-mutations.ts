"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabaseContext } from "@/contexts/database-provider";
import { queryKeys } from "@/lib/query-keys";
import { HabitTag, CreateTagInput, Habit } from "@/types/habit";

/**
 * Mutation hook to create a new tag
 */
export function useCreateTag() {
  const { storage, storageType } = useDatabaseContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTagInput) => storage.createTag(input),
    onMutate: async (newTag) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.tags(storageType),
      });

      const previousTags = queryClient.getQueryData<HabitTag[]>(
        queryKeys.tags(storageType),
      );

      // Optimistically add
      const now = new Date().toISOString();
      const optimisticTag: HabitTag = {
        id: `temp-${Date.now()}`,
        name: newTag.name,
        color: newTag.color || null,
        createdAt: now,
        updatedAt: now,
      };

      queryClient.setQueryData<HabitTag[]>(
        queryKeys.tags(storageType),
        (old) => [...(old || []), optimisticTag],
      );

      return { previousTags };
    },
    onError: (err, newTag, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(
          queryKeys.tags(storageType),
          context.previousTags,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tags(storageType),
      });
    },
  });
}

/**
 * Mutation hook to update a tag
 */
export function useUpdateTag() {
  const { storage, storageType } = useDatabaseContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateTagInput>;
    }) => storage.updateTag(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.tags(storageType),
      });

      const previousTags = queryClient.getQueryData<HabitTag[]>(
        queryKeys.tags(storageType),
      );

      // Optimistically update
      queryClient.setQueryData<HabitTag[]>(
        queryKeys.tags(storageType),
        (old) =>
          old?.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...input,
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ) || [],
      );

      // Also update individual tag query
      queryClient.setQueryData(
        queryKeys.tag(storageType, id),
        (old: HabitTag | null | undefined) =>
          old
            ? {
                ...old,
                ...input,
                updatedAt: new Date().toISOString(),
              }
            : null,
      );

      return { previousTags };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(
          queryKeys.tags(storageType),
          context.previousTags,
        );
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tags(storageType),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tag(storageType, id),
      });
      // Invalidate habits with tags
      queryClient.invalidateQueries({
        queryKey: queryKeys.habits(storageType),
      });
    },
  });
}

/**
 * Mutation hook to delete a tag
 */
export function useDeleteTag() {
  const { storage, storageType } = useDatabaseContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storage.deleteTag(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.tags(storageType),
      });

      const previousTags = queryClient.getQueryData<HabitTag[]>(
        queryKeys.tags(storageType),
      );

      // Optimistically remove
      queryClient.setQueryData<HabitTag[]>(
        queryKeys.tags(storageType),
        (old) => old?.filter((t) => t.id !== id) || [],
      );

      // Also optimistically remove from habits
      const previousHabits = queryClient.getQueryData<Habit[]>(
        queryKeys.habits(storageType),
      );

      queryClient.setQueryData<Habit[]>(
        queryKeys.habits(storageType),
        (old) =>
          old?.map((h) => ({
            ...h,
            tagIds: h.tagIds.filter((tagId) => tagId !== id),
            updatedAt: new Date().toISOString(),
          })) || [],
      );

      return { previousTags, previousHabits };
    },
    onError: (err, id, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(
          queryKeys.tags(storageType),
          context.previousTags,
        );
      }
      if (context?.previousHabits) {
        queryClient.setQueryData(
          queryKeys.habits(storageType),
          context.previousHabits,
        );
      }
    },
    onSettled: (data, error, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tags(storageType),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tag(storageType, id),
      });
      // Invalidate habits since tagIds changed
      queryClient.invalidateQueries({
        queryKey: queryKeys.habits(storageType),
      });
    },
  });
}
