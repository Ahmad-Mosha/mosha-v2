import { getLearningData } from "@/lib/actions/learning";
import { LearningClient } from "@/components/learning/learning-client";

export const dynamic = "force-dynamic";

export default async function LearningPage() {
  const data = await getLearningData();

  return (
    <div className="space-y-4">
      <LearningClient initialTopics={data.topics} />
    </div>
  );
}
