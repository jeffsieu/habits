"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Habit, HabitProgressEvent, HabitTag } from "@/types/habit";
import { HabitIconDisplay } from "@/lib/habit-icons";
import { calculateCurrentStreak, isStreakSecure } from "@/lib/habit-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";
import {
  Home,
  Menu,
  Flame,
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Tag,
  GripVertical,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarAuth } from "@/components/sidebar-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
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

interface AppSidebarProps {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  onAddTag: (name: string, color?: string) => HabitTag | Promise<HabitTag>;
  onUpdateTag: (
    id: string,
    input: Partial<{ name: string; color?: string }>,
  ) => void | Promise<HabitTag | null>;
  onReorderHabits: (habitIds: string[]) => void;
}

interface SortableHabitItemProps {
  habit: Habit;
  progressEvents: HabitProgressEvent[];
  getStreakDisplay: (habit: Habit) => string;
  onLinkClick?: () => void;
}

function SortableHabitItem({
  habit,
  progressEvents,
  getStreakDisplay,
  onLinkClick,
}: SortableHabitItemProps) {
  const pathname = usePathname();
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

  const isActive = pathname === `/habits/${habit.id}`;
  const streak = getStreakDisplay(habit);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isDragging && "opacity-50 z-50",
      )}
    >
      <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
        {/* Habit Icon - fades out on hover */}
        <div
          className="absolute inset-0 rounded flex items-center justify-center transition-opacity group-hover:opacity-0"
          style={{
            backgroundColor: habit.color ? `${habit.color}15` : undefined,
            color: habit.color || undefined,
          }}
        >
          <HabitIconDisplay iconName={habit.icon} className="w-3.5 h-3.5" />
        </div>
        {/* Drag Handle - fades in on hover */}
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      <Link
        href={`/habits/${habit.id}`}
        onClick={onLinkClick}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <span className="truncate flex-1">{habit.name}</span>
        <div
          className={cn(
            "flex items-center gap-1 shrink-0",
            isStreakSecure(habit, progressEvents)
              ? "text-warning"
              : "text-muted-foreground",
          )}
        >
          <Flame className="w-3 h-3" />
          <span className="text-xs font-medium tabular-nums">{streak}</span>
        </div>
      </Link>
    </div>
  );
}

