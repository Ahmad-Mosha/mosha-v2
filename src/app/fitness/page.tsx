import { getFitnessData } from "@/lib/actions/fitness";
import { FitnessClient } from "@/components/fitness/fitness-client";

export const dynamic = "force-dynamic";

export default async function FitnessPage() {
  const data = await getFitnessData();

  return (
    <div className="space-y-4">
      <FitnessClient
        initialRoutines={data.routines}
        initialExercises={data.exercises}
        initialSessions={data.sessions}
        historyByExercise={data.historyByExercise}
      />
    </div>
  );
}
