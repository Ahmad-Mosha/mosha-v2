"use server";

import { db } from "@/lib/db";
import {
  tasks,
  notes,
  transactions,
  financialAccounts,
  learningTopics,
  projects,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Generate clean unique ID
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

export async function getQuickCaptureOptions() {
  const allProjects = await db.select({ id: projects.id, title: projects.title }).from(projects);
  const allAccounts = await db.select({ id: financialAccounts.id, name: financialAccounts.name, balance: financialAccounts.currentBalance }).from(financialAccounts);
  const allTopics = await db.select({ id: learningTopics.id, title: learningTopics.title }).from(learningTopics);
  return { projects: allProjects, accounts: allAccounts, topics: allTopics };
}

export async function captureTaskAction(formData: {
  title: string;
  projectId: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  estimateHours?: number;
  isFocusToday?: boolean;
}) {
  const id = genId("task");
  const now = new Date().toISOString();

  await db.insert(tasks).values({
    id,
    projectId: formData.projectId,
    title: formData.title,
    priority: formData.priority || "medium",
    status: "todo",
    dueDate: formData.dueDate || null,
    estimateHours: formData.estimateHours || null,
    isFocusToday: formData.isFocusToday || false,
    order: 0,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/");
  revalidatePath("/projects");
  return { success: true, id };
}

export async function captureNoteAction(formData: {
  title: string;
  content: string;
  tags?: string[];
  entityType?: string;
  entityId?: string;
}) {
  const id = genId("note");
  const now = new Date().toISOString();

  await db.insert(notes).values({
    id,
    title: formData.title,
    content: formData.content || "",
    tags: JSON.stringify(formData.tags || []),
    pinned: false,
    archived: false,
    entityType: formData.entityType || "standalone",
    entityId: formData.entityId || null,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/");
  revalidatePath("/notes");
  return { success: true, id };
}

export async function captureTransactionAction(formData: {
  accountId: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date?: string;
}) {
  const id = genId("tx");
  const now = new Date().toISOString();
  const txDate = formData.date || new Date().toISOString().split("T")[0];

  // 1. Insert transaction
  await db.insert(transactions).values({
    id,
    accountId: formData.accountId,
    type: formData.type,
    amount: formData.amount,
    category: formData.category,
    description: formData.description,
    date: txDate,
    isRecurring: false,
    createdAt: now,
  });

  // 2. Adjust account balance
  const account = await db.query?.financialAccounts?.findFirst?.({
    where: eq(financialAccounts.id, formData.accountId),
  }) ?? (await db.select().from(financialAccounts).where(eq(financialAccounts.id, formData.accountId)))[0];

  if (account) {
    const delta = formData.type === "income" ? formData.amount : -formData.amount;
    const newBalance = account.currentBalance + delta;
    await db
      .update(financialAccounts)
      .set({ currentBalance: newBalance, updatedAt: now })
      .where(eq(financialAccounts.id, formData.accountId));
  }

  revalidatePath("/");
  revalidatePath("/money");
  return { success: true, id };
}

export async function captureLearningCheckpointAction(formData: {
  topicId: string;
  checkpoint: string;
  nextStep?: string;
}) {
  const now = new Date().toISOString();
  await db
    .update(learningTopics)
    .set({
      currentCheckpoint: formData.checkpoint,
      nextStep: formData.nextStep || "",
      updatedAt: now,
    })
    .where(eq(learningTopics.id, formData.topicId));

  revalidatePath("/");
  revalidatePath("/learning");
  return { success: true };
}
