import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  tags: text("tags").notNull().default("[]"), // JSON string array of tags
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  
  // Polymorphic attachment to other domains
  entityType: text("entity_type").notNull().default("standalone"), // 'standalone' | 'project' | 'task' | 'learning_topic' | 'problem' | 'exercise' | 'goal'
  entityId: text("entity_id"), // Optional ID of the parent entity
  
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
