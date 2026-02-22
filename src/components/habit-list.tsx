"use client";

import { useState } from "react";
import { Habit, HabitTag, HabitProgressEvent } from "@/types/habit";
import { getHabitsForDate, normalizeDate } from "@/lib/habit-utils";
import { HabitCard } from "./habit-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, SlidersHorizontal, X, ListTodo } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface HabitListProps {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  selectedDate: Date;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onLogProgress: (habitId: string, value: number) => void;
  showAllHabits?: boolean;
}

export function HabitList({
  habits,
  tags,
  progressEvents,
  selectedDate,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
  onLogProgress,
  showAllHabits = false,
}: HabitListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showGoodHabits, setShowGoodHabits] = useState(true);
  const [showBadHabits, setShowBadHabits] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const dateStr = normalizeDate(selectedDate);

  // Filter habits
  let filteredHabits = showAllHabits
    ? habits
    : getHabitsForDate(habits, selectedDate);

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredHabits = filteredHabits.filter(
      (h) =>
        h.name.toLowerCase().includes(query) ||
        h.description?.toLowerCase().includes(query),
    );
  }

  // Apply tag filter
  if (selectedTags.length > 0) {
    filteredHabits = filteredHabits.filter((h) =>
      selectedTags.some((tagId) => h.tagIds.includes(tagId)),
    );
  }

  // Apply good/bad filter
  filteredHabits = filteredHabits.filter((h) => {
    if (h.isGoodHabit && !showGoodHabits) return false;
    if (!h.isGoodHabit && !showBadHabits) return false;
    return true;
  });

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setShowGoodHabits(true);
    setShowBadHabits(true);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const hasActiveFilters =
    selectedTags.length > 0 || !showGoodHabits || !showBadHabits || searchQuery;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold text-foreground">
            {showAllHabits ? "All Habits" : "Today"}
          </h2>
          <span className="text-xs text-muted-foreground">
            ({filteredHabits.length})
          </span>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-1.5 mb-3">
        {isSearchOpen ? (
          <div className="flex-1 relative animate-scale-in">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 rounded-lg border-border h-8 text-sm"
              autoFocus
            />
            <button
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-1"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs">Search...</span>
            </button>
          </>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                hasActiveFilters
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 rounded-xl" align="end">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-xs mb-2">Filter by type</h4>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      id="good"
                      checked={showGoodHabits}
                      onCheckedChange={(checked) =>
                        setShowGoodHabits(checked as boolean)
                      }
                      className="rounded"
                    />
                    <span className="text-xs">Good habits</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      id="bad"
                      checked={showBadHabits}
                      onCheckedChange={(checked) =>
                        setShowBadHabits(checked as boolean)
                      }
                      className="rounded"
                    />
                    <span className="text-xs">Habits to limit</span>
                  </label>
                </div>
              </div>

              {tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-xs mb-2">
                      Filter by tag
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-medium rounded transition-colors",
                            selectedTags.includes(tag.id)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground",
                          )}
                          style={
                            tag.color && selectedTags.includes(tag.id)
                              ? { backgroundColor: tag.color, color: "white" }
                              : {}
                          }
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {hasActiveFilters && (
                <>
                  <Separator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full rounded-lg h-7 text-xs"
                    onClick={clearFilters}
                  >
                    Clear all filters
                  </Button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Habit list */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-2 pb-2">
          {filteredHabits.length > 0 ? (
            filteredHabits.map((habit, index) => (
              <div
                key={habit.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.02}s` }}
              >
                <HabitCard
                  habit={habit}
                  tags={tags}
                  progressEvents={progressEvents}
                  date={dateStr}
                  onLogProgress={onLogProgress}
                  onEdit={onEditHabit}
                  onDelete={onDeleteHabit}
                />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              {habits.length === 0 ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-0.5">
                    No habits yet
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Create your first habit to get started
                  </p>
                  <Button onClick={onAddHabit} size="sm" className="rounded-lg">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create Habit
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-0.5">
                    No matches found
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Try adjusting your search or filters
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="rounded-lg"
                  >
                    Clear filters
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
