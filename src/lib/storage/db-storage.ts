"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Habit,
  HabitTag,
  HabitProgressEvent,
  CreateHabitInput,
  UpdateHabitInput,
  CreateTagInput,
  LogProgressInput,
} from "@/types/habit";

// Helper to get authenticated user ID or throw
async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

// Transform Prisma model to app type
function transformHabit(dbHabit: {
  id: string;
  name: string;
  description: string | null;
  isGoodHabit: boolean;
  color: string | null;
  icon: string | null;
  repeatType: string;
  repeatWeekDay: number | null;
  repeatMonthDay: number | null;
  customIntervalDays: number | null;
  customDaysOfWeek: number[];
  completionType: string;
  targetOccurrences: number | null;
  startDate: Date;
  endConditionType: string | null;
  endConditionValue: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags?: { id: string }[];
}): Habit {
  return {
    id: dbHabit.id,
    name: dbHabit.name,
    description: dbHabit.description,
    isGoodHabit: dbHabit.isGoodHabit,
    color: dbHabit.color,
    icon: dbHabit.icon,
    repeatType: dbHabit.repeatType as Habit["repeatType"],
    repeatWeekDay: dbHabit.repeatWeekDay,
    repeatMonthDay: dbHabit.repeatMonthDay,
    customIntervalDays: dbHabit.customIntervalDays,
    customDaysOfWeek: dbHabit.customDaysOfWeek,
    completionType: dbHabit.completionType as Habit["completionType"],
    targetOccurrences: dbHabit.targetOccurrences,
    startDate: dbHabit.startDate.toISOString(),
    endConditionType: dbHabit.endConditionType as Habit["endConditionType"],
    endConditionValue: dbHabit.endConditionValue,
    createdAt: dbHabit.createdAt.toISOString(),
    updatedAt: dbHabit.updatedAt.toISOString(),
    tagIds: dbHabit.tags?.map((t) => t.id) ?? [],
  };
}

function transformTag(dbTag: {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}): HabitTag {
  return {
    id: dbTag.id,
    name: dbTag.name,
    color: dbTag.color,
    createdAt: dbTag.createdAt.toISOString(),
    updatedAt: dbTag.updatedAt.toISOString(),
  };
}

function transformProgress(dbProgress: {
  id: string;
  habitId: string;
  date: Date;
  value: number;
  note: string | null;
  createdAt: Date;
}): HabitProgressEvent {
  return {
    id: dbProgress.id,
    habitId: dbProgress.habitId,
    date: dbProgress.date.toISOString().split("T")[0],
    value: dbProgress.value,
    note: dbProgress.note,
    createdAt: dbProgress.createdAt.toISOString(),
  };
}

// ============ Habit Operations ============

