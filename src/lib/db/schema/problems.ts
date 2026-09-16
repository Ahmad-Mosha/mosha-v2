import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const problems = sqliteTable("problems", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  platform: text("platform").notNull().default("leetcode"), // 'leetcode' | 'codeforces' | 'neetcode' | 'system_design' | 'other'
  difficulty: text("difficulty").notNull().default("medium"), // 'easy' | 'medium' | 'hard'
  topicTags: text("topic_tags").notNull().default("[]"), // JSON string array: ["Graphs", "Topological Sort"]
  status: text("status").notNull().default("unsolved"), // 'unsolved' | 'attempted' | 'solved' | 'mastered'
  url: text("url"),
  needsRevision: integer("needs_revision", { mode: "boolean" }).notNull().default(false),
  revisionDate: text("revision_date"), // scheduled review date
  bestTimeComplexity: text("best_time_complexity"), // e.g. O(V + E)
  bestSpaceComplexity: text("best_space_complexity"), // e.g. O(V)
  keyInsight: text("key_insight").notNull().default(""), // Core intuitive breakthrough
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const problemAttempts = sqliteTable("problem_attempts", {
  id: text("id").primaryKey(),
  problemId: text("problem_id").notNull().references(() => problems.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  timeSpentMinutes: integer("time_spent_minutes").notNull().default(20),
  passed: integer("passed", { mode: "boolean" }).notNull().default(true),
  language: text("language").notNull().default("TypeScript"), // 'Go' | 'TypeScript' | 'Python' | 'C++' | 'Rust'
  solutionCode: text("solution_code").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export type Problem = typeof problems.$inferSelect;
export type NewProblem = typeof problems.$inferInsert;
export type ProblemAttempt = typeof problemAttempts.$inferSelect;
export type NewProblemAttempt = typeof problemAttempts.$inferInsert;
