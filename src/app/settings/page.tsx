import { db } from "@/lib/db";
import {
  goals,
  projects,
  tasks,
  learningTopics,
  studySessions,
  problems,
  exercises,
  workoutSessions,
  transactions,
  notes,
} from "@/lib/db/schema";
import { SettingsClient } from "@/components/settings/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [
    allGoals,
    allProjects,
    allTasks,
    allTopics,
    allSessions,
    allProblems,
    allExercises,
    allWorkouts,
    allTxs,
    allNotes,
  ] = await Promise.all([
    db.select().from(goals),
    db.select().from(projects),
    db.select().from(tasks),
    db.select().from(learningTopics),
    db.select().from(studySessions),
    db.select().from(problems),
    db.select().from(exercises),
    db.select().from(workoutSessions),
    db.select().from(transactions),
    db.select().from(notes),
  ]);

  const counts = {
    goals: allGoals.length,
    projects: allProjects.length,
    tasks: allTasks.length,
    learningTopics: allTopics.length,
    studySessions: allSessions.length,
    problems: allProblems.length,
    exercises: allExercises.length,
    workoutSessions: allWorkouts.length,
    transactions: allTxs.length,
    notes: allNotes.length,
  };

  return (
    <div className="space-y-4">
      <SettingsClient initialCounts={counts} />
    </div>
  );
}
