"use client";

import { useState } from "react";
import { useHabitsContext } from "@/contexts/habits-context";
import { CalendarView } from "@/components/calendar-view";
import { HabitList } from "@/components/habit-list";
import { HabitForm } from "@/components/habit-form";
import { DayDetailPanel } from "@/components/day-detail-panel";
import { Habit, CreateHabitInput } from "@/types/habit";
import {
  normalizeDate,
  formatDate,
  getHabitsForDate,
  isHabitCompleteOnDate,
} from "@/lib/habit-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ListTodo, Sparkles, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeContent() {
  const {
    habits,
    tags,
    progressEvents,
    addHabit,
    updateHabit,
    deleteHabit,
    addTag,
    logProgress,
  } = useHabitsContext();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const handleAddHabit = () => {
    setEditingHabit(null);
    setIsFormOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const handleDeleteHabit = (habitId: string) => {
    if (confirm("Are you sure you want to delete this habit?")) {
      deleteHabit(habitId);
    }
  };

  const handleFormSubmit = (input: CreateHabitInput) => {
    if (editingHabit) {
      updateHabit({ id: editingHabit.id, ...input });
    } else {
      addHabit(input);
    }
  };

  const handleLogProgress = (habitId: string, value: number) => {
    logProgress({
      habitId,
      date: normalizeDate(selectedDate),
      value,
    });
  };

  const handleCreateTag = (name: string, color?: string) => {
    return addTag({ name, color });
  };

  // Calculate today's stats
  const todayHabits = getHabitsForDate(habits, new Date());
  const todayCompleted = todayHabits.filter((h) =>
    isHabitCompleteOnDate(h, progressEvents, normalizeDate(new Date())),
  ).length;

  return (
    <div className="h-full">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative px-4 lg:px-6 py-4 lg:py-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            {/* Title area */}
            <div className="space-y-1 animate-fade-in">
              <p className="text-xs font-medium text-primary uppercase tracking-wider">
                {formatDate(new Date(), "long")}
              </p>
              <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                Your Habits
              </h1>
              <p className="text-sm text-muted-foreground max-w-md">
                {todayHabits.length === 0
                  ? "Add your first habit to get started"
                  : todayCompleted === todayHabits.length
                    ? "Amazing! All habits completed today"
                    : `${todayCompleted} of ${todayHabits.length} habits done today`}
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-3 animate-fade-in stagger-1">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-lg font-display font-semibold text-foreground">
                  {habits.length}
                </span>
                <span className="text-xs text-muted-foreground">habits</span>
              </div>
              <Button
                onClick={handleAddHabit}
                size="sm"
                className="rounded-xl shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="px-4 lg:px-6 py-4">
        {/* Desktop layout - Two columns with calendar hero */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4">
          {/* Calendar - Hero section */}
          <div className="lg:col-span-7 animate-slide-up">
            <div className="bg-card rounded-xl border border-border p-4">
              <CalendarView
                habits={habits}
                progressEvents={progressEvents}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
          </div>

          {/* Right sidebar - Day detail */}
          <div className="lg:col-span-5 space-y-4 animate-slide-up stagger-2">
            {/* Day detail panel */}
            <div className="bg-card rounded-xl border border-border p-4 min-h-80">
              <DayDetailPanel
                selectedDate={selectedDate}
                habits={habits}
                tags={tags}
                progressEvents={progressEvents}
                onLogProgress={handleLogProgress}
                onEditHabit={handleEditHabit}
                onDeleteHabit={handleDeleteHabit}
                onAddHabit={handleAddHabit}
              />
            </div>

            {/* All habits list */}
            <div className="bg-card rounded-xl border border-border p-4">
              <HabitList
                habits={habits}
                tags={tags}
                progressEvents={progressEvents}
                selectedDate={selectedDate}
                onAddHabit={handleAddHabit}
                onEditHabit={handleEditHabit}
                onDeleteHabit={handleDeleteHabit}
                onLogProgress={handleLogProgress}
                showAllHabits
              />
            </div>
          </div>
        </div>

        {/* Mobile/Tablet layout - Tabs */}
        <div className="lg:hidden animate-fade-in">
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 p-1 h-auto bg-muted/50 rounded-xl">
              <TabsTrigger
                value="today"
                className="rounded-lg py-2 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Today
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="rounded-lg py-2 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Calendar
              </TabsTrigger>
              <TabsTrigger
                value="habits"
                className="rounded-lg py-2 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <ListTodo className="w-3.5 h-3.5 mr-1.5" />
                All
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-0">
              <div className="bg-card rounded-xl border border-border p-4 min-h-[60vh]">
                <DayDetailPanel
                  selectedDate={selectedDate}
                  habits={habits}
                  tags={tags}
                  progressEvents={progressEvents}
                  onLogProgress={handleLogProgress}
                  onEditHabit={handleEditHabit}
                  onDeleteHabit={handleDeleteHabit}
                  onAddHabit={handleAddHabit}
                />
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
              <div className="bg-card rounded-xl border border-border p-4">
                <CalendarView
                  habits={habits}
                  progressEvents={progressEvents}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
              </div>
            </TabsContent>

            <TabsContent value="habits" className="mt-0">
              <div className="bg-card rounded-xl border border-border p-4 min-h-[60vh]">
                <HabitList
                  habits={habits}
                  tags={tags}
                  progressEvents={progressEvents}
                  selectedDate={selectedDate}
                  onAddHabit={handleAddHabit}
                  onEditHabit={handleEditHabit}
                  onDeleteHabit={handleDeleteHabit}
                  onLogProgress={handleLogProgress}
                  showAllHabits
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Habit Form Dialog */}
      <HabitForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        onCreateTag={handleCreateTag}
        tags={tags}
        editingHabit={editingHabit}
      />
    </div>
  );
}
