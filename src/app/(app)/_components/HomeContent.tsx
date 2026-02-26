"use client";

import { useState } from "react";
import { useHabitsContext } from "@/contexts/habits-context";
import { HabitGridView } from "./HabitGridView";
import { HabitListView } from "./HabitListView";
import { HabitForm } from "@/components/habits/HabitForm";
import { SyncPromptDialog } from "./SyncPromptDialog";
import { CreateHabitInput } from "@/types/habit";

export function HomeContent() {
  const {
    habits,
    tags,
    progressEvents,
    pendingLocalData,
    isSyncing,
    syncLocalData,
    dismissSync,
    addHabit,
    addTag,
    logProgress,
  } = useHabitsContext();

  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAddHabit = () => {
    setIsFormOpen(true);
  };

  const handleFormSubmit = (input: CreateHabitInput) => {
    addHabit(input);
  };

  const handleLogProgress = (habitId: string, date: string, value: number) => {
    logProgress({
      habitId,
      date,
      value,
    });
  };

  const handleCreateTag = (name: string, color?: string) => {
    return addTag({ name, color });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Mobile List View */}
      <div className="flex-1 md:hidden">
        <div className="h-full">
          <HabitListView
            habits={habits}
            tags={tags}
            progressEvents={progressEvents}
            onLogProgress={handleLogProgress}
            onAddHabit={handleAddHabit}
          />
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="flex-1 p-4 lg:p-6 hidden md:block">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <HabitGridView
            habits={habits}
            tags={tags}
            progressEvents={progressEvents}
            onLogProgress={handleLogProgress}
            onAddHabit={handleAddHabit}
          />
        </div>
      </div>

      {/* Habit Form Dialog */}
      <HabitForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        onCreateTag={handleCreateTag}
        tags={tags}
        editingHabit={null}
      />

      {/* Sync Prompt Dialog */}
      {pendingLocalData && (
        <SyncPromptDialog
          pendingData={pendingLocalData}
          isSyncing={isSyncing}
          onSync={syncLocalData}
          onDismiss={dismissSync}
        />
      )}
    </div>
  );
}
