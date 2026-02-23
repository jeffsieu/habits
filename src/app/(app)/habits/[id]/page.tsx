"use client";

import { use } from "react";
import { HabitDetailContent } from "@/components/habit-detail-content";

interface HabitPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function HabitPage({ params }: HabitPageProps) {
  const { id } = use(params);

  return <HabitDetailContent habitId={id} />;
}
