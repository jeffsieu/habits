"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { HabitsProvider } from "@/contexts/habits-context";
import { InitialData } from "@/hooks/use-habits-with-auth";

interface ProvidersProps {
  children: ReactNode;
  initialHabitsData?: InitialData;
}

export function Providers({ children, initialHabitsData }: ProvidersProps) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <HabitsProvider initialData={initialHabitsData}>
          {children}
        </HabitsProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
