import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { goals } from "./goals";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("active"), // 'planning' | 'active' | 'paused' | 'completed'
  priority: text("priority").notNull().default("medium"), // 'low' | 'medium' | 'high' | 'urgent'
  goalId: text("goal_id").references(() => goals.id, { onDelete: "set null" }),
  techStack: text("tech_stack").notNull().default("[]"), // JSON string array: ["Next.js", "Go", "SQLite"]
  repositoryUrl: text("repository_url"),
  startDate: text("start_date"),
  targetDate: text("target_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const sprints = sqliteTable("sprints", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  goal: text("goal").notNull().default(""),
  status: text("status").notNull().default("active"), // 'planned' | 'active' | 'completed'
  startDate: text("start_date"),
  endDate: text("end_date"),
  createdAt: text("created_at").notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  sprintId: text("sprint_id").references(() => sprints.id, { onDelete: "set null" }), // null means in backlog
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("todo"), // 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'
  priority: text("priority").notNull().default("medium"), // 'low' | 'medium' | 'high' | 'urgent'
  order: integer("order").notNull().default(0), // Board drag & drop sorting order
  dueDate: text("due_date"),
  estimateHours: real("estimate_hours"),
  isFocusToday: integer("is_focus_today", { mode: "boolean" }).notNull().default(false), // Direct link to Home/Today Focus
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const subtasks = sqliteTable("subtasks", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  order: integer("order").notNull().default(0),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Sprint = typeof sprints.$inferSelect;
export type NewSprint = typeof sprints.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Subtask = typeof subtasks.$inferSelect;
export type NewSubtask = typeof subtasks.$inferInsert;
