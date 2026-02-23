import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Habit, HabitTag, HabitProgressEvent } from "@/types/habit";

export interface ServerHabitsData {
  habits: Habit[];
  tags: HabitTag[];
  progressEvents: HabitProgressEvent[];
  isAuthenticated: boolean;
}

// Transform Prisma habit to app type
function transformHabit(dbHabit: {
  id: string;
  name: string;
  description: string | null;
  isGoodHabit: boolean;
  color: string | null;
  icon: string | null;
  recordingType: string;
  goalInterval: string;
  goalTarget: number | null;
  customIntervalDays: number | null;
  scheduledDaysOfWeek: number[];
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
    recordingType: dbHabit.recordingType as Habit["recordingType"],
    goalInterval: dbHabit.goalInterval as Habit["goalInterval"],
    goalTarget: dbHabit.goalTarget,
    customIntervalDays: dbHabit.customIntervalDays,
    scheduledDaysOfWeek: dbHabit.scheduledDaysOfWeek,
    startDate: dbHabit.startDate.toISOString().split("T")[0],
    endConditionType: dbHabit.endConditionType as Habit["endConditionType"],
    endConditionValue: dbHabit.endConditionValue,
    tagIds: dbHabit.tags?.map((t) => t.id) ?? [],
    createdAt: dbHabit.createdAt.toISOString(),
    updatedAt: dbHabit.updatedAt.toISOString(),
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

/**
 * Fetch all habits data on the server for SSR.
 * Returns empty data if not authenticated (will be loaded client-side from localStorage).
 */
export async function getServerHabitsData(): Promise<ServerHabitsData> {
  const session = await auth();

  if (!session?.user?.id) {
    // Not authenticated - return empty, client will load from localStorage
    return {
      habits: [],
      tags: [],
      progressEvents: [],
      isAuthenticated: false,
    };
  }

  const userId = session.user.id;

  try {
    const [dbHabits, dbTags, dbProgress] = await Promise.all([
      prisma.habit.findMany({
        where: { userId },
        include: { tags: { select: { id: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.habitTag.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.habitProgressEvent.findMany({
        where: { habit: { userId } },
        orderBy: { date: "desc" },
      }),
    ]);

    return {
      habits: dbHabits.map(transformHabit),
      tags: dbTags.map(transformTag),
      progressEvents: dbProgress.map(transformProgress),
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("Failed to fetch habits data on server:", error);
    return {
      habits: [],
      tags: [],
      progressEvents: [],
      isAuthenticated: true, // Still authenticated, just failed to fetch
    };
  }
}
