"use client";

import { useEffect, useRef, useMemo } from "react";
import { normalizeDate, addDays } from "@/lib/habit-utils";
import { cn } from "@/lib/utils";

interface HorizontalDatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DAYS_TO_SHOW = 60; // Show 30 days before and after

export function HorizontalDatePicker({
  selectedDate,
  onDateSelect,
}: HorizontalDatePickerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayStr = normalizeDate(new Date());
  const selectedDateStr = normalizeDate(selectedDate);

  // Generate dates centered around today, not selected date
  // This keeps the date list stable so we can animate scroll to the selected date
  const dates = useMemo(() => {
    const today = new Date();
    const newDates: Date[] = [];
    const centerOffset = Math.floor(DAYS_TO_SHOW / 2);

    for (let i = -centerOffset; i <= centerOffset; i++) {
      newDates.push(addDays(today, i));
    }

    return newDates;
  }, []); // Empty dependency array means this is only calculated once on mount

  const isInitialScroll = useRef(true);

  // Auto-scroll to selected date
  useEffect(() => {
    if (scrollContainerRef.current && dates.length > 0) {
      const selectedIndex = dates.findIndex(
        (date) => normalizeDate(date) === selectedDateStr,
      );

      if (selectedIndex !== -1) {
        const container = scrollContainerRef.current;
        const selectedElement = container.children[
          selectedIndex
        ] as HTMLElement;

        if (selectedElement) {
          const containerWidth = container.offsetWidth;
          const elementLeft = selectedElement.offsetLeft;
          const elementWidth = selectedElement.offsetWidth;

          // Center the selected element
          const scrollPosition =
            elementLeft - containerWidth / 2 + elementWidth / 2;

          container.scrollTo({
            left: scrollPosition,
            behavior: isInitialScroll.current ? "instant" : "smooth",
          });

          isInitialScroll.current = false;
        }
      }
    }
  }, [dates, selectedDateStr]);

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const formatDayNumber = (date: Date) => {
    return date.getDate().toString();
  };

  return (
    <div className="sticky top-16 lg:top-0 bg-background/95 backdrop-blur-md border-b border-border/50 z-10">
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3"
      >
        {dates.map((date) => {
          const dateStr = normalizeDate(date);
          const isSelected = dateStr === selectedDateStr;
          const isToday = dateStr === todayStr;

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(date)}
              className={cn(
                "flex flex-col items-center justify-center min-w-13 h-15 rounded-2xl transition-all duration-200 shrink-0",
                "active:scale-95",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="text-xs font-medium mb-0.5">
                {formatDayName(date)}
              </span>
              <span
                className={cn(
                  "text-lg font-bold",
                  isToday && !isSelected && "text-primary",
                )}
              >
                {formatDayNumber(date)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
