"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useDatabaseContext } from "@/contexts/database-provider";
import { useHabits } from "@/hooks/queries/use-habits-query";
import { useTags } from "@/hooks/queries/use-tags-query";
import { useProgress } from "@/hooks/queries/use-progress-query";
import {
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
} from "@/hooks/mutations/use-habit-mutations";
import { useReorderHabits } from "@/hooks/mutations/use-reorder-habits-mutation";
import {
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from "@/hooks/mutations/use-tag-mutations";
import {
  useLogProgress,
  useDeleteProgress,
} from "@/hooks/mutations/use-progress-mutations";
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
import { PendingLocalData } from "@/lib/storage/storage-adapter";

export interface HabitsState {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  isLoaded: boolean;
  isAuthenticated: boolean;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
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

const HabitsContext = createContext<(HabitsState & HabitsActions) | null>(null);

interface HabitsProviderProps {
  children: ReactNode;
}

export function HabitsProvider({ children }: HabitsProviderProps) {
  const { data: session, status } = useSession();
  const { isReady, pendingMigration, isSyncing, migrate, dismissMigration } =
    useDatabaseContext();

  // Queries
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const { data: progressEvents = [], isLoading: progressLoading } =
    useProgress();

  // Mutations
  const createHabitMutation = useCreateHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const reorderHabitsMutation = useReorderHabits();

  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  const logProgressMutation = useLogProgress();
  const deleteProgressMutation = useDeleteProgress();

  // Calculate loaded state
  const isLoaded =
    isReady && !habitsLoading && !tagsLoading && !progressLoading;

  // Build the context value
  const value = useMemo<HabitsState & HabitsActions>(() => {
    return {
      // State
      habits,
      tags,
      progressEvents,
      isLoaded,
      isAuthenticated: status === "authenticated",
      user: session?.user ?? null,
      pendingLocalData: pendingMigration,
      isSyncing,

      // Migration
      syncLocalData: migrate,
      dismissSync: dismissMigration,

      // Habit actions
      addHabit: async (input) => {
        const result = await createHabitMutation.mutateAsync(input);
        return result;
      },
      updateHabit: async (input) => {
        const result = await updateHabitMutation.mutateAsync(input);
        return result;
      },
      deleteHabit: async (id) => {
        await deleteHabitMutation.mutateAsync(id);
      },
      reorderHabits: (habitIds) => {
        reorderHabitsMutation.mutate(habitIds);
      },
      getHabit: (id) => habits.find((h) => h.id === id),
      getHabitWithTags: (id) => {
        const habit = habits.find((h) => h.id === id);
        if (!habit) return undefined;
        return {
          ...habit,
          tags: tags.filter((t) => habit.tagIds.includes(t.id)),
        };
      },

      // Tag actions
      addTag: async (input) => {
        const result = await createTagMutation.mutateAsync(input);
        return result;
      },
      updateTag: async (id, input) => {
        const result = await updateTagMutation.mutateAsync({ id, input });
        return result;
      },
      deleteTag: async (id) => {
        await deleteTagMutation.mutateAsync(id);
      },
      getTag: (id) => tags.find((t) => t.id === id),

      // Progress actions
      logProgress: async (input) => {
        // Handle -1 as deletion signal
        if (input.value === -1) {
          const existing = progressEvents.find(
            (p) => p.habitId === input.habitId && p.date === input.date,
          );
          if (existing) {
            await deleteProgressMutation.mutateAsync(existing.id);
            return existing;
          }
          // If no existing record, just return a dummy one (shouldn't happen)
          return {
            id: "",
            habitId: input.habitId,
            date: input.date,
            value: 0,
            note: null,
            createdAt: new Date().toISOString(),
          };
        }
        const result = await logProgressMutation.mutateAsync(input);
        return result;
      },
      updateProgress: async (id, input) => {
        // For updating progress, we use logProgress with the updated values
        const existing = progressEvents.find((p) => p.id === id);
        if (!existing) return null;
        if (
          input.habitId !== undefined &&
          input.date !== undefined &&
          input.value !== undefined
        ) {
          return logProgressMutation.mutateAsync({
            habitId: input.habitId,
            date: input.date,
            value: input.value,
            note: input.note,
          });
        }
        return null;
      },
      deleteProgress: async (id) => {
        await deleteProgressMutation.mutateAsync(id);
      },
      getProgressForHabit: (habitId) =>
        progressEvents.filter((p) => p.habitId === habitId),
      getProgressForDate: (date) =>
        progressEvents.filter((p) => p.date === date),
      getProgressForHabitOnDate: (habitId, date) =>
        progressEvents.find((p) => p.habitId === habitId && p.date === date),
    };
  }, [
    habits,
    tags,
    progressEvents,
    isLoaded,
    status,
    session,
    pendingMigration,
    isSyncing,
    migrate,
    dismissMigration,
    createHabitMutation,
    updateHabitMutation,
    deleteHabitMutation,
    reorderHabitsMutation,
    createTagMutation,
    updateTagMutation,
    deleteTagMutation,
    logProgressMutation,
    deleteProgressMutation,
  ]);

  return (
    <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
  );
}

export function useHabitsContext() {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error("useHabitsContext must be used within a HabitsProvider");
  }
  return context;
}
