"use client";

import { use } from "react";
import { AppLayout } from "@/components/app-layout";
import { HabitDetailContent } from "@/components/habit-detail-content";

interface HabitPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function HabitPage({ params }: HabitPageProps) {
  const { id } = use(params);
  
  return (
    <AppLayout>
      <HabitDetailContent habitId={id} />
    </AppLayout>
  );
}
