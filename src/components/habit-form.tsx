"use client";

import { useState } from "react";
import {
  Habit,
  HabitTag,
  CreateHabitInput,
  RepeatType,
  CompletionType,
  EndConditionType,
  WEEKDAY_NAMES,
} from "@/types/habit";
import { normalizeDate, parseDate, formatDate } from "@/lib/habit-utils";
import {
  HABIT_ICONS,
  HABIT_ICON_OPTIONS,
  HABIT_COLORS,
  HabitIconDisplay,
} from "@/lib/habit-icons";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarIcon,
  Plus,
  ChevronDown,
  X,
  Repeat,
  Target,
  CalendarDays,
  Tag,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Check,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateHabitInput) => void;
  onCreateTag: (name: string, color?: string) => HabitTag | Promise<HabitTag>;
  tags: HabitTag[];
  editingHabit?: Habit | null;
}

const DEFAULT_FORM_STATE: CreateHabitInput = {
  name: "",
  description: "",
  isGoodHabit: true,
  color: undefined,
  icon: undefined,
  repeatType: RepeatType.DAILY,
  repeatWeekDay: 1,
  repeatMonthDay: 1,
  customIntervalDays: 1,
  customDaysOfWeek: [],
  completionType: CompletionType.YES_NO,
  targetOccurrences: 1,
  startDate: normalizeDate(new Date()),
  endConditionType: undefined,
  endConditionValue: undefined,
  tagIds: [],
};

export function HabitForm({
  open,
  onOpenChange,
  onSubmit,
  onCreateTag,
  tags,
  editingHabit,
}: HabitFormProps) {
  const formKey = editingHabit?.id ?? "new";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">
          {editingHabit ? "Edit Habit" : "Create New Habit"}
        </DialogTitle>
        <HabitFormContent
          key={formKey}
          onSubmit={onSubmit}
          onOpenChange={onOpenChange}
          onCreateTag={onCreateTag}
          tags={tags}
          editingHabit={editingHabit}
        />
      </DialogContent>
    </Dialog>
  );
}

interface HabitFormContentProps {
  onSubmit: (input: CreateHabitInput) => void;
  onOpenChange: (open: boolean) => void;
  onCreateTag: (name: string, color?: string) => HabitTag | Promise<HabitTag>;
  tags: HabitTag[];
  editingHabit?: Habit | null;
}

