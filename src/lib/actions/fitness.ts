"use server";

import { db } from "@/lib/db";
import {
  workoutRoutines,
  exercises,
  routineExercises,
  workoutSessions,
  workoutSets,
} from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

export async function getFitnessData() {
  const allRoutines = await db.select().from(workoutRoutines).orderBy(desc(workoutRoutines.createdAt));
  const allExercises = await db.select().from(exercises).orderBy(asc(exercises.name));
  const allRoutineExercises = await db.select().from(routineExercises).orderBy(asc(routineExercises.order));
  const allSessions = await db.select().from(workoutSessions).orderBy(desc(workoutSessions.date), desc(workoutSessions.createdAt));
  const allSets = await db.select().from(workoutSets).orderBy(asc(workoutSets.setNumber));

  // Map sets to sessions
  const setsBySession = new Map<string, typeof allSets>();
  allSets.forEach((s) => {
    const list = setsBySession.get(s.sessionId) || [];
    list.push(s);
    setsBySession.set(s.sessionId, list);
  });

  // Map exercises to routines
  const exercisesByRoutine = new Map<string, string[]>();
  allRoutineExercises.forEach((re) => {
    const list = exercisesByRoutine.get(re.routineId) || [];
    list.push(re.exerciseId);
    exercisesByRoutine.set(re.routineId, list);
  });

  // History map for each exercise: map of exerciseId -> previous sets grouped by date
  const historyByExercise = new Map<string, { date: string; sets: typeof allSets }[]>();
  allSessions.forEach((sess) => {
    const sessSets = setsBySession.get(sess.id) || [];
    sessSets.forEach((st) => {
      const exHist = historyByExercise.get(st.exerciseId) || [];
      let dateEntry = exHist.find((e) => e.date === sess.date);
      if (!dateEntry) {
        dateEntry = { date: sess.date, sets: [] };
        exHist.push(dateEntry);
      }
      dateEntry.sets.push(st);
      historyByExercise.set(st.exerciseId, exHist);
    });
  });

  return {
    routines: allRoutines.map((r) => ({
      ...r,
      exerciseIds: exercisesByRoutine.get(r.id) || [],
    })),
    exercises: allExercises,
    sessions: allSessions.map((s) => ({
      ...s,
      sets: setsBySession.get(s.id) || [],
    })),
    historyByExercise: Object.fromEntries(historyByExercise),
  };
}

export async function createExerciseAction(data: {
  name: string;
  muscleGroup: "chest" | "back" | "shoulders" | "legs" | "arms" | "core" | "full_body";
  equipment: "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight";
  personalRecord?: string;
  notes?: string;
}) {
  const id = genId("ex");
  const now = new Date().toISOString();

  await db.insert(exercises).values({
    id,
    name: data.name.trim(),
    muscleGroup: data.muscleGroup,
    equipment: data.equipment,
    personalRecord: data.personalRecord?.trim() || null,
    notes: data.notes?.trim() || "",
    createdAt: now,
  });

  revalidatePath("/fitness");
  return { success: true, id };
}

export async function createRoutineAction(data: {
  name: string;
  description?: string;
  daysPerWeek?: number;
  targetMuscles?: string[];
  exerciseIds?: string[];
}) {
  const routineId = genId("routine");
  const now = new Date().toISOString();

  await db.insert(workoutRoutines).values({
    id: routineId,
    name: data.name.trim(),
    description: data.description?.trim() || "",
    daysPerWeek: data.daysPerWeek || 3,
    targetMuscles: JSON.stringify(data.targetMuscles || []),
    archived: false,
    createdAt: now,
  });

  if (data.exerciseIds && data.exerciseIds.length > 0) {
    for (let i = 0; i < data.exerciseIds.length; i++) {
      await db.insert(routineExercises).values({
        id: genId("re"),
        routineId,
        exerciseId: data.exerciseIds[i],
        order: i,
        targetSets: 3,
        targetReps: "8-12",
      });
    }
  }

  revalidatePath("/fitness");
  return { success: true, id: routineId };
}

