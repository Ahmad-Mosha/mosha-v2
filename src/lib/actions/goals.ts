"use server";

import { db } from "@/lib/db";
import {
  goals,
  goalMilestones,
  goalReflections,
  projects,
} from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

export async function getGoalsData() {
  const allGoals = await db.select().from(goals).orderBy(desc(goals.status), desc(goals.createdAt));
  const allMilestones = await db.select().from(goalMilestones).orderBy(asc(goalMilestones.order));
  const allReflections = await db.select().from(goalReflections).orderBy(desc(goalReflections.date));
  const allProjects = await db.select().from(projects);

  const milestonesByGoal = new Map<string, typeof allMilestones>();
  allMilestones.forEach((m) => {
    const list = milestonesByGoal.get(m.goalId) || [];
    list.push(m);
    milestonesByGoal.set(m.goalId, list);
  });

  const reflectionsByGoal = new Map<string, typeof allReflections>();
  allReflections.forEach((r) => {
    const list = reflectionsByGoal.get(r.goalId) || [];
    list.push(r);
    reflectionsByGoal.set(r.goalId, list);
  });

  const projectsByGoal = new Map<string, typeof allProjects>();
  allProjects.forEach((p) => {
    if (p.goalId) {
      const list = projectsByGoal.get(p.goalId) || [];
      list.push(p);
      projectsByGoal.set(p.goalId, list);
    }
  });

  return {
    goals: allGoals.map((g) => ({
      ...g,
      milestones: milestonesByGoal.get(g.id) || [],
      reflections: reflectionsByGoal.get(g.id) || [],
      linkedProjects: projectsByGoal.get(g.id) || [],
    })),
  };
}

export async function createGoalAction(data: {
  title: string;
  category: "engineering" | "career" | "fitness" | "financial" | "personal";
  icon?: string;
  targetYearOrDate?: string;
  visionStatement?: string;
}) {
  const id = genId("goal");
  const now = new Date().toISOString();

  await db.insert(goals).values({
    id,
    title: data.title.trim(),
    category: data.category,
    icon: data.icon || "🎯",
    status: "active",
    targetYearOrDate: data.targetYearOrDate || null,
    visionStatement: data.visionStatement?.trim() || "",
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/goals");
  revalidatePath("/");
  return { success: true, id };
}

export async function createMilestoneAction(data: {
  goalId: string;
  title: string;
  targetDate?: string;
}) {
  const id = genId("gm");
  await db.insert(goalMilestones).values({
    id,
    goalId: data.goalId,
    title: data.title.trim(),
    targetDate: data.targetDate || null,
    completed: false,
    order: 0,
  });

  revalidatePath("/goals");
  return { success: true, id };
}

export async function toggleMilestoneAction(milestoneId: string, completed: boolean) {
  const now = new Date().toISOString();
  await db
    .update(goalMilestones)
    .set({
      completed,
      completedAt: completed ? now : null,
    })
    .where(eq(goalMilestones.id, milestoneId));

  revalidatePath("/goals");
  return { success: true };
}

export async function deleteMilestoneAction(milestoneId: string) {
  await db.delete(goalMilestones).where(eq(goalMilestones.id, milestoneId));
  revalidatePath("/goals");
  return { success: true };
}

export async function addReflectionAction(data: {
  goalId: string;
  title: string;
  content: string;
  date?: string;
}) {
  const id = genId("gr");
  const now = new Date().toISOString();

  await db.insert(goalReflections).values({
    id,
    goalId: data.goalId,
    title: data.title.trim(),
    content: data.content.trim(),
    date: data.date || now.split("T")[0],
    createdAt: now,
  });

  revalidatePath("/goals");
  return { success: true, id };
}

export async function deleteGoalAction(goalId: string) {
  await db.delete(goals).where(eq(goals.id, goalId));
  revalidatePath("/goals");
  revalidatePath("/");
  return { success: true };
}
