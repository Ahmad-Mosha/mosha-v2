import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("engineering"), // 'engineering' | 'career' | 'fitness' | 'financial' | 'personal'
  icon: text("icon").notNull().default("🎯"),
  status: text("status").notNull().default("active"), // 'active' | 'completed' | 'on_hold'
  targetYearOrDate: text("target_date"),
  visionStatement: text("vision_statement").notNull().default(""), // Emotional anchor and reason why
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const goalMilestones = sqliteTable("goal_milestones", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetDate: text("target_date"),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  completedAt: text("completed_at"),
  order: integer("order").notNull().default(0),
});

export const goalReflections = sqliteTable("goal_reflections", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type GoalMilestone = typeof goalMilestones.$inferSelect;
export type NewGoalMilestone = typeof goalMilestones.$inferInsert;
export type GoalReflection = typeof goalReflections.$inferSelect;
export type NewGoalReflection = typeof goalReflections.$inferInsert;