export async function startWorkoutSessionAction(data: {
  routineId?: string | null;
  name?: string;
}) {
  const sessionId = genId("sess");
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().substring(0, 5);

  let sessionName = data.name || "Workout Session";
  if (data.routineId) {
    const routine = (
      await db
        .select()
        .from(workoutRoutines)
        .where(eq(workoutRoutines.id, data.routineId))
    )[0];
    if (routine) {
      sessionName = `${routine.name} Session`;
    }
  }

  await db.insert(workoutSessions).values({
    id: sessionId,
    routineId: data.routineId || null,
    name: sessionName,
    date: dateStr,
    startTime: timeStr,
    status: "in_progress",
    notes: "",
    createdAt: now.toISOString(),
  });

  // If started from routine, pre-populate default sets for each exercise in routine
  if (data.routineId) {
    const routineExs = await db
      .select()
      .from(routineExercises)
      .where(eq(routineExercises.routineId, data.routineId))
      .orderBy(asc(routineExercises.order));

    for (const re of routineExs) {
      for (let s = 1; s <= re.targetSets; s++) {
        await db.insert(workoutSets).values({
          id: genId("set"),
          sessionId,
          exerciseId: re.exerciseId,
          setNumber: s,
          reps: 0,
          weightKg: 0,
          isWarmup: s === 1,
          isPR: false,
          completed: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  revalidatePath("/fitness");
  revalidatePath("/");
  return { success: true, id: sessionId };
}

export async function logWorkoutSetAction(data: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe?: number | null;
  isWarmup?: boolean;
  isPR?: boolean;
  completed: boolean;
}) {
  const id = genId("set");
  const now = new Date().toISOString();

  await db.insert(workoutSets).values({
    id,
    sessionId: data.sessionId,
    exerciseId: data.exerciseId,
    setNumber: data.setNumber,
    reps: data.reps,
    weightKg: data.weightKg,
    rpe: data.rpe || null,
    isWarmup: data.isWarmup || false,
    isPR: data.isPR || false,
    completed: data.completed,
    createdAt: now,
  });

  // If marked as PR, update the exercise personalRecord field
  if (data.isPR && data.weightKg > 0 && data.reps > 0) {
    const prStr = `${data.weightKg}kg x ${data.reps} reps`;
    await db
      .update(exercises)
      .set({ personalRecord: prStr })
      .where(eq(exercises.id, data.exerciseId));
  }

  revalidatePath("/fitness");
  return { success: true, id };
}

export async function updateWorkoutSetAction(
  setId: string,
  data: {
    reps?: number;
    weightKg?: number;
    rpe?: number | null;
    isWarmup?: boolean;
    isPR?: boolean;
    completed?: boolean;
  }
) {
  await db.update(workoutSets).set(data).where(eq(workoutSets.id, setId));
  revalidatePath("/fitness");
  return { success: true };
}

export async function deleteWorkoutSetAction(setId: string) {
  await db.delete(workoutSets).where(eq(workoutSets.id, setId));
  revalidatePath("/fitness");
  return { success: true };
}

export async function finishWorkoutSessionAction(data: {
  sessionId: string;
  rating?: number;
  notes?: string;
}) {
  const now = new Date();
  const timeStr = now.toTimeString().substring(0, 5);

  await db
    .update(workoutSessions)
    .set({
      endTime: timeStr,
      status: "completed",
      rating: data.rating || 5,
      notes: data.notes?.trim() || "",
    })
    .where(eq(workoutSessions.id, data.sessionId));

  revalidatePath("/fitness");
  revalidatePath("/");
  return { success: true };
}

export async function deleteWorkoutSessionAction(sessionId: string) {
  await db.delete(workoutSessions).where(eq(workoutSessions.id, sessionId));
  revalidatePath("/fitness");
  revalidatePath("/");
  return { success: true };
}
