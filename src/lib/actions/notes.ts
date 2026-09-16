"use server";

import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getNotes(filters?: {
  entityType?: string;
  entityId?: string;
  tag?: string;
  archived?: boolean;
}) {
  let query = db.select().from(notes);

  const conditions = [];
  if (filters?.archived !== undefined) {
    conditions.push(eq(notes.archived, filters.archived));
  } else {
    conditions.push(eq(notes.archived, false));
  }

  if (filters?.entityType) {
    conditions.push(eq(notes.entityType, filters.entityType));
  }
  if (filters?.entityId) {
    conditions.push(eq(notes.entityId, filters.entityId));
  }

  const results = await db
    .select()
    .from(notes)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(notes.pinned), desc(notes.updatedAt));

  if (filters?.tag) {
    return results.filter((n) => {
      try {
        const tags = JSON.parse(n.tags) as string[];
        return tags.includes(filters.tag!);
      } catch {
        return false;
      }
    });
  }

  return results;
}

export async function getNoteById(id: string) {
  const result = await db.select().from(notes).where(eq(notes.id, id));
  return result[0] || null;
}

export async function createNoteAction(data: {
  title: string;
  content?: string;
  tags?: string[];
  entityType?: string;
  entityId?: string;
}) {
  const id = `note-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  await db.insert(notes).values({
    id,
    title: data.title.trim() || "Untitled Note",
    content: data.content || "",
    tags: JSON.stringify(data.tags || []),
    pinned: false,
    archived: false,
    entityType: data.entityType || "standalone",
    entityId: data.entityId || null,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/notes");
  revalidatePath("/");
  return { success: true, id };
}

export async function updateNoteAction(
  id: string,
  data: {
    title?: string;
    content?: string;
    tags?: string[];
    pinned?: boolean;
    archived?: boolean;
    entityType?: string;
    entityId?: string | null;
  }
) {
  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = { updatedAt: now };

  if (data.title !== undefined) updatePayload.title = data.title.trim() || "Untitled Note";
  if (data.content !== undefined) updatePayload.content = data.content;
  if (data.tags !== undefined) updatePayload.tags = JSON.stringify(data.tags);
  if (data.pinned !== undefined) updatePayload.pinned = data.pinned;
  if (data.archived !== undefined) updatePayload.archived = data.archived;
  if (data.entityType !== undefined) updatePayload.entityType = data.entityType;
  if (data.entityId !== undefined) updatePayload.entityId = data.entityId;

  await db.update(notes).set(updatePayload).where(eq(notes.id, id));

  revalidatePath("/notes");
  revalidatePath("/");
  return { success: true };
}

export async function deleteNoteAction(id: string) {
  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath("/notes");
  revalidatePath("/");
  return { success: true };
}
