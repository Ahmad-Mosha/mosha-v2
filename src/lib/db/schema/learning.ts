import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const learningTopics = sqliteTable("learning_topics", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("systems"), // 'systems' | 'networking' | 'databases' | 'languages' | 'distributed' | 'architecture' | 'other'
  icon: text("icon").notNull().default("📚"),
  status: text("status").notNull().default("in_progress"), // 'want_to_learn' | 'in_progress' | 'mastered' | 'revisiting'
  difficulty: text("difficulty").notNull().default("intermediate"), // 'beginner' | 'intermediate' | 'advanced'
  currentCheckpoint: text("current_checkpoint").notNull().default(""), // "Where did I stop?" e.g., Chapter 4: Multi-level page tables
  nextStep: text("next_step").notNull().default(""), // "What's next?" e.g., Implement toy TLB cache in C
  isCurrentFocus: integer("is_current_focus", { mode: "boolean" }).notNull().default(false), // Surfaced on Home/Today
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const learningResources = sqliteTable("learning_resources", {
  id: text("id").primaryKey(),
  topicId: text("topic_id").notNull().references(() => learningTopics.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url"),
  type: text("type").notNull().default("book"), // 'book' | 'paper' | 'course' | 'doc' | 'video' | 'repo'
  status: text("status").notNull().default("queued"), // 'queued' | 'active' | 'completed'
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const studySessions = sqliteTable("study_sessions", {
  id: text("id").primaryKey(),
  topicId: text("topic_id").notNull().references(() => learningTopics.id, { onDelete: "cascade" }),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  date: text("date").notNull(),
  summary: text("summary").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export type LearningTopic = typeof learningTopics.$inferSelect;
export type NewLearningTopic = typeof learningTopics.$inferInsert;
export type LearningResource = typeof learningResources.$inferSelect;
export type NewLearningResource = typeof learningResources.$inferInsert;
export type StudySession = typeof studySessions.$inferSelect;
export type NewStudySession = typeof studySessions.$inferInsert;
