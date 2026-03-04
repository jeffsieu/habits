"use client";

import { useHabitsContext } from "@/components/contexts/HabitsProvider";
import { MobileHabitsList } from "./_components/MobileHabitsList";

export default function HabitsPage() {
  const { habits, tags, progressEvents, reorderHabits } = useHabitsContext();

  return (
    <div className="h-full">
      <MobileHabitsList
        habits={habits}
        tags={tags}
        progressEvents={progressEvents}
        onReorderHabits={reorderHabits}
      />
    </div>
  );
}
