import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const workoutRoutines = sqliteTable("workout_routines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g. "Upper Body Power", "Push A", "Legs & Core"
  description: text("description").notNull().default(""),
  daysPerWeek: integer("days_per_week").notNull().default(3),
  targetMuscles: text("target_muscles").notNull().default("[]"), // JSON string array
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g. "Barbell Bench Press"
  muscleGroup: text("muscle_group").notNull().default("chest"), // 'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'full_body'
  equipment: text("equipment").notNull().default("barbell"), // 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight'
  personalRecord: text("personal_record"), // e.g. "100kg x 5"
  notes: text("notes").notNull().default(""), // Cues: "Retract scapula, slight arch"
  createdAt: text("created_at").notNull(),
});

export const routineExercises = sqliteTable("routine_exercises", {
  id: text("id").primaryKey(),
  routineId: text("routine_id").notNull().references(() => workoutRoutines.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  targetSets: integer("target_sets").notNull().default(3),
  targetReps: text("target_reps").notNull().default("8-12"),
});

export const workoutSessions = sqliteTable("workout_sessions", {
  id: text("id").primaryKey(),
  routineId: text("routine_id").references(() => workoutRoutines.id, { onDelete: "set null" }),
  name: text("name").notNull(), // e.g. "Upper Body Power #24"
  date: text("date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  status: text("status").notNull().default("in_progress"), // 'in_progress' | 'completed'
  rating: integer("rating"), // 1-5 feeling rating
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const workoutSets = sqliteTable("workout_sets", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull().default(0),
  weightKg: real("weight_kg").notNull().default(0),
  rpe: real("rpe"), // Rate of Perceived Exertion (1-10)
  isWarmup: integer("is_warmup", { mode: "boolean" }).notNull().default(false),
  isPR: integer("is_pr", { mode: "boolean" }).notNull().default(false),
  completed: integer("completed", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export type WorkoutRoutine = typeof workoutRoutines.$inferSelect;
export type NewWorkoutRoutine = typeof workoutRoutines.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type RoutineExercise = typeof routineExercises.$inferSelect;
export type NewRoutineExercise = typeof routineExercises.$inferInsert;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type NewWorkoutSet = typeof workoutSets.$inferInsert;
