import Link from "next/link";
import { getHomeData } from "@/lib/data/home";
import {
  Compass,
  CheckCircle2,
  Circle,
  ArrowRight,
  BookOpen,
  Code2,
  Dumbbell,
  Wallet,
  Target,
  FileText,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Today Header & Orientation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SYSTEM OPERATIONAL &bull; LOCAL PERSISTENCE</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Welcome back. Here is your operational focus.
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            High-leverage synthesis across engineering, learning, training, and finances.
          </p>
        </div>

        {/* Quick Domain Anchors */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/projects">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              Projects
            </Button>
          </Link>
          <Link href="/learning">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              Learning
            </Button>
          </Link>
          <Link href="/fitness">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              Workout
            </Button>
          </Link>
          <Link href="/money">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              Money
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Work in Flight & Learning Anchor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: In-Flight Engineering Work & Today Focus */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Focus Section */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                  Today's Execution Focus
                </h2>
              </div>
              <Link
                href="/projects"
                className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 group"
              >
                <span>Sprint Board</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {data.todayTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                No tasks flagged for today's focus. Press{" "}
                <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  ⌘J
                </kbd>{" "}
                to capture.
              </div>
            ) : (
              <div className="space-y-2">
                {data.todayTasks.map((task) => {
                  const proj = data.projectMap[task.projectId];
                  return (
                    <div
                      key={task.id}
                      className="group flex items-center justify-between p-3 rounded-md bg-zinc-950/70 border border-zinc-800/60 hover:border-zinc-700/80 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Circle className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 cursor-pointer transition-colors" />
                        <div>
                          <div className="text-xs font-medium text-zinc-200 group-hover:text-zinc-100">
                            {task.title}
                          </div>
                          {proj && (
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {proj.title}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            task.priority === "urgent"
                              ? "danger"
                              : task.priority === "high"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Technical Learning Anchor */}
          {data.focusTopic && (
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                    Technical Learning Momentum
                  </h2>
                </div>
                <Link
                  href={`/learning`}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 group"
                >
                  <span>Open Topic</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="p-4 rounded-md bg-zinc-950/80 border border-zinc-800/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{data.focusTopic.icon}</span>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {data.focusTopic.title}
                    </h3>
                  </div>
                  <Badge variant="accent" className="text-[10px] uppercase font-mono">
                    {data.focusTopic.category}
                  </Badge>
                </div>

                {/* Where did I stop? */}
                <div className="space-y-1 bg-zinc-900/50 p-2.5 rounded border border-zinc-800/50">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Where I Stopped
                  </div>
                  <p className="text-xs text-zinc-300 font-mono">
                    {data.focusTopic.currentCheckpoint || "No checkpoint logged yet."}
                  </p>
                </div>

                {/* What's next? */}
                {data.focusTopic.nextStep && (
                  <div className="space-y-1 bg-zinc-900/30 p-2.5 rounded border border-zinc-800/40">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3" />
                      Immediate Next Action
                    </div>
                    <p className="text-xs text-zinc-300">
                      {data.focusTopic.nextStep}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Algorithmic Practice / Revision Queue */}
          {data.revisionProblem && (
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                    Daily Problem Revision
                  </h2>
                </div>
                <Link
                  href="/problems"
                  className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 group"
                >
                  <span>Problem Hub</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="p-3.5 rounded-md bg-zinc-950/70 border border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-100">
                      {data.revisionProblem.title}
                    </span>
                    <Badge
                      variant={
                        data.revisionProblem.difficulty === "hard"
                          ? "danger"
                          : data.revisionProblem.difficulty === "medium"
                          ? "warning"
                          : "success"
                      }
                      className="text-[9px] uppercase font-mono"
                    >
                      {data.revisionProblem.difficulty}
                    </Badge>
                  </div>
                  {data.revisionProblem.keyInsight && (
                    <p className="text-[11px] text-zinc-400 italic line-clamp-1">
                      &ldquo;{data.revisionProblem.keyInsight}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {data.revisionProblem.bestTimeComplexity && (
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {data.revisionProblem.bestTimeComplexity}
                    </span>
                  )}
                  {data.revisionProblem.url && (
                    <a
                      href={data.revisionProblem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-zinc-100 p-1.5 hover:bg-zinc-800 rounded transition-colors"
                      title="Open problem link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Fitness, Financial Pulse & Goals */}
        <div className="space-y-6">
          {/* Fitness / Workout Prompt */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-rose-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                  Physical Training
                </h2>
              </div>
              <Link
                href="/fitness"
                className="text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Logs
              </Link>
            </div>

            {data.routine ? (
              <div className="p-3 rounded-md bg-zinc-950/70 border border-zinc-800/60 space-y-2">
                <div className="text-xs font-semibold text-zinc-200">
                  {data.routine.name}
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2">
                  {data.routine.description}
                </p>
                <div className="pt-2">
                  <Link href="/fitness?action=start">
                    <Button size="sm" className="w-full h-7 text-xs bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
                      Start Active Workout
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-zinc-500">
                No active routines configured.
              </div>
            )}
          </div>

          {/* Personal Money Pulse */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                  Financial Pulse
                </h2>
              </div>
              <Link
                href="/money"
                className="text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Overview
              </Link>
            </div>

            {data.primaryAccount ? (
              <div className="p-3 rounded-md bg-zinc-950/70 border border-zinc-800/60 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-zinc-400">
                    {data.primaryAccount.name}
                  </span>
                  <span className="text-base font-semibold font-mono text-zinc-100">
                    {formatCurrency(data.primaryAccount.currentBalance)}
                  </span>
                </div>

                {data.upcomingBills.length > 0 && (
                  <div className="border-t border-zinc-800/60 pt-2 space-y-1.5">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                      Upcoming Bills
                    </div>
                    {data.upcomingBills.map((bill) => (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-zinc-300 truncate max-w-[130px]">
                          {bill.title}
                        </span>
                        <span className="font-mono text-zinc-400">
                          {formatCurrency(bill.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-zinc-500">
                No accounts set up.
              </div>
            )}
          </div>

          {/* Major Goals (North Stars) */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-cyan-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                  Major Goals
                </h2>
              </div>
              <Link
                href="/goals"
                className="text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                View
              </Link>
            </div>

            <div className="space-y-2">
              {data.activeGoals.map((g) => (
                <div
                  key={g.id}
                  className="p-2.5 rounded-md bg-zinc-950/70 border border-zinc-800/60 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{g.icon}</span>
                    <span className="text-xs font-medium text-zinc-200 truncate">
                      {g.title}
                    </span>
                  </div>
                  {g.visionStatement && (
                    <p className="text-[10px] text-zinc-500 line-clamp-2 pl-6">
                      {g.visionStatement}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
