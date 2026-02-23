"use client";

import { createContext, useContext, ReactNode } from "react";
import {
  useHabitsWithAuth,
  HabitsState,
  HabitsActions,
} from "@/hooks/use-habits-with-auth";

const HabitsContext = createContext<(HabitsState & HabitsActions) | null>(null);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const habitsState = useHabitsWithAuth();

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
