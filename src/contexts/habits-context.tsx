"use client";

import { createContext, useContext, ReactNode } from "react";
import {
  useHabitsWithAuth,
  HabitsState,
  HabitsActions,
  InitialData,
} from "@/hooks/use-habits-with-auth";

const HabitsContext = createContext<(HabitsState & HabitsActions) | null>(null);

interface HabitsProviderProps {
  children: ReactNode;
  initialData?: InitialData;
}

export function HabitsProvider({ children, initialData }: HabitsProviderProps) {
  const habitsState = useHabitsWithAuth(initialData);

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
