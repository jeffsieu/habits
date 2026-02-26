"use client";

import { use } from "react";
import { HabitDetailContent } from "./_components/HabitDetailContent";

interface HabitPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function HabitPage({ params }: HabitPageProps) {
  const { id } = use(params);

  return <HabitDetailContent habitId={id} />;
}
