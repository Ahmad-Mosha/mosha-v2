"use client";

import * as React from "react";
import Link from "next/link";
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
  Plus,
  Play,
  Check,
  Edit2,
  Clock,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  Task,
  LearningTopic,
  Problem,
  FinancialAccount,
  UpcomingCashflow,
  WorkoutRoutine,
  Goal,
  Note,
  Project,
} from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { updateTaskAction } from "@/lib/actions/projects";
import { updateCheckpointAction } from "@/lib/actions/learning";
import { toggleRevisionAction } from "@/lib/actions/problems";
import { formatCurrency, formatDate } from "@/lib/utils";

interface HomeClientProps {
  todayTasks: Task[];
  inProgressTasks: Task[];
  projectMap: Record<string, Project>;
  focusTopic: LearningTopic | null;
  revisionProblem: Problem | null;
  primaryAccount: FinancialAccount | null;
  upcomingBills: UpcomingCashflow[];
  routine: WorkoutRoutine | null;
  activeGoals: Goal[];
  pinnedNotes: Note[];
}

export function HomeClient({
  todayTasks: initialTodayTasks,
  inProgressTasks,
  projectMap,
  focusTopic: initialFocusTopic,
  revisionProblem: initialRevisionProblem,
  primaryAccount,
  upcomingBills,
  routine,
  activeGoals,
  pinnedNotes,
}: HomeClientProps) {
  const [todayTasks, setTodayTasks] = React.useState(initialTodayTasks);
  const [focusTopic, setFocusTopic] = React.useState(initialFocusTopic);
  const [revisionProblem, setRevisionProblem] = React.useState(initialRevisionProblem);

  // Quick edit checkpoint modal
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = React.useState(false);
  const [checkpointText, setCheckpointText] = React.useState(
    initialFocusTopic?.currentCheckpoint || ""
  );
  const [nextStepText, setNextStepText] = React.useState(
    initialFocusTopic?.nextStep || ""
  );

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    await updateTaskAction(task.id, { status: nextStatus });

    setTodayTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    if (nextStatus === "done") {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}
    }
  };

  const handleSaveCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusTopic) return;

    await updateCheckpointAction(focusTopic.id, checkpointText, nextStepText);
    setFocusTopic((prev) =>
      prev
        ? {
            ...prev,
            currentCheckpoint: checkpointText,
            nextStep: nextStepText,
          }
        : null
    );
    setIsCheckpointModalOpen(false);
  };

  const handleToggleProblemRevision = async () => {
    if (!revisionProblem) return;
    const next = !revisionProblem.needsRevision;
    await toggleRevisionAction(revisionProblem.id, next);
    setRevisionProblem((prev) => (prev ? { ...prev, needsRevision: next } : null));
    if (!next) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {}
    }
  };

  const todayDateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Temporal Orientation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>OPERATIONAL &bull; LOCAL SQLITE PERSISTENCE</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            {todayDateStr}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Operational command center: immediate focus, active engineering context, and daily momentum.
          </p>
        </div>

        {/* Quick Domain Anchors */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/projects">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              Projects & Board
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

      {/* Main Grid: Work in Flight & Learning Momentum */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Daily Focus Tasks & Learning Anchor & DSA */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Execution Focus */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-5 space-y-4 shadow-xs">
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

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800/80 rounded-md">
                No tasks flagged for today. Press{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                  ⌘J
                </kbd>{" "}
                to capture.
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task) => {
                  const proj = projectMap[task.projectId];
                  const isDone = task.status === "done";

                  return (
                    <div
                      key={task.id}
                      className={`group flex items-center justify-between p-3 rounded-md border transition-all text-xs ${
                        isDone
                          ? "bg-zinc-900/30 border-zinc-800/50 opacity-60"
                          : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task)}
                          className={`h-4 w-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                            isDone
                              ? "bg-emerald-500 text-zinc-950"
                              : "border border-zinc-600 group-hover:border-zinc-400"
                          }`}
                        >
                          {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                        </button>
                        <div>
                          <span
                            className={`font-medium ${
                              isDone
                                ? "line-through text-zinc-500"
                                : "text-zinc-200 group-hover:text-zinc-100"
                            }`}
                          >
                            {task.title}
                          </span>
                          {proj && (
                            <span className="text-[10px] text-zinc-500 font-mono block">
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

          {/* Technical Learning Momentum Anchor */}
          {focusTopic && (
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                    Technical Learning Momentum
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCheckpointModalOpen(true)}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Update Checkpoint</span>
                  </button>
                  <Link
                    href={`/learning`}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 group ml-2"
                  >
                    <span>Hub</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="p-4 rounded-md bg-zinc-900/50 border border-zinc-800/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{focusTopic.icon}</span>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {focusTopic.title}
                    </h3>
                  </div>
                  <Badge variant="accent" className="text-[10px] uppercase font-mono">
                    {focusTopic.category}
                  </Badge>
                </div>

                {/* Where I Stopped */}
                <div className="space-y-1 bg-zinc-950/70 p-3 rounded border border-zinc-800/60">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Where I Stopped
                  </div>
                  <p className="text-xs text-zinc-200 font-mono leading-relaxed">
                    {focusTopic.currentCheckpoint || "No checkpoint logged yet."}
                  </p>
                </div>

                {/* Immediate Next Action */}
                {focusTopic.nextStep && (
                  <div className="space-y-1 bg-zinc-950/40 p-3 rounded border border-zinc-800/40">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3" />
                      Immediate Next Action
                    </div>
                    <p className="text-xs text-zinc-300">
                      {focusTopic.nextStep}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Daily Algorithmic Revision */}
          {revisionProblem && (
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                    Daily Problem Revision Queue
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

              <div className="p-3.5 rounded-md bg-zinc-900/50 border border-zinc-800/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-100">
                      {revisionProblem.title}
                    </span>
                    <Badge
                      variant={
                        revisionProblem.difficulty === "hard"
                          ? "danger"
                          : revisionProblem.difficulty === "medium"
                          ? "warning"
                          : "success"
                      }
                      className="text-[9px] uppercase font-mono"
                    >
                      {revisionProblem.difficulty}
                    </Badge>
                  </div>
                  {revisionProblem.keyInsight && (
                    <p className="text-[11px] text-zinc-400 italic line-clamp-1">
                      &ldquo;{revisionProblem.keyInsight}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {revisionProblem.bestTimeComplexity && (
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      {revisionProblem.bestTimeComplexity}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant={revisionProblem.needsRevision ? "default" : "outline"}
                    onClick={handleToggleProblemRevision}
                    className="h-7 text-[11px]"
                  >
                    {revisionProblem.needsRevision ? "Mark Reviewed ✓" : "Reviewed"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Workout Trigger, Financial Pulse, Goals */}
        <div className="space-y-6">
          {/* Physical Training Card */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-5 space-y-3 shadow-xs">
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

            {routine ? (
              <div className="p-3.5 rounded-md bg-zinc-900/50 border border-zinc-800/70 space-y-2">
                <div className="text-xs font-bold text-zinc-200">
                  {routine.name}
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2">
                  {routine.description}
                </p>
                <div className="pt-2">
                  <Link href="/fitness">
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
                    >
                      <Play className="h-3 w-3 fill-current mr-1" />
                      Start Active Workout
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-zinc-500">
                No active routines programmed.
              </div>
            )}
          </div>

          {/* Financial Awareness Pulse */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-5 space-y-3 shadow-xs">
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

            {primaryAccount ? (
              <div className="p-3.5 rounded-md bg-zinc-900/50 border border-zinc-800/70 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-zinc-400">
                    {primaryAccount.name}
                  </span>
                  <span className="text-base font-bold font-mono text-zinc-100">
                    {formatCurrency(primaryAccount.currentBalance)}
                  </span>
                </div>

                {upcomingBills.length > 0 && (
                  <div className="border-t border-zinc-800/60 pt-2 space-y-1.5">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                      Upcoming Bills Due
                    </div>
                    {upcomingBills.map((bill) => (
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
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-5 space-y-3 shadow-xs">
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
              {activeGoals.map((g) => (
                <div
                  key={g.id}
                  className="p-2.5 rounded-md bg-zinc-900/50 border border-zinc-800/60 space-y-1"
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

      {/* Checkpoint Quick Edit Dialog */}
      <Dialog
        open={isCheckpointModalOpen}
        onOpenChange={setIsCheckpointModalOpen}
      >
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Update Checkpoint ({focusTopic?.title})
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCheckpoint} className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Where did you stop? (Checkpoint)
              </label>
              <Textarea
                value={checkpointText}
                onChange={(e) => setCheckpointText(e.target.value)}
                rows={3}
                required
                className="text-xs bg-zinc-900/80 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Immediate Next Action
              </label>
              <Textarea
                value={nextStepText}
                onChange={(e) => setNextStepText(e.target.value)}
                rows={2}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCheckpointModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Checkpoint
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
