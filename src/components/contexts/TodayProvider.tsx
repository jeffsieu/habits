"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface TodayContextValue {
  today: Date;
}

const TodayContext = createContext<TodayContextValue | null>(null);

export function TodayProvider({ children }: { children: React.ReactNode }) {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    // Function to get the milliseconds until midnight
    const getMsUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight.getTime() - now.getTime();
    };

    // Function to update to the current date
    const updateToday = () => {
      setToday(new Date());
    };

    // Set up a timeout to update at midnight
    const scheduleNextUpdate = () => {
      const msUntilMidnight = getMsUntilMidnight();
      return setTimeout(() => {
        updateToday();
        // Schedule the next update after this one
        scheduleNextUpdate();
      }, msUntilMidnight);
    };

    const timeoutId = scheduleNextUpdate();

    // Also check every minute in case the device was asleep
    const intervalId = setInterval(() => {
      const currentDateStr = new Date().toDateString();
      const todayDateStr = today.toDateString();
      if (currentDateStr !== todayDateStr) {
        updateToday();
      }
    }, 60000); // Check every minute

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [today]);

  return (
    <TodayContext.Provider value={{ today }}>
      {children}
    </TodayContext.Provider>
  );
}

export function useToday() {
  const context = useContext(TodayContext);
  if (!context) {
    throw new Error("useToday must be used within a TodayProvider");
  }
  return context.today;
}
