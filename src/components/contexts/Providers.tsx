"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./ThemeProvider";
import { DatabaseProvider } from "./DatabaseProvider";
import { HabitsProvider } from "./HabitsProvider";
import { TodayProvider } from "./TodayProvider";
import { queryClient } from "@/lib/query-client";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
        <DatabaseProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TodayProvider>
              <HabitsProvider>{children}</HabitsProvider>
            </TodayProvider>
          </ThemeProvider>
        </DatabaseProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
