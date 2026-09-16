import { getHomeData } from "@/lib/data/home";
import { HomeClient } from "@/components/home/home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <HomeClient
      todayTasks={data.todayTasks as any}
      inProgressTasks={data.inProgressTasks as any}
      projectMap={data.projectMap}
      focusTopic={data.focusTopic}
      revisionProblem={data.revisionProblem}
      primaryAccount={data.primaryAccount}
      upcomingBills={data.upcomingBills}
      routine={data.routine}
      activeGoals={data.activeGoals}
      pinnedNotes={data.pinnedNotes}
    />
  );
}
