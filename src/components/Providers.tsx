"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DatabaseProvider } from "@/contexts/database-provider";
import { HabitsProvider } from "@/contexts/habits-context";
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
            <HabitsProvider>{children}</HabitsProvider>
          </ThemeProvider>
        </DatabaseProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