function HabitFormContent({
  onSubmit,
  onOpenChange,
  onCreateTag,
  tags,
  editingHabit,
}: HabitFormContentProps) {
  const [newTagName, setNewTagName] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const initialFormData: CreateHabitInput = editingHabit
    ? {
        name: editingHabit.name,
        description: editingHabit.description || "",
        isGoodHabit: editingHabit.isGoodHabit,
        color: editingHabit.color || undefined,
        icon: editingHabit.icon || undefined,
        repeatType: editingHabit.repeatType,
        repeatWeekDay: editingHabit.repeatWeekDay ?? 1,
        repeatMonthDay: editingHabit.repeatMonthDay ?? 1,
        customIntervalDays: editingHabit.customIntervalDays ?? 1,
        customDaysOfWeek: editingHabit.customDaysOfWeek || [],
        completionType: editingHabit.completionType,
        targetOccurrences: editingHabit.targetOccurrences ?? 1,
        startDate: editingHabit.startDate.split("T")[0],
        endConditionType: editingHabit.endConditionType || undefined,
        endConditionValue: editingHabit.endConditionValue || undefined,
        tagIds: editingHabit.tagIds || [],
      }
    : DEFAULT_FORM_STATE;

  const [formData, setFormData] = useState<CreateHabitInput>(initialFormData);
  const [hasEndCondition, setHasEndCondition] = useState(
    !!editingHabit?.endConditionType,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: CreateHabitInput = {
      ...formData,
      endConditionType: hasEndCondition ? formData.endConditionType : undefined,
      endConditionValue: hasEndCondition
        ? formData.endConditionValue
        : undefined,
    };
    onSubmit(submitData);
    onOpenChange(false);
  };

  const updateField = <K extends keyof CreateHabitInput>(
    field: K,
    value: CreateHabitInput[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleWeekDay = (day: number) => {
    const current = formData.customDaysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    updateField("customDaysOfWeek", updated);
  };

  const toggleTag = (tagId: string) => {
    const current = formData.tagIds || [];
    const updated = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    updateField("tagIds", updated);
  };

  const handleCreateTag = async () => {
    if (newTagName.trim()) {
      const tag = await onCreateTag(newTagName.trim());
      toggleTag(tag.id);
      setNewTagName("");
    }
  };

  const currentColor = formData.color || "#C26A4A";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* Hero Header - Icon & Color Picker */}
      <div
        className="relative px-6 pt-8 pb-6 transition-colors duration-300"
        style={{ backgroundColor: `${currentColor}15` }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center gap-4">
          {/* Large Icon Button */}
          <Popover open={showIconPicker} onOpenChange={setShowIconPicker}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg"
                style={{
                  backgroundColor: currentColor,
                  color: "white",
                }}
              >
                <HabitIconDisplay
                  iconName={formData.icon}
                  className="w-10 h-10"
                />
                {/* Edit indicator */}
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-sm">
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="center">
              <div className="space-y-4">
                {/* Colors */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Color
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateField("color", color)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all duration-150 hover:scale-110",
                          formData.color === color &&
                            "ring-2 ring-offset-2 ring-foreground",
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Icons */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Icon
                  </Label>
                  <ScrollArea className="h-40">
                    <div className="grid grid-cols-8 gap-1.5">
                      {HABIT_ICON_OPTIONS.map((iconName) => {
                        const IconComponent = HABIT_ICONS[iconName];
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => {
                              updateField("icon", iconName);
                              setShowIconPicker(false);
                            }}
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                              formData.icon === iconName
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted",
                            )}
                          >
                            <IconComponent className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Habit Name Input - Centered, minimal */}
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Habit name"
            className="w-full text-center text-xl font-display font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
            required
            autoFocus
          />

          {/* Good/Bad Toggle Pills */}
          <div className="flex items-center gap-2 p-1 rounded-full bg-background/50 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => updateField("isGoodHabit", true)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                formData.isGoodHabit
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Build
            </button>
            <button
              type="button"
              onClick={() => updateField("isGoodHabit", false)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                !formData.isGoodHabit
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              Break
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="max-h-[50vh]">
        <div className="px-6 py-5 space-y-5">
          {/* Frequency Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Repeat className="w-4 h-4" />
              Frequency
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: RepeatType.DAILY, label: "Daily" },
                { value: RepeatType.WEEKLY, label: "Weekly" },
                { value: RepeatType.MONTHLY, label: "Monthly" },
                { value: RepeatType.CUSTOM, label: "Custom" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("repeatType", option.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                    formData.repeatType === option.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Weekly specific options */}
            {formData.repeatType === RepeatType.WEEKLY && (
              <div className="pl-0.5 pt-2 space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Week starts on
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAY_NAMES.map((name, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => updateField("repeatWeekDay", index)}
                      className={cn(
                        "w-9 h-9 rounded-lg text-xs font-medium transition-colors",
                        formData.repeatWeekDay === index
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 hover:bg-muted text-muted-foreground",
                      )}
                    >
                      {name.slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom specific options */}
            {formData.repeatType === RepeatType.CUSTOM && (
              <div className="pl-0.5 pt-2 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Repeat every
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      className="w-20"
                      value={formData.customIntervalDays ?? ""}
                      onChange={(e) =>
                        updateField(
                          "customIntervalDays",
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Or specific days
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAY_NAMES.map((name, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleWeekDay(index)}
                        className={cn(
                          "w-9 h-9 rounded-lg text-xs font-medium transition-colors",
                          formData.customDaysOfWeek?.includes(index)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground",
                        )}
                      >
                        {name.slice(0, 2)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Goal Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Target className="w-4 h-4" />
              Goal
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  updateField("completionType", CompletionType.YES_NO)
                }
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  formData.completionType === CompletionType.YES_NO
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Check className="w-4 h-4 inline mr-1.5" />
                Yes / No
              </button>
              <button
                type="button"
                onClick={() =>
                  updateField("completionType", CompletionType.X_OCCURRENCES)
                }
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  formData.completionType === CompletionType.X_OCCURRENCES
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Sparkles className="w-4 h-4 inline mr-1.5" />
                Count
              </button>
            </div>

            {formData.completionType === CompletionType.X_OCCURRENCES && (
              <div className="pl-0.5 pt-2 space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {formData.isGoodHabit
                    ? "Target (at least)"
                    : "Limit (at most)"}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={formData.targetOccurrences ?? ""}
                    onChange={(e) =>
                      updateField(
                        "targetOccurrences",
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                  />
                  <span className="text-sm text-muted-foreground">times</span>
                </div>
              </div>
            )}
          </div>

          {/* Tags Section */}
          {tags.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Tag className="w-4 h-4" />
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border",
                      formData.tagIds?.includes(tag.id)
                        ? "border-transparent shadow-sm"
                        : "bg-transparent hover:bg-muted/50",
                    )}
                    style={
                      formData.tagIds?.includes(tag.id)
                        ? {
                            backgroundColor: tag.color || "var(--primary)",
                            color: "white",
                          }
                        : {
                            borderColor: tag.color || "var(--border)",
                            color: tag.color || "var(--muted-foreground)",
                          }
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Options Collapsible */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    advancedOpen && "rotate-180",
                  )}
                />
                Advanced options
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-5">
              {/* Start Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarDays className="w-4 h-4" />
                  Start Date
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate
                        ? parseDate(formData.startDate).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        formData.startDate
                          ? parseDate(formData.startDate)
                          : undefined
                      }
                      onSelect={(date) =>
                        updateField(
                          "startDate",
                          date ? normalizeDate(date) : "",
                        )
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Condition */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    End condition
                  </span>
                  <button
                    type="button"
                    onClick={() => setHasEndCondition(!hasEndCondition)}
                    className={cn(
                      "w-10 h-6 rounded-full transition-colors duration-200 relative",
                      hasEndCondition ? "bg-primary" : "bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                        hasEndCondition ? "left-5" : "left-1",
                      )}
                    />
                  </button>
                </div>

                {hasEndCondition && (
                  <div className="space-y-3 pl-0.5">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: EndConditionType.DATE, label: "Date" },
                        { value: EndConditionType.TOTAL_DAYS, label: "Days" },
                        { value: EndConditionType.STREAK, label: "Streak" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            updateField("endConditionType", option.value)
                          }
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                            formData.endConditionType === option.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {formData.endConditionType === EndConditionType.DATE && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.endConditionValue &&
                                "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.endConditionValue
                              ? parseDate(
                                  formData.endConditionValue as string,
                                ).toLocaleDateString()
                              : "Pick end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              formData.endConditionValue
                                ? parseDate(
                                    formData.endConditionValue as string,
                                  )
                                : undefined
                            }
                            onSelect={(date) =>
                              updateField(
                                "endConditionValue",
                                date ? normalizeDate(date) : undefined,
                              )
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    )}

                    {formData.endConditionType &&
                      formData.endConditionType !== EndConditionType.DATE && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            className="w-24"
                            value={formData.endConditionValue ?? ""}
                            onChange={(e) =>
                              updateField("endConditionValue", e.target.value)
                            }
                            placeholder="0"
                          />
                          <span className="text-sm text-muted-foreground">
                            {formData.endConditionType ===
                            EndConditionType.TOTAL_DAYS
                              ? "completed days"
                              : "day streak"}
                          </span>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Create New Tag */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Create new tag
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Tag name"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name.trim()} className="px-6">
          {editingHabit ? "Save" : "Create"}
        </Button>
      </div>
    </form>
  );
}
