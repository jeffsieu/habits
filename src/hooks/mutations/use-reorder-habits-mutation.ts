import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Habit } from "@/types/habit";
import { useDatabaseContext } from "@/contexts/database-provider";
import { queryKeys } from "@/lib/query-keys";

/**
 * Mutation hook to reorder habits
 */
export function useReorderHabits() {
  const { storage, storageType } = useDatabaseContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habitIds: string[]) => storage.reorderHabits(habitIds),
    onMutate: async (habitIds: string[]) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.habits(storageType),
      });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(
        queryKeys.habits(storageType),
      );

      // Optimistically update to the new order
      queryClient.setQueryData<Habit[]>(
        queryKeys.habits(storageType),
        (old) => {
          if (!old) return old;

          // Create a map of habits by ID for quick lookup
          const habitMap = new Map(old.map((h) => [h.id, h]));

          // Reorder habits according to habitIds array
          const reordered = habitIds
            .map((id, index) => {
              const habit = habitMap.get(id);
              if (!habit) return null;
              return {
                ...habit,
                order: index,
                updatedAt: new Date().toISOString(),
              };
            })
            .filter((h): h is Habit => h !== null);

          // Include any habits not in the habitIds array at the end
          const includedIds = new Set(habitIds);
          const remaining = old
            .filter((h) => !includedIds.has(h.id))
            .map((h, index) => ({
              ...h,
              order: reordered.length + index,
            }));

          return [...reordered, ...remaining];
        },
      );

      return { previousHabits };
    },
    onError: (err, habitIds, context) => {
      // If mutation fails, rollback to the previous value
      if (context?.previousHabits) {
        queryClient.setQueryData(
          queryKeys.habits(storageType),
          context.previousHabits,
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.habits(storageType),
      });
    },
  });
}
