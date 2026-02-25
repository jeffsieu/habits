"use client";

import { useHabitsContext } from "@/contexts/habits-context";
import { MobileHabitsList } from "@/components/mobile-habits-list";

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
