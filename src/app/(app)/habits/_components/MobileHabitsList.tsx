"use client";

import { useState, useMemo, startTransition } from "react";
import { Habit, HabitTag, HabitProgressEvent } from "@/types/habit";
import { calculateCurrentStreak } from "@/lib/habit-utils";
import { HabitIconDisplay } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";
import { Flame, GripVertical, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ViewTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  TouchSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MobileHabitsListProps {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  onReorderHabits: (habitIds: string[]) => void;
}

interface SortableHabitItemProps {
  habit: Habit;
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
}

function SortableHabitItem({
  habit,
  tags,
  progressEvents,
}: SortableHabitItemProps) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const streak = calculateCurrentStreak(habit, progressEvents);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("bg-card", isDragging && "opacity-50 z-50")}
    >
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 active:bg-accent/70 transition-colors">
        {/* Drag handle - always visible in reorder mode */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none p-1 animate-in fade-in duration-200"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Habit content */}
        <Link
          href={`/habits/${habit.id}`}
          className="flex items-center gap-4 flex-1 min-w-0"
          onClick={(e) => {
            e.preventDefault();
            startTransition(() => {
              router.push(`/habits/${habit.id}`);
            });
          }}
        >
          <div className="flex items-center flex-1 gap-4">
            {/* Icon */}
            <ViewTransition name={`habit-icon-${habit.id}`}>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: habit.color
                    ? `${habit.color}15`
                    : "hsl(var(--muted))",
                  color: habit.color || undefined,
                }}
              >
                <HabitIconDisplay iconName={habit.icon} className="w-5 h-5" />
              </div>
            </ViewTransition>
            {/* Name and tags */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{habit.name}</p>
              </div>
              {habit.tagIds.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {habit.tagIds.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <span
                        key={tagId}
                        className="text-xs px-1.5 py-0.5 rounded opacity-80"
                        style={{
                          backgroundColor: tag.color
                            ? `${tag.color}20`
                            : undefined,
                          color: tag.color || "currentColor",
                        }}
                      >
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {streak > 0 && (
            <div className="flex items-center text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full shrink-0">
              <Flame className="w-3.5 h-3.5 mr-1 fill-current" />
              {streak}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}

export function MobileHabitsList({
  habits,
  tags,
  progressEvents,
  onReorderHabits,
}: MobileHabitsListProps) {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [localHabits, setLocalHabits] = useState(habits);

  // Use prop habits when not reordering, local state when reordering
  const displayHabits = isReorderMode ? localHabits : habits;

  // Filter habits based on selected tag
  const filteredHabits = useMemo(() => {
    if (!selectedTagId) {
      return displayHabits;
    }
    return displayHabits.filter((habit) =>
      habit.tagIds.includes(selectedTagId),
    );
  }, [displayHabits, selectedTagId]);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Only allow reordering when showing all habits (no tag filter)
    if (over && active.id !== over.id && !selectedTagId) {
      const oldIndex = localHabits.findIndex((h) => h.id === active.id);
      const newIndex = localHabits.findIndex((h) => h.id === over.id);
      const reordered = arrayMove(localHabits, oldIndex, newIndex);

      // Update local state immediately for instant feedback
      setLocalHabits(reordered);

      // Then notify parent to persist the change
      onReorderHabits(reordered.map((h) => h.id));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tag chips and Reorder button */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border/50 px-6 py-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Habits</h2>
          {!selectedTagId && habits.length > 0 && (
            <button
              onClick={() => setIsReorderMode(!isReorderMode)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                isReorderMode
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <ArrowUpDown className="w-4 h-4" />
              {isReorderMode ? "Done" : "Reorder"}
            </button>
          )}
        </div>
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
          <button
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out",
              "border-2 active:scale-95",
              selectedTagId === null
                ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-background border-border hover:border-foreground/20 hover:bg-accent/50 text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setSelectedTagId(null)}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out",
                "border-2 active:scale-95",
                selectedTagId === tag.id
                  ? tag.color
                    ? "text-white shadow-sm"
                    : "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "bg-background hover:bg-accent/50",
              )}
              style={
                selectedTagId === tag.id && tag.color
                  ? {
                      backgroundColor: tag.color,
                      borderColor: tag.color,
                      boxShadow: `0 2px 8px ${tag.color}30`,
                    }
                  : selectedTagId !== tag.id && tag.color
                    ? {
                        borderColor: `${tag.color}40`,
                        color: tag.color,
                      }
                    : selectedTagId !== tag.id
                      ? { borderColor: "var(--border)" }
                      : undefined
              }
              onClick={() => setSelectedTagId(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Habits list */}
      <div className="flex-1 overflow-y-auto">
        {selectedTagId ? (
          // When filtering by tag, show static list (no reordering)
          <div className="divide-y divide-border">
            {filteredHabits.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground text-sm">
                  No habits to show
                </p>
              </div>
            ) : (
              filteredHabits.map((habit) => {
                const streak = calculateCurrentStreak(habit, progressEvents);
                return (
                  <Link
                    key={habit.id}
                    href={`/habits/${habit.id}`}
                    className="flex items-center gap-4 px-4 py-3 bg-card hover:bg-accent/50 active:bg-accent/70 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: habit.color
                          ? `${habit.color}15`
                          : "hsl(var(--muted))",
                        color: habit.color || undefined,
                      }}
                    >
                      <HabitIconDisplay
                        iconName={habit.icon}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {habit.name}
                        </p>
                      </div>
                      {habit.tagIds.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {habit.tagIds.map((tagId) => {
                            const tag = tags.find((t) => t.id === tagId);
                            if (!tag) return null;
                            return (
                              <span
                                key={tagId}
                                className="text-xs px-1.5 py-0.5 rounded opacity-80"
                                style={{
                                  backgroundColor: tag.color
                                    ? `${tag.color}20`
                                    : undefined,
                                  color: tag.color || "currentColor",
                                }}
                              >
                                {tag.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {streak > 0 && (
                      <div className="flex items-center text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full shrink-0">
                        <Flame className="w-3.5 h-3.5 mr-1 fill-current" />
                        {streak}
                      </div>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        ) : // When showing all habits, enable drag-and-drop reordering (only in reorder mode)
        isReorderMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {filteredHabits.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground text-sm">
                  No habits to show
                </p>
              </div>
            ) : (
              <SortableContext
                items={filteredHabits.map((h) => h.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  key={`reorder-${selectedTagId ?? "all"}`}
                  className="divide-y divide-border"
                >
                  {filteredHabits.map((habit) => (
                    <SortableHabitItem
                      key={habit.id}
                      habit={habit}
                      tags={tags}
                      progressEvents={progressEvents}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </DndContext>
        ) : (
          // Regular view without drag-and-drop
          <div className="divide-y divide-border">
            {filteredHabits.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground text-sm">
                  No habits to show
                </p>
              </div>
            ) : (
              filteredHabits.map((habit, index) => {
                const streak = calculateCurrentStreak(habit, progressEvents);
                return (
                  <div
                    key={habit.id}
                    className="bg-card opacity-0 animate-slide-up"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <Link
                      href={`/habits/${habit.id}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 active:bg-accent/70 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: habit.color
                            ? `${habit.color}15`
                            : "hsl(var(--muted))",
                          color: habit.color || undefined,
                        }}
                      >
                        <HabitIconDisplay
                          iconName={habit.icon}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {habit.name}
                          </p>
                        </div>
                        {habit.tagIds.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {habit.tagIds.map((tagId) => {
                              const tag = tags.find((t) => t.id === tagId);
                              if (!tag) return null;
                              return (
                                <span
                                  key={tagId}
                                  className="text-xs px-1.5 py-0.5 rounded opacity-80"
                                  style={{
                                    backgroundColor: tag.color
                                      ? `${tag.color}20`
                                      : undefined,
                                    color: tag.color || "currentColor",
                                  }}
                                >
                                  {tag.name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {streak > 0 && (
                        <div className="flex items-center text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full shrink-0">
                          <Flame className="w-3.5 h-3.5 mr-1 fill-current" />
                          {streak}
                        </div>
                      )}
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
