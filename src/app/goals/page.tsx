import { getGoalsData } from "@/lib/actions/goals";
import { GoalsClient } from "@/components/goals/goals-client";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const data = await getGoalsData();

  return (
    <div className="space-y-4">
      <GoalsClient initialGoals={data.goals} />
    </div>
  );
}
