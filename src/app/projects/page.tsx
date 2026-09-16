import { getProjectsData } from "@/lib/actions/projects";
import { ProjectsClient } from "@/components/projects/projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const data = await getProjectsData();

  return (
    <div className="space-y-4">
      <ProjectsClient
        initialProjects={data.projects}
        initialSprints={data.sprints}
        initialTasks={data.tasks}
      />
    </div>
  );
}
