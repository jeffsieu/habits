"use client";

import { createContext, useContext, ReactNode } from "react";
import { useHabits, HabitsState, HabitsActions } from "@/hooks/use-habits";

const HabitsContext = createContext<(HabitsState & HabitsActions) | null>(null);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const habitsState = useHabits();
  
  return (
    <HabitsContext.Provider value={habitsState}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabitsContext() {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error("useHabitsContext must be used within a HabitsProvider");
  }
  return context;
}