function SidebarContent({
  habits,
  tags,
  progressEvents,
  onAddTag,
  onUpdateTag,
  onReorderHabits,
  expandedTags,
  onToggleTag,
  onLinkClick,
}: {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  onAddTag: (name: string, color?: string) => HabitTag | Promise<HabitTag>;
  onUpdateTag: (
    id: string,
    input: Partial<{ name: string; color?: string }>,
  ) => void | Promise<HabitTag | null>;
  onReorderHabits: (habitIds: string[]) => void;
  expandedTags: Set<string>;
  onToggleTag: (tagId: string) => void;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const [isCreateTagDialogOpen, setIsCreateTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<HabitTag | null>(null);
  const [editTagName, setEditTagName] = useState("");

  const getHabitsForTag = (tagId: string) => {
    return habits.filter((habit) => habit.tagIds.includes(tagId));
  };

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      onAddTag(newTagName.trim());
      setNewTagName("");
      setIsCreateTagDialogOpen(false);
    }
  };

  const handleEditTag = (tag: HabitTag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
  };

  const handleSaveEditTag = () => {
    if (editingTag && editTagName.trim()) {
      onUpdateTag(editingTag.id, { name: editTagName.trim() });
      setEditingTag(null);
      setEditTagName("");
    }
  };

  const getStreakDisplay = (habit: Habit) => {
    const streak = calculateCurrentStreak(habit, progressEvents);
    return streak.toString();
  };

  const sensors = useSensors(
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

    if (over && active.id !== over.id) {
      const oldIndex = habits.findIndex((h) => h.id === active.id);
      const newIndex = habits.findIndex((h) => h.id === over.id);
      const reordered = arrayMove(habits, oldIndex, newIndex);
      onReorderHabits(reordered.map((h) => h.id));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="px-4 py-4 border-b border-border">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={onLinkClick}
        >
          <Image
            src="/icon.svg"
            alt="Habits"
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg"
          />
          <span className="font-display font-semibold text-lg">Habits</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4 [&>div>div]:block!">
        <nav className="space-y-1">
          {/* Home */}
          <Link
            href="/"
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>

          {/* Habits Section */}
          <div className="pt-4">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Habits
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={habits.map((h) => h.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0.5 mt-1">
                  {habits.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      No habits yet
                    </p>
                  ) : (
                    habits.map((habit) => (
                      <SortableHabitItem
                        key={habit.id}
                        habit={habit}
                        progressEvents={progressEvents}
                        getStreakDisplay={getStreakDisplay}
                        onLinkClick={onLinkClick}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Tags Section */}
          <div className="pt-4">
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tags
              </span>
              <button
                onClick={() => setIsCreateTagDialogOpen(true)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-0.5 mt-1">
              {tags.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No tags yet
                </p>
              ) : (
                tags.map((tag) => {
                  const isExpanded = expandedTags.has(tag.id);
                  const tagHabits = getHabitsForTag(tag.id);
                  return (
                    <Collapsible
                      key={tag.id}
                      open={isExpanded}
                      onOpenChange={() => onToggleTag(tag.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left group hover:bg-muted cursor-pointer">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: tag.color
                                ? `${tag.color}15`
                                : "var(--muted)",
                              color: tag.color || "var(--muted-foreground)",
                            }}
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate flex-1 text-muted-foreground group-hover:text-foreground">
                            {tag.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTag(tag);
                            }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/10 transition-opacity"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-6 space-y-0.5 py-1">
                          {tagHabits.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-muted-foreground italic">
                              No habits with this tag
                            </p>
                          ) : (
                            tagHabits.map((habit) => {
                              const isActive =
                                pathname === `/habits/${habit.id}`;
                              return (
                                <Link
                                  key={habit.id}
                                  href={`/habits/${habit.id}`}
                                  onClick={onLinkClick}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors",
                                    isActive
                                      ? "bg-primary/10 text-primary font-medium"
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                  )}
                                >
                                  <div
                                    className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                                    style={{
                                      backgroundColor: habit.color
                                        ? `${habit.color}15`
                                        : undefined,
                                      color: habit.color || undefined,
                                    }}
                                  >
                                    <HabitIconDisplay
                                      iconName={habit.icon}
                                      className="w-3 h-3"
                                    />
                                  </div>
                                  <span className="truncate">{habit.name}</span>
                                </Link>
                              );
                            })
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })
              )}
            </div>
          </div>
        </nav>
      </ScrollArea>
      <div className="p-2">
        <ThemeToggle />
      </div>

      {/* Auth Section */}
      <div className="border-t border-border p-2 space-y-2">
        <SidebarAuth />
      </div>

      {/* Create Tag Dialog */}
      <Dialog
        open={isCreateTagDialogOpen}
        onOpenChange={setIsCreateTagDialogOpen}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Create Tag</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateTag();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsCreateTagDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog
        open={!!editingTag}
        onOpenChange={(open) => !open && setEditingTag(null)}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editTagName}
              onChange={(e) => setEditTagName(e.target.value)}
              placeholder="Tag name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveEditTag();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingTag(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditTag} disabled={!editTagName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Desktop sidebar component
export function AppSidebar({
  habits,
  tags,
  progressEvents,
  onAddTag,
  onUpdateTag,
  onReorderHabits,
}: AppSidebarProps) {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  const handleToggleTag = (tagId: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:border-r lg:border-border lg:bg-card lg:sticky lg:top-0">
      <SidebarContent
        habits={habits}
        tags={tags}
        progressEvents={progressEvents}
        onAddTag={onAddTag}
        onUpdateTag={onUpdateTag}
        onReorderHabits={onReorderHabits}
        expandedTags={expandedTags}
        onToggleTag={handleToggleTag}
      />
    </aside>
  );
}

// Mobile sidebar trigger component
export function MobileSidebarTrigger({
  habits,
  tags,
  progressEvents,
  onAddTag,
  onUpdateTag,
  onReorderHabits,
}: AppSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  const handleToggleTag = (tagId: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SidebarContent
          habits={habits}
          tags={tags}
          progressEvents={progressEvents}
          onAddTag={onAddTag}
          onUpdateTag={onUpdateTag}
          onReorderHabits={onReorderHabits}
          expandedTags={expandedTags}
          onToggleTag={handleToggleTag}
          onLinkClick={() => setIsOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
