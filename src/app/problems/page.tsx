import { getProblemsData } from "@/lib/actions/problems";
import { ProblemsClient } from "@/components/problems/problems-client";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const data = await getProblemsData();

  return (
    <div className="space-y-4">
      <ProblemsClient initialProblems={data.problems} />
    </div>
  );
}
