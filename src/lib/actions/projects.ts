"use server";

import { db } from "@/lib/db";
import { projects, sprints, tasks, subtasks } from "@/lib/db/schema";
import { eq, asc, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

export async function getProjectsData(selectedProjectId?: string) {
  const allProjects = await db.select().from(projects).orderBy(desc(projects.updatedAt));
  const allSprints = await db.select().from(sprints).orderBy(desc(sprints.createdAt));
  
  const allTasks =
    selectedProjectId && selectedProjectId !== "all"
      ? await db
          .select()
          .from(tasks)
          .where(eq(tasks.projectId, selectedProjectId))
          .orderBy(asc(tasks.order), desc(tasks.createdAt))
      : await db
          .select()
          .from(tasks)
          .orderBy(asc(tasks.order), desc(tasks.createdAt));
  const allSubtasks = await db.select().from(subtasks).orderBy(asc(subtasks.order));

  // Map subtasks to tasks
  const subtasksByTask = new Map<string, typeof allSubtasks>();
  allSubtasks.forEach((st) => {
    const list = subtasksByTask.get(st.taskId) || [];
    list.push(st);
    subtasksByTask.set(st.taskId, list);
  });

  return {
    projects: allProjects,
    sprints: allSprints,
    tasks: allTasks.map((t) => ({
      ...t,
      subtasks: subtasksByTask.get(t.id) || [],
    })),
  };
}

export async function createProjectAction(data: {
  title: string;
  description?: string;
  status?: "planning" | "active" | "paused" | "completed";
  priority?: "low" | "medium" | "high" | "urgent";
  goalId?: string | null;
  techStack?: string[];
  repositoryUrl?: string;
  targetDate?: string;
}) {
  const id = genId("proj");
  const now = new Date().toISOString();

  await db.insert(projects).values({
    id,
    title: data.title.trim(),
    description: data.description?.trim() || "",
    status: data.status || "active",
    priority: data.priority || "medium",
    goalId: data.goalId || null,
    techStack: JSON.stringify(data.techStack || []),
    repositoryUrl: data.repositoryUrl || null,
    targetDate: data.targetDate || null,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true, id };
}

export async function createSprintAction(data: {
  projectId: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}) {
  const id = genId("sprint");
  const now = new Date().toISOString();

  await db.insert(sprints).values({
    id,
    projectId: data.projectId,
    name: data.name.trim(),
    goal: data.goal?.trim() || "",
    status: "active",
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    createdAt: now,
  });

  revalidatePath("/projects");
  return { success: true, id };
}

export async function createTaskAction(data: {
  projectId: string;
  sprintId?: string | null;
  title: string;
  description?: string;
  status?: "backlog" | "todo" | "in_progress" | "in_review" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  estimateHours?: number;
  isFocusToday?: boolean;
}) {
  const id = genId("task");
  const now = new Date().toISOString();

  await db.insert(tasks).values({
    id,
    projectId: data.projectId,
    sprintId: data.sprintId || null,
    title: data.title.trim(),
    description: data.description?.trim() || "",
    status: data.status || "todo",
    priority: data.priority || "medium",
    dueDate: data.dueDate || null,
    estimateHours: data.estimateHours || null,
    isFocusToday: data.isFocusToday || false,
    order: 0,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true, id };
}

export async function moveTaskAction(data: {
  taskId: string;
  newStatus: "backlog" | "todo" | "in_progress" | "in_review" | "done";
  newOrder: number;
}) {
  const now = new Date().toISOString();
  await db
    .update(tasks)
    .set({
      status: data.newStatus,
      order: data.newOrder,
      updatedAt: now,
    })
    .where(eq(tasks.id, data.taskId));

  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true };
}

export async function updateTaskAction(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    status?: "backlog" | "todo" | "in_progress" | "in_review" | "done";
    priority?: "low" | "medium" | "high" | "urgent";
    sprintId?: string | null;
    dueDate?: string | null;
    estimateHours?: number | null;
    isFocusToday?: boolean;
  }
) {
  const now = new Date().toISOString();
  await db
    .update(tasks)
    .set({
      ...data,
      updatedAt: now,
    })
    .where(eq(tasks.id, taskId));

  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTaskAction(taskId: string) {
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true };
}

export async function addSubtaskAction(taskId: string, title: string) {
  const id = genId("sub");
  await db.insert(subtasks).values({
    id,
    taskId,
    title: title.trim(),
    completed: false,
    order: 0,
  });
  revalidatePath("/projects");
  return { success: true, id };
}

export async function toggleSubtaskAction(subtaskId: string, completed: boolean) {
  await db
    .update(subtasks)
    .set({ completed })
    .where(eq(subtasks.id, subtaskId));
  revalidatePath("/projects");
  return { success: true };
}

export async function deleteSubtaskAction(subtaskId: string) {
  await db.delete(subtasks).where(eq(subtasks.id, subtaskId));
  revalidatePath("/projects");
  return { success: true };
}
