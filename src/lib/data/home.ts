import { db } from "@/lib/db";
import {
  tasks,
  projects,
  learningTopics,
  problems,
  financialAccounts,
  upcomingCashflows,
  workoutRoutines,
  goals,
  notes,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getHomeData() {
  // Focus Tasks
  const todayTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      projectId: tasks.projectId,
      isFocusToday: tasks.isFocusToday,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .where(eq(tasks.isFocusToday, true));

  // In-flight tasks
  const inProgressTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      projectId: tasks.projectId,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .where(eq(tasks.status, "in_progress"));

  // Projects map
  const allProjects = await db.select().from(projects);
  const projectMap = new Map(allProjects.map((p) => [p.id, p]));

  // Current learning topic
  const focusTopic = (
    await db
      .select()
      .from(learningTopics)
      .where(eq(learningTopics.isCurrentFocus, true))
  )[0] || (await db.select().from(learningTopics).limit(1))[0];

  // Daily revision problem
  const revisionProblem = (
    await db
      .select()
      .from(problems)
      .where(eq(problems.needsRevision, true))
  )[0];

  // Primary account
  const primaryAccount = (
    await db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.isPrimary, true))
  )[0] || (await db.select().from(financialAccounts).limit(1))[0];

  // Upcoming bills
  const upcomingBills = await db
    .select()
    .from(upcomingCashflows)
    .where(eq(upcomingCashflows.isPaid, false))
    .limit(3);

  // Suggested workout routine
  const routine = (await db.select().from(workoutRoutines).limit(1))[0];

  // Active major goals
  const activeGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.status, "active"))
    .limit(3);

  // Recent pinned notes
  const pinnedNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.pinned, true))
    .limit(2);

  return {
    todayTasks,
    inProgressTasks,
    projectMap: Object.fromEntries(projectMap),
    focusTopic,
    revisionProblem,
    primaryAccount,
    upcomingBills,
    routine,
    activeGoals,
    pinnedNotes,
  };
}
