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
import { normalizeDate } from "@/lib/habit-utils";
import { HABIT_ICONS, HABIT_ICON_OPTIONS, HABIT_COLORS, HabitIconDisplay } from "@/lib/habit-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateHabitInput) => void;
  onCreateTag: (name: string, color?: string) => HabitTag;
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
  repeatWeekDay: 1, // Monday
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
  // Use a key to reset the form content when the editing habit changes
  const formKey = editingHabit?.id ?? "new";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {editingHabit ? "Edit Habit" : "Create New Habit"}
          </DialogTitle>
        </DialogHeader>

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
  onCreateTag: (name: string, color?: string) => HabitTag;
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

  // Compute initial form state based on editing habit
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

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      const tag = onCreateTag(newTagName.trim());
      toggleTag(tag.id);
      setNewTagName("");
    }
  };

  return (
    <ScrollArea className="max-h-[calc(90vh-120px)]">
      <form onSubmit={handleSubmit} className="space-y-6 pr-4">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g., Drink water"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Optional description"
            />
          </div>

          {/* Icon and Color */}
          <div className="space-y-2">
            <Label>Icon & Color</Label>
            <div className="flex items-center gap-2">
              {/* Icon Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-12 h-12 p-0"
                    style={{
                      backgroundColor: formData.color ? `${formData.color}15` : undefined,
                      color: formData.color || undefined,
                    }}
                  >
                    <HabitIconDisplay iconName={formData.icon} className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Choose an icon</Label>
                    <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                      {HABIT_ICON_OPTIONS.map((iconName) => {
                        const IconComponent = HABIT_ICONS[iconName];
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => updateField("icon", iconName)}
                            className={cn(
                              "w-7 h-7 rounded flex items-center justify-center transition-colors",
                              formData.icon === iconName
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                          >
                            <IconComponent className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Color Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: formData.color || "#94a3b8" }}
                      />
                      <span className="text-sm">
                        {formData.color || "Default color"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="start">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Choose a color</Label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {HABIT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updateField("color", color)}
                          className={cn(
                            "w-6 h-6 rounded-full transition-transform hover:scale-110",
                            formData.color === color && "ring-2 ring-offset-2 ring-primary"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    {formData.color && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => updateField("color", undefined)}
                      >
                        Clear color
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isGoodHabit">Habit type</Label>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm",
                  !formData.isGoodHabit && "text-destructive font-medium",
                )}
              >
                Bad
              </span>
              <Switch
                id="isGoodHabit"
                checked={formData.isGoodHabit}
                onCheckedChange={(checked) =>
                  updateField("isGoodHabit", checked)
                }
              />
              <span
                className={cn(
                  "text-sm",
                  formData.isGoodHabit && "text-green-600 font-medium",
                )}
              >
                Good
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Repeat Configuration */}
        <div className="space-y-4">
          <Label>Repeat Interval</Label>
          <Select
            value={formData.repeatType}
            onValueChange={(value) =>
              updateField("repeatType", value as RepeatType)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={RepeatType.DAILY}>Daily</SelectItem>
              <SelectItem value={RepeatType.WEEKLY}>Weekly</SelectItem>
              <SelectItem value={RepeatType.MONTHLY}>Monthly</SelectItem>
              <SelectItem value={RepeatType.CUSTOM}>Custom</SelectItem>
            </SelectContent>
          </Select>

          {/* Weekly options */}
          {formData.repeatType === RepeatType.WEEKLY && (
            <div className="space-y-2">
              <Label>Week starts on</Label>
              <Select
                value={String(formData.repeatWeekDay ?? 1)}
                onValueChange={(value) =>
                  updateField("repeatWeekDay", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_NAMES.map((name, index) => (
                    <SelectItem key={index} value={String(index)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Progress is tracked across the entire week. The habit will be
                visible every day.
              </p>
            </div>
          )}

          {/* Monthly options */}
          {formData.repeatType === RepeatType.MONTHLY && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Progress is tracked across the entire calendar month. The habit
                will be visible every day.
              </p>
            </div>
          )}

          {/* Custom options */}
          {formData.repeatType === RepeatType.CUSTOM && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Every X days</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.customIntervalDays ?? ""}
                  onChange={(e) =>
                    updateField(
                      "customIntervalDays",
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="e.g., 3"
                />
              </div>

              <div className="space-y-2">
                <Label>Specific days of week</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_NAMES.map((name, index) => (
                    <Badge
                      key={index}
                      variant={
                        formData.customDaysOfWeek?.includes(index)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleWeekDay(index)}
                    >
                      {name.slice(0, 3)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Completion Type */}
        <div className="space-y-4">
          <Label>Completion Type</Label>
          <Select
            value={formData.completionType}
            onValueChange={(value) =>
              updateField("completionType", value as CompletionType)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CompletionType.YES_NO}>
                Yes / No (simple check)
              </SelectItem>
              <SelectItem value={CompletionType.X_OCCURRENCES}>
                X occurrences (count-based)
              </SelectItem>
            </SelectContent>
          </Select>

          {formData.completionType === CompletionType.X_OCCURRENCES && (
            <div className="space-y-2">
              <Label>
                {formData.isGoodHabit ? "At least (target)" : "At most (limit)"}
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.targetOccurrences ?? ""}
                onChange={(e) =>
                  updateField(
                    "targetOccurrences",
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                placeholder="e.g., 8"
              />
              <p className="text-xs text-muted-foreground">
                {formData.isGoodHabit
                  ? "Complete when you reach this target"
                  : "Stay at or below this limit"}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Start Date */}
        <div className="space-y-2">
          <Label>Start Date</Label>
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
                  ? new Date(formData.startDate).toLocaleDateString()
                  : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  formData.startDate ? new Date(formData.startDate) : undefined
                }
                onSelect={(date) =>
                  updateField("startDate", date ? normalizeDate(date) : "")
                }
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Condition */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>End Condition</Label>
            <Switch
              checked={hasEndCondition}
              onCheckedChange={setHasEndCondition}
            />
          </div>

          {hasEndCondition && (
            <div className="space-y-4">
              <Select
                value={formData.endConditionType}
                onValueChange={(value) =>
                  updateField("endConditionType", value as EndConditionType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select end condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EndConditionType.DATE}>
                    End on specific date
                  </SelectItem>
                  <SelectItem value={EndConditionType.TOTAL_DAYS}>
                    After X completed days
                  </SelectItem>
                  <SelectItem value={EndConditionType.TOTAL_VALUE}>
                    After reaching total value
                  </SelectItem>
                  <SelectItem value={EndConditionType.STREAK}>
                    After X day streak
                  </SelectItem>
                </SelectContent>
              </Select>

              {formData.endConditionType === EndConditionType.DATE && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endConditionValue && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endConditionValue
                        ? new Date(
                            formData.endConditionValue,
                          ).toLocaleDateString()
                        : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        formData.endConditionValue
                          ? new Date(formData.endConditionValue)
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
                  <Input
                    type="number"
                    min={1}
                    value={formData.endConditionValue ?? ""}
                    onChange={(e) =>
                      updateField("endConditionValue", e.target.value)
                    }
                    placeholder={
                      formData.endConditionType === EndConditionType.TOTAL_DAYS
                        ? "Number of days"
                        : formData.endConditionType ===
                            EndConditionType.TOTAL_VALUE
                          ? "Total value"
                          : "Streak days"
                    }
                  />
                )}
            </div>
          )}
        </div>

        <Separator />

        {/* Tags */}
        <div className="space-y-4">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={
                  formData.tagIds?.includes(tag.id) ? "default" : "outline"
                }
                className="cursor-pointer"
                onClick={() => toggleTag(tag.id)}
                style={
                  tag.color && formData.tagIds?.includes(tag.id)
                    ? { backgroundColor: tag.color }
                    : tag.color
                      ? { borderColor: tag.color, color: tag.color }
                      : {}
                }
              >
                {tag.name}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name"
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

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!formData.name.trim()}>
            {editingHabit ? "Save Changes" : "Create Habit"}
          </Button>
        </DialogFooter>
      </form>
    </ScrollArea>
  );
}
