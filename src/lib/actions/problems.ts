"use server";

import { db } from "@/lib/db";
import { problems, problemAttempts } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

export async function getProblemsData() {
  const allProblems = await db
    .select()
    .from(problems)
    .orderBy(desc(problems.needsRevision), desc(problems.updatedAt));

  const allAttempts = await db
    .select()
    .from(problemAttempts)
    .orderBy(desc(problemAttempts.date));

  const attemptsByProblem = new Map<string, typeof allAttempts>();
  allAttempts.forEach((att) => {
    const list = attemptsByProblem.get(att.problemId) || [];
    list.push(att);
    attemptsByProblem.set(att.problemId, list);
  });

  return {
    problems: allProblems.map((p) => ({
      ...p,
      attempts: attemptsByProblem.get(p.id) || [],
    })),
  };
}

export async function createProblemAction(data: {
  title: string;
  platform?: "leetcode" | "codeforces" | "neetcode" | "system_design" | "other";
  difficulty?: "easy" | "medium" | "hard";
  topicTags?: string[];
  url?: string;
  bestTimeComplexity?: string;
  bestSpaceComplexity?: string;
  keyInsight?: string;
  needsRevision?: boolean;
}) {
  const id = genId("prob");
  const now = new Date().toISOString();

  await db.insert(problems).values({
    id,
    title: data.title.trim(),
    platform: data.platform || "leetcode",
    difficulty: data.difficulty || "medium",
    topicTags: JSON.stringify(data.topicTags || []),
    status: "solved",
    url: data.url?.trim() || null,
    bestTimeComplexity: data.bestTimeComplexity?.trim() || null,
    bestSpaceComplexity: data.bestSpaceComplexity?.trim() || null,
    keyInsight: data.keyInsight?.trim() || "",
    needsRevision: data.needsRevision || false,
    revisionDate: data.needsRevision ? new Date().toISOString().split("T")[0] : null,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/problems");
  revalidatePath("/");
  return { success: true, id };
}

export async function toggleRevisionAction(problemId: string, needsRevision: boolean) {
  const now = new Date().toISOString();
  await db
    .update(problems)
    .set({
      needsRevision,
      revisionDate: needsRevision ? new Date().toISOString().split("T")[0] : null,
      updatedAt: now,
    })
    .where(eq(problems.id, problemId));

  revalidatePath("/problems");
  revalidatePath("/");
  return { success: true };
}

export async function logProblemAttemptAction(data: {
  problemId: string;
  timeSpentMinutes: number;
  passed: boolean;
  language: string;
  solutionCode?: string;
  notes?: string;
}) {
  const id = genId("att");
  const now = new Date().toISOString();

  await db.insert(problemAttempts).values({
    id,
    problemId: data.problemId,
    date: now.split("T")[0],
    timeSpentMinutes: data.timeSpentMinutes,
    passed: data.passed,
    language: data.language,
    solutionCode: data.solutionCode?.trim() || "",
    notes: data.notes?.trim() || "",
    createdAt: now,
  });

  // Also update problem status to solved if passed
  if (data.passed) {
    await db
      .update(problems)
      .set({ status: "solved", updatedAt: now })
      .where(eq(problems.id, data.problemId));
  }

  revalidatePath("/problems");
  revalidatePath("/");
  return { success: true, id };
}

export async function deleteProblemAction(problemId: string) {
  await db.delete(problems).where(eq(problems.id, problemId));
  revalidatePath("/problems");
  revalidatePath("/");
  return { success: true };
}
