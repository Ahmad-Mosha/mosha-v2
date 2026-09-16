"use server";

import { db } from "@/lib/db";
import { learningTopics, learningResources, studySessions } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

export async function getLearningData() {
  const topics = await db.select().from(learningTopics).orderBy(desc(learningTopics.isCurrentFocus), desc(learningTopics.updatedAt));
  const resources = await db.select().from(learningResources).orderBy(asc(learningResources.createdAt));
  const sessions = await db.select().from(studySessions).orderBy(desc(studySessions.date));

  // Map resources and sessions to topics
  const resourcesByTopic = new Map<string, typeof resources>();
  resources.forEach((r) => {
    const list = resourcesByTopic.get(r.topicId) || [];
    list.push(r);
    resourcesByTopic.set(r.topicId, list);
  });

  const sessionsByTopic = new Map<string, typeof sessions>();
  sessions.forEach((s) => {
    const list = sessionsByTopic.get(s.topicId) || [];
    list.push(s);
    sessionsByTopic.set(s.topicId, list);
  });

  return {
    topics: topics.map((t) => ({
      ...t,
      resources: resourcesByTopic.get(t.id) || [],
      sessions: sessionsByTopic.get(t.id) || [],
    })),
    allSessions: sessions,
  };
}

export async function createLearningTopicAction(data: {
  title: string;
  category: "systems" | "networking" | "databases" | "languages" | "distributed" | "architecture" | "other";
  icon?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  currentCheckpoint?: string;
  nextStep?: string;
  isCurrentFocus?: boolean;
}) {
  const id = genId("topic");
  const now = new Date().toISOString();

  await db.insert(learningTopics).values({
    id,
    title: data.title.trim(),
    category: data.category,
    icon: data.icon || "📚",
    status: "in_progress",
    difficulty: data.difficulty || "intermediate",
    currentCheckpoint: data.currentCheckpoint?.trim() || "",
    nextStep: data.nextStep?.trim() || "",
    isCurrentFocus: data.isCurrentFocus || false,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/learning");
  revalidatePath("/");
  return { success: true, id };
}

export async function updateCheckpointAction(
  topicId: string,
  checkpoint: string,
  nextStep?: string
) {
  const now = new Date().toISOString();
  await db
    .update(learningTopics)
    .set({
      currentCheckpoint: checkpoint.trim(),
      ...(nextStep !== undefined ? { nextStep: nextStep.trim() } : {}),
      updatedAt: now,
    })
    .where(eq(learningTopics.id, topicId));

  revalidatePath("/learning");
  revalidatePath("/");
  return { success: true };
}

export async function toggleFocusTopicAction(topicId: string, isCurrentFocus: boolean) {
  const now = new Date().toISOString();
  await db
    .update(learningTopics)
    .set({ isCurrentFocus, updatedAt: now })
    .where(eq(learningTopics.id, topicId));

  revalidatePath("/learning");
  revalidatePath("/");
  return { success: true };
}

export async function addLearningResourceAction(data: {
  topicId: string;
  title: string;
  url?: string;
  type: "book" | "paper" | "course" | "doc" | "video" | "repo";
  notes?: string;
}) {
  const id = genId("res");
  const now = new Date().toISOString();

  await db.insert(learningResources).values({
    id,
    topicId: data.topicId,
    title: data.title.trim(),
    url: data.url?.trim() || null,
    type: data.type,
    status: "queued",
    notes: data.notes?.trim() || "",
    createdAt: now,
  });

  revalidatePath("/learning");
  return { success: true, id };
}

export async function updateResourceStatusAction(
  resourceId: string,
  status: "queued" | "active" | "completed"
) {
  await db
    .update(learningResources)
    .set({ status })
    .where(eq(learningResources.id, resourceId));

  revalidatePath("/learning");
  return { success: true };
}

export async function logStudySessionAction(data: {
  topicId: string;
  durationMinutes: number;
  date: string;
  summary: string;
}) {
  const id = genId("study");
  const now = new Date().toISOString();

  await db.insert(studySessions).values({
    id,
    topicId: data.topicId,
    durationMinutes: data.durationMinutes,
    date: data.date,
    summary: data.summary.trim(),
    createdAt: now,
  });

  revalidatePath("/learning");
  revalidatePath("/");
  return { success: true, id };
}

export async function deleteLearningTopicAction(topicId: string) {
  await db.delete(learningTopics).where(eq(learningTopics.id, topicId));
  revalidatePath("/learning");
  revalidatePath("/");
  return { success: true };
}