export async function fetchHabits(): Promise<Habit[]> {
  const userId = await requireUserId();
  const habits = await prisma.habit.findMany({
    where: { userId },
    include: { tags: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });
  return habits.map(transformHabit);
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const userId = await requireUserId();
  const habit = await prisma.habit.create({
    data: {
      userId,
      name: input.name,
      description: input.description,
      isGoodHabit: input.isGoodHabit,
      color: input.color,
      icon: input.icon,
      repeatType: input.repeatType,
      repeatWeekDay: input.repeatWeekDay,
      repeatMonthDay: input.repeatMonthDay,
      customIntervalDays: input.customIntervalDays,
      customDaysOfWeek: input.customDaysOfWeek ?? [],
      completionType: input.completionType,
      targetOccurrences: input.targetOccurrences,
      startDate: new Date(input.startDate),
      endConditionType: input.endConditionType,
      endConditionValue: input.endConditionValue,
      tags: input.tagIds?.length
        ? { connect: input.tagIds.map((id) => ({ id })) }
        : undefined,
    },
    include: { tags: { select: { id: true } } },
  });
  return transformHabit(habit);
}

export async function updateHabitInDb(
  input: UpdateHabitInput,
): Promise<Habit | null> {
  const userId = await requireUserId();
  const { id, tagIds, ...updateData } = input;

  // Verify ownership
  const existing = await prisma.habit.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;

  const habit = await prisma.habit.update({
    where: { id },
    data: {
      ...updateData,
      startDate: updateData.startDate
        ? new Date(updateData.startDate)
        : undefined,
      tags: tagIds
        ? { set: tagIds.map((tagId) => ({ id: tagId })) }
        : undefined,
    },
    include: { tags: { select: { id: true } } },
  });
  return transformHabit(habit);
}

export async function deleteHabitFromDb(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.habit.deleteMany({
    where: { id, userId },
  });
}

// ============ Tag Operations ============

export async function fetchTags(): Promise<HabitTag[]> {
  const userId = await requireUserId();
  const tags = await prisma.habitTag.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return tags.map(transformTag);
}

export async function createTag(input: CreateTagInput): Promise<HabitTag> {
  const userId = await requireUserId();
  const tag = await prisma.habitTag.create({
    data: {
      userId,
      name: input.name,
      color: input.color,
    },
  });
  return transformTag(tag);
}

export async function updateTagInDb(
  id: string,
  input: Partial<CreateTagInput>,
): Promise<HabitTag | null> {
  const userId = await requireUserId();

  // Verify ownership
  const existing = await prisma.habitTag.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;

  const tag = await prisma.habitTag.update({
    where: { id },
    data: input,
  });
  return transformTag(tag);
}

export async function deleteTagFromDb(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.habitTag.deleteMany({
    where: { id, userId },
  });
}

// ============ Progress Operations ============

export async function fetchProgress(): Promise<HabitProgressEvent[]> {
  const userId = await requireUserId();
  const progress = await prisma.habitProgressEvent.findMany({
    where: { habit: { userId } },
    orderBy: { date: "desc" },
  });
  return progress.map(transformProgress);
}

export async function logProgressInDb(
  input: LogProgressInput,
): Promise<HabitProgressEvent> {
  const userId = await requireUserId();

  // Verify the habit belongs to this user
  const habit = await prisma.habit.findFirst({
    where: { id: input.habitId, userId },
  });
  if (!habit) {
    throw new Error("Habit not found");
  }

  const dateObj = new Date(input.date);
  dateObj.setUTCHours(0, 0, 0, 0);

  const progress = await prisma.habitProgressEvent.upsert({
    where: {
      habitId_date: {
        habitId: input.habitId,
        date: dateObj,
      },
    },
    create: {
      habitId: input.habitId,
      date: dateObj,
      value: input.value,
      note: input.note,
    },
    update: {
      value: input.value,
      note: input.note,
    },
  });
  return transformProgress(progress);
}

export async function deleteProgressFromDb(id: string): Promise<void> {
  const userId = await requireUserId();

  // Verify ownership through habit
  const progress = await prisma.habitProgressEvent.findFirst({
    where: { id, habit: { userId } },
  });
  if (!progress) return;

  await prisma.habitProgressEvent.delete({
    where: { id },
  });
}

// ============ Migration ============

export async function migrateLocalDataToDb(data: {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
}): Promise<void> {
  const userId = await requireUserId();

  // Check if user already has data (skip migration if so)
  const existingHabits = await prisma.habit.count({ where: { userId } });
  if (existingHabits > 0) {
    return; // User already has data, don't overwrite
  }

  // Create tags first (map old IDs to new IDs)
  const tagIdMap = new Map<string, string>();
  for (const tag of data.tags) {
    const newTag = await prisma.habitTag.create({
      data: {
        userId,
        name: tag.name,
        color: tag.color,
      },
    });
    tagIdMap.set(tag.id, newTag.id);
  }

  // Create habits with new tag IDs
  const habitIdMap = new Map<string, string>();
  for (const habit of data.habits) {
    const newTagIds = habit.tagIds
      .map((oldId) => tagIdMap.get(oldId))
      .filter((id): id is string => !!id);

    const newHabit = await prisma.habit.create({
      data: {
        userId,
        name: habit.name,
        description: habit.description,
        isGoodHabit: habit.isGoodHabit,
        color: habit.color,
        icon: habit.icon,
        repeatType: habit.repeatType,
        repeatWeekDay: habit.repeatWeekDay,
        repeatMonthDay: habit.repeatMonthDay,
        customIntervalDays: habit.customIntervalDays,
        customDaysOfWeek: habit.customDaysOfWeek,
        completionType: habit.completionType,
        targetOccurrences: habit.targetOccurrences,
        startDate: new Date(habit.startDate),
        endConditionType: habit.endConditionType,
        endConditionValue: habit.endConditionValue,
        tags: newTagIds.length
          ? { connect: newTagIds.map((id) => ({ id })) }
          : undefined,
      },
    });
    habitIdMap.set(habit.id, newHabit.id);
  }

  // Create progress events with new habit IDs
  for (const progress of data.progressEvents) {
    const newHabitId = habitIdMap.get(progress.habitId);
    if (!newHabitId) continue;

    const dateObj = new Date(progress.date);
    dateObj.setUTCHours(0, 0, 0, 0);

    await prisma.habitProgressEvent.create({
      data: {
        habitId: newHabitId,
        date: dateObj,
        value: progress.value,
        note: progress.note,
      },
    });
  }
}
