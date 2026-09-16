import { db } from "@/lib/db";
import { notes, projects, learningTopics, problems } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { NotesClient } from "@/components/notes/notes-client";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const allNotes = await db
    .select()
    .from(notes)
    .orderBy(desc(notes.pinned), desc(notes.updatedAt));

  const allProjects = await db
    .select({ id: projects.id, title: projects.title })
    .from(projects);

  const allTopics = await db
    .select({ id: learningTopics.id, title: learningTopics.title })
    .from(learningTopics);

  const allProblems = await db
    .select({ id: problems.id, title: problems.title })
    .from(problems);

  return (
    <div className="space-y-4">
      <NotesClient
        initialNotes={allNotes}
        projectsList={allProjects}
        topicsList={allTopics}
        problemsList={allProblems}
      />
    </div>
  );
}
