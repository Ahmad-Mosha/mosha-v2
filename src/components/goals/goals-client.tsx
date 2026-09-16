"use client";

import * as React from "react";
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  FolderKanban,
  BookOpen,
  Sparkles,
  Trash2,
  Quote,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import {
  Goal,
  GoalMilestone,
  GoalReflection,
  Project,
} from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EntityNotes } from "@/components/notes/entity-notes";
import {
  createGoalAction,
  createMilestoneAction,
  toggleMilestoneAction,
  deleteMilestoneAction,
  addReflectionAction,
  deleteGoalAction,
} from "@/lib/actions/goals";
import { formatDate } from "@/lib/utils";

type GoalWithDetails = Goal & {
  milestones: GoalMilestone[];
  reflections: GoalReflection[];
  linkedProjects: Project[];
};

interface GoalsClientProps {
  initialGoals: GoalWithDetails[];
}

export function GoalsClient({ initialGoals }: GoalsClientProps) {
  const [goalsList, setGoalsList] = React.useState(initialGoals);
  const [activeCategory, setActiveCategory] = React.useState<string>("all");

  // Modals
  const [isNewGoalOpen, setIsNewGoalOpen] = React.useState(false);
  const [activeGoalForMilestone, setActiveGoalForMilestone] = React.useState<string | null>(null);
  const [activeGoalForReflection, setActiveGoalForReflection] = React.useState<string | null>(null);

  // New Goal Form
  const [newTitle, setNewTitle] = React.useState("");
  const [newCategory, setNewCategory] = React.useState<"engineering" | "career" | "fitness" | "financial" | "personal">("engineering");
  const [newIcon, setNewIcon] = React.useState("🎯");
  const [newTarget, setNewTarget] = React.useState("2026-12-31");
  const [newVision, setNewVision] = React.useState("");

  // Milestone Form
  const [msTitle, setMsTitle] = React.useState("");
  const [msDate, setMsDate] = React.useState("");

  // Reflection Form
  const [refTitle, setRefTitle] = React.useState("");
  const [refContent, setRefContent] = React.useState("");

  const filteredGoals = React.useMemo(() => {
    if (activeCategory === "all") return goalsList;
    return goalsList.filter((g) => g.category === activeCategory);
  }, [goalsList, activeCategory]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await createGoalAction({
      title: newTitle.trim(),
      category: newCategory,
      icon: newIcon.trim() || "🎯",
      targetYearOrDate: newTarget || undefined,
      visionStatement: newVision.trim(),
    });

    if (res.id) {
      window.location.reload();
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoalForMilestone || !msTitle.trim()) return;

    await createMilestoneAction({
      goalId: activeGoalForMilestone,
      title: msTitle.trim(),
      targetDate: msDate || undefined,
    });

    setMsTitle("");
    setMsDate("");
    setActiveGoalForMilestone(null);
    window.location.reload();
  };

  const handleToggleMilestone = async (ms: GoalMilestone) => {
    const next = !ms.completed;
    await toggleMilestoneAction(ms.id, next);
    setGoalsList((prev) =>
      prev.map((g) =>
        g.id === ms.goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) =>
                m.id === ms.id ? { ...m, completed: next } : m
              ),
            }
          : g
      )
    );
  };

  const handleDeleteMilestone = async (msId: string, goalId: string) => {
    await deleteMilestoneAction(msId);
    setGoalsList((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.filter((m) => m.id !== msId),
            }
          : g
      )
    );
  };

  const handleAddReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoalForReflection || !refTitle.trim() || !refContent.trim()) return;

    await addReflectionAction({
      goalId: activeGoalForReflection,
      title: refTitle.trim(),
      content: refContent.trim(),
    });

    setRefTitle("");
    setRefContent("");
    setActiveGoalForReflection(null);
    window.location.reload();
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm("Delete this major goal?")) {
      await deleteGoalAction(goalId);
      setGoalsList((prev) => prev.filter((g) => g.id !== goalId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">
            Major Long-Term Goals
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            North Stars with emotional presence, milestones, reflections, and linked engineering projects.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsNewGoalOpen(true)}
          className="h-8 text-xs gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Goal</span>
        </Button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all", label: "All Goals" },
          { id: "engineering", label: "Engineering" },
          { id: "fitness", label: "Fitness" },
          { id: "career", label: "Career & Life" },
          { id: "financial", label: "Financial" },
          { id: "personal", label: "Personal" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === cat.id
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-zinc-800/60"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="space-y-6">
        {filteredGoals.map((goal) => {
          const completedMilestones = goal.milestones.filter((m) => m.completed).length;
          const totalMilestones = goal.milestones.length;

          return (
            <div
              key={goal.id}
              className="p-6 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-5 shadow-xs"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <span className="text-2xl p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                    {goal.icon}
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">
                      {goal.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                        {goal.category}
                      </Badge>
                      {goal.targetYearOrDate && (
                        <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-500" />
                          <span>Target: {formatDate(goal.targetYearOrDate)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveGoalForMilestone(goal.id)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Milestone
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveGoalForReflection(goal.id)}
                    className="h-7 text-xs"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Reflect
                  </Button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1.5 text-zinc-600 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Emotional Vision Statement */}
              {goal.visionStatement && (
                <div className="p-3.5 rounded-md bg-zinc-900/50 border border-zinc-800/60 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400/90 flex items-center gap-1">
                    <Quote className="h-3 w-3" />
                    Vision & Core Motivation
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed italic">
                    &ldquo;{goal.visionStatement}&rdquo;
                  </p>
                </div>
              )}

              {/* Linked Contributing Projects */}
              {goal.linkedProjects.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                    <FolderKanban className="h-3 w-3 text-zinc-400" />
                    Directly Contributing Projects
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {goal.linkedProjects.map((p) => (
                      <div
                        key={p.id}
                        className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-1.5"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>{p.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs: Milestones vs Reflections vs Goal Notes */}
              <Tabs defaultValue="milestones" className="w-full">
                <TabsList className="grid grid-cols-3 w-full h-8 bg-zinc-900/90 border border-zinc-800/80">
                  <TabsTrigger value="milestones" className="text-xs">
                    Milestones ({completedMilestones}/{totalMilestones})
                  </TabsTrigger>
                  <TabsTrigger value="reflections" className="text-xs">
                    Reflections & Journal ({goal.reflections.length})
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs">
                    Goal Notes & Strategy
                  </TabsTrigger>
                </TabsList>

                {/* Milestones Tab */}
                <TabsContent value="milestones" className="space-y-2.5 mt-3">
                  {goal.milestones.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-600 italic border border-dashed border-zinc-800/80 rounded-md">
                      No milestones set for this goal yet.
                    </div>
                  ) : (
                    goal.milestones.map((ms) => (
                      <div
                        key={ms.id}
                        className="p-2.5 rounded bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between text-xs"
                      >
                        <div
                          onClick={() => handleToggleMilestone(ms)}
                          className="flex items-center gap-2.5 cursor-pointer flex-1"
                        >
                          {ms.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-zinc-500 shrink-0" />
                          )}
                          <span
                            className={
                              ms.completed
                                ? "text-zinc-500 line-through"
                                : "text-zinc-200 font-medium"
                            }
                          >
                            {ms.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {ms.targetDate && (
                            <span className="text-[10px] font-mono text-zinc-500">
                              Target: {formatDate(ms.targetDate)}
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteMilestone(ms.id, goal.id)}
                            className="text-zinc-600 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Reflections Tab */}
                <TabsContent value="reflections" className="space-y-3 mt-3">
                  {goal.reflections.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-600 italic border border-dashed border-zinc-800/80 rounded-md">
                      No periodic reflections logged yet.
                    </div>
                  ) : (
                    goal.reflections.map((ref) => (
                      <div
                        key={ref.id}
                        className="p-3.5 rounded bg-zinc-900/40 border border-zinc-800/60 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-zinc-200">
                            {ref.title}
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {formatDate(ref.date)}
                          </span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed">
                          {ref.content}
                        </p>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Notes Tab: Embedded Polymorphic EntityNotes! */}
                <TabsContent value="notes" className="mt-3">
                  <EntityNotes
                    entityType="goal"
                    entityId={goal.id}
                    entityTitle={goal.title}
                  />
                </TabsContent>
              </Tabs>
            </div>
          );
        })}
      </div>

      {/* New Major Goal Dialog */}
      <Dialog open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Establish Major Life Goal (North Star)
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGoal} className="space-y-3 pt-2">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Icon
                </label>
                <Input
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="text-center text-base h-8 bg-zinc-900/80"
                />
              </div>
              <div className="col-span-3">
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Goal Title
                </label>
                <Input
                  placeholder="e.g. Master Distributed Systems Architecture"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="text-xs bg-zinc-900/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="engineering">Engineering</option>
                  <option value="fitness">Fitness</option>
                  <option value="career">Career & Life</option>
                  <option value="financial">Financial</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Target Timeframe / Date
                </label>
                <input
                  type="date"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Vision & Emotional Anchor (Why this matters)
              </label>
              <Textarea
                placeholder="Describe what life looks like once achieved, and the underlying motivation..."
                value={newVision}
                onChange={(e) => setNewVision(e.target.value)}
                rows={3}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewGoalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!newTitle.trim()}>
                Establish Goal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Milestone Dialog */}
      <Dialog
        open={!!activeGoalForMilestone}
        onOpenChange={(open) => !open && setActiveGoalForMilestone(null)}
      >
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Add Goal Milestone
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateMilestone} className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Milestone Title
              </label>
              <Input
                placeholder="e.g. Implement Raft consensus from scratch in Go..."
                value={msTitle}
                onChange={(e) => setMsTitle(e.target.value)}
                required
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Target Date (optional)
              </label>
              <input
                type="date"
                value={msDate}
                onChange={(e) => setMsDate(e.target.value)}
                className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveGoalForMilestone(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!msTitle.trim()}>
                Add Milestone
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Reflection Dialog */}
      <Dialog
        open={!!activeGoalForReflection}
        onOpenChange={(open) => !open && setActiveGoalForReflection(null)}
      >
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Add Goal Reflection / Log Update
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddReflection} className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Reflection Title
              </label>
              <Input
                placeholder="e.g. Breakthrough on election timeouts..."
                value={refTitle}
                onChange={(e) => setRefTitle(e.target.value)}
                required
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Reflection Notes & Lessons Learned
              </label>
              <Textarea
                placeholder="What did you learn? How has your approach evolved?"
                value={refContent}
                onChange={(e) => setRefContent(e.target.value)}
                rows={4}
                required
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveGoalForReflection(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!refTitle.trim() || !refContent.trim()}>
                Save Reflection
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
