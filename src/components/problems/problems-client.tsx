"use client";

import * as React from "react";
import {
  Code2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  RotateCw,
  Zap,
  Tag,
  Trash2,
  FileText,
  Check,
} from "lucide-react";
import { Problem, ProblemAttempt } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityNotes } from "@/components/notes/entity-notes";
import {
  createProblemAction,
  toggleRevisionAction,
  logProblemAttemptAction,
  deleteProblemAction,
} from "@/lib/actions/problems";
import { formatDate } from "@/lib/utils";

type ProblemWithAttempts = Problem & { attempts: ProblemAttempt[] };

interface ProblemsClientProps {
  initialProblems: ProblemWithAttempts[];
}

export function ProblemsClient({ initialProblems }: ProblemsClientProps) {
  const [problemsList, setProblemsList] = React.useState(initialProblems);
  const [activeProblem, setActiveProblem] = React.useState<ProblemWithAttempts | null>(
    initialProblems[0] || null
  );
  const [filterMode, setFilterMode] = React.useState<"all" | "revision" | "easy" | "medium" | "hard">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modals
  const [isNewProblemOpen, setIsNewProblemOpen] = React.useState(false);
  const [isLogAttemptOpen, setIsLogAttemptOpen] = React.useState(false);

  // New Problem Form
  const [newTitle, setNewTitle] = React.useState("");
  const [newPlatform, setNewPlatform] = React.useState<"leetcode" | "codeforces" | "neetcode" | "system_design" | "other">("leetcode");
  const [newDiff, setNewDiff] = React.useState<"easy" | "medium" | "hard">("medium");
  const [newTags, setNewTags] = React.useState("");
  const [newUrl, setNewUrl] = React.useState("");
  const [newTimeComp, setNewTimeComp] = React.useState("");
  const [newSpaceComp, setNewSpaceComp] = React.useState("");
  const [newInsight, setNewInsight] = React.useState("");
  const [newNeedsRevision, setNewNeedsRevision] = React.useState(false);

  // Log Attempt Form
  const [attMinutes, setAttMinutes] = React.useState("25");
  const [attPassed, setAttPassed] = React.useState(true);
  const [attLanguage, setAttLanguage] = React.useState("TypeScript");
  const [attCode, setAttCode] = React.useState("");
  const [attNotes, setAttNotes] = React.useState("");

  // Stats calculation
  const totalCount = problemsList.length;
  const easyCount = problemsList.filter((p) => p.difficulty === "easy").length;
  const mediumCount = problemsList.filter((p) => p.difficulty === "medium").length;
  const hardCount = problemsList.filter((p) => p.difficulty === "hard").length;
  const revisionCount = problemsList.filter((p) => p.needsRevision).length;

  const filteredProblems = React.useMemo(() => {
    return problemsList.filter((p) => {
      // Filter tab
      if (filterMode === "revision" && !p.needsRevision) return false;
      if (filterMode === "easy" && p.difficulty !== "easy") return false;
      if (filterMode === "medium" && p.difficulty !== "medium") return false;
      if (filterMode === "hard" && p.difficulty !== "hard") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchInsight = p.keyInsight?.toLowerCase().includes(q);
        const matchTags = p.topicTags?.toLowerCase().includes(q);
        return matchTitle || matchInsight || matchTags;
      }
      return true;
    });
  }, [problemsList, filterMode, searchQuery]);

  const handleToggleRevision = async (problemId: string, currentVal: boolean) => {
    const next = !currentVal;
    await toggleRevisionAction(problemId, next);
    setProblemsList((prev) =>
      prev.map((p) => (p.id === problemId ? { ...p, needsRevision: next } : p))
    );
    if (activeProblem?.id === problemId) {
      setActiveProblem((prev) => (prev ? { ...prev, needsRevision: next } : null));
    }
  };

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tagsArr = newTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await createProblemAction({
      title: newTitle.trim(),
      platform: newPlatform,
      difficulty: newDiff,
      topicTags: tagsArr,
      url: newUrl.trim() || undefined,
      bestTimeComplexity: newTimeComp.trim() || undefined,
      bestSpaceComplexity: newSpaceComp.trim() || undefined,
      keyInsight: newInsight.trim() || undefined,
      needsRevision: newNeedsRevision,
    });

    if (res.id) {
      const created: ProblemWithAttempts = {
        id: res.id,
        title: newTitle.trim(),
        platform: newPlatform,
        difficulty: newDiff,
        topicTags: JSON.stringify(tagsArr),
        status: "solved",
        url: newUrl.trim() || null,
        needsRevision: newNeedsRevision,
        revisionDate: newNeedsRevision ? new Date().toISOString().split("T")[0] : null,
        bestTimeComplexity: newTimeComp.trim() || null,
        bestSpaceComplexity: newSpaceComp.trim() || null,
        keyInsight: newInsight.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attempts: [],
      };
      setProblemsList([created, ...problemsList]);
      setActiveProblem(created);
      setNewTitle("");
      setNewTags("");
      setNewUrl("");
      setNewTimeComp("");
      setNewSpaceComp("");
      setNewInsight("");
      setIsNewProblemOpen(false);
    }
  };

  const handleLogAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProblem) return;
    const mins = parseInt(attMinutes) || 20;

    const res = await logProblemAttemptAction({
      problemId: activeProblem.id,
      timeSpentMinutes: mins,
      passed: attPassed,
      language: attLanguage,
      solutionCode: attCode,
      notes: attNotes,
    });

    if (res.id) {
      const newAtt: ProblemAttempt = {
        id: res.id,
        problemId: activeProblem.id,
        date: new Date().toISOString().split("T")[0],
        timeSpentMinutes: mins,
        passed: attPassed,
        language: attLanguage,
        solutionCode: attCode.trim(),
        notes: attNotes.trim(),
        createdAt: new Date().toISOString(),
      };
      const updated = {
        ...activeProblem,
        attempts: [newAtt, ...activeProblem.attempts],
      };
      setActiveProblem(updated);
      setProblemsList((prev) =>
        prev.map((p) => (p.id === activeProblem.id ? updated : p))
      );
      setAttCode("");
      setAttNotes("");
      setIsLogAttemptOpen(false);
    }
  };

  const handleDeleteProblem = async () => {
    if (!activeProblem) return;
    if (confirm(`Delete problem "${activeProblem.title}"?`)) {
      await deleteProblemAction(activeProblem.id);
      const remaining = problemsList.filter((p) => p.id !== activeProblem.id);
      setProblemsList(remaining);
      setActiveProblem(remaining[0] || null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Algorithmic Problem Solving
            </h1>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {totalCount} Problems
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deliberate practice, key algorithmic insights, and spaced revision.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsNewProblemOpen(true)}
          className="h-8 text-xs gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Problem</span>
        </Button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
          <span className="text-xs text-zinc-400">Total Solved</span>
          <span className="text-base font-bold font-mono text-zinc-100">
            {totalCount}
          </span>
        </div>
        <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
          <span className="text-xs text-emerald-400/90">Easy</span>
          <span className="text-base font-bold font-mono text-emerald-400">
            {easyCount}
          </span>
        </div>
        <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
          <span className="text-xs text-amber-400/90">Medium</span>
          <span className="text-base font-bold font-mono text-amber-400">
            {mediumCount}
          </span>
        </div>
        <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
          <span className="text-xs text-rose-400/90">Hard</span>
          <span className="text-base font-bold font-mono text-rose-400">
            {hardCount}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: "All" },
            { id: "revision", label: `Revision Queue (${revisionCount})` },
            { id: "easy", label: "Easy" },
            { id: "medium", label: "Medium" },
            { id: "hard", label: "Hard" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as any)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filterMode === tab.id
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs"
                  : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-zinc-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <Input
            placeholder="Search problems or patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-zinc-900/80"
          />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Problems List */}
        <div className="space-y-2 lg:col-span-1">
          {filteredProblems.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-800/80 rounded-lg">
              No problems found matching criteria.
            </div>
          ) : (
            filteredProblems.map((prob) => {
              const isSelected = prob.id === activeProblem?.id;
              let tagsArr: string[] = [];
              try {
                tagsArr = JSON.parse(prob.topicTags || "[]");
              } catch {}

              return (
                <div
                  key={prob.id}
                  onClick={() => setActiveProblem(prob)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-900 border-zinc-700 shadow-xs"
                      : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-200">
                        {prob.title}
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-mono capitalize">
                        {prob.platform}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          prob.difficulty === "hard"
                            ? "danger"
                            : prob.difficulty === "medium"
                            ? "warning"
                            : "success"
                        }
                        className="text-[9px] uppercase font-mono"
                      >
                        {prob.difficulty}
                      </Badge>

                      {prob.needsRevision && (
                        <RotateCw className="h-3 w-3 text-amber-400 animate-spin-slow" />
                      )}
                    </div>
                  </div>

                  {/* Insight snippet */}
                  {prob.keyInsight && (
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-1.5 italic">
                      &ldquo;{prob.keyInsight}&rdquo;
                    </p>
                  )}

                  {/* Complexity & Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {prob.bestTimeComplexity && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {prob.bestTimeComplexity}
                      </span>
                    )}
                    {tagsArr.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-950 border border-zinc-800/80 text-zinc-500"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Problem Detail & Attempts */}
        {activeProblem ? (
          <div className="lg:col-span-2 space-y-5">
            {/* Header & Insight Card */}
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-zinc-100">
                      {activeProblem.title}
                    </h2>
                    <Badge
                      variant={
                        activeProblem.difficulty === "hard"
                          ? "danger"
                          : activeProblem.difficulty === "medium"
                          ? "warning"
                          : "success"
                      }
                      className="text-[10px] uppercase font-mono"
                    >
                      {activeProblem.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 font-mono">
                    <span className="capitalize">{activeProblem.platform}</span>
                    {activeProblem.url && (
                      <a
                        href={activeProblem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-zinc-100 flex items-center gap-1 ml-2"
                      >
                        <span>Original Problem</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={activeProblem.needsRevision ? "default" : "outline"}
                    onClick={() =>
                      handleToggleRevision(
                        activeProblem.id,
                        activeProblem.needsRevision
                      )
                    }
                    className="h-7 text-xs gap-1.5"
                  >
                    <RotateCw className="h-3.5 w-3.5 text-amber-400" />
                    <span>
                      {activeProblem.needsRevision
                        ? "Due for Revision"
                        : "Mark for Revision"}
                    </span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsLogAttemptOpen(true)}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Log Attempt</span>
                  </Button>

                  <button
                    onClick={handleDeleteProblem}
                    className="p-1.5 text-zinc-600 hover:text-rose-400 rounded transition-colors cursor-pointer"
                    title="Delete Problem"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Key Algorithmic Insight Card */}
              {activeProblem.keyInsight && (
                <div className="p-3.5 rounded-md bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    Key Algorithmic Breakthrough
                  </span>
                  <p className="text-xs text-zinc-200 leading-relaxed italic">
                    &ldquo;{activeProblem.keyInsight}&rdquo;
                  </p>
                </div>
              )}

              {/* Complexities & Tags */}
              <div className="flex items-center justify-between gap-4 pt-1 flex-wrap text-xs font-mono">
                <div className="flex items-center gap-3">
                  {activeProblem.bestTimeComplexity && (
                    <div className="flex items-center gap-1 text-zinc-400">
                      <span className="text-zinc-600">Time:</span>
                      <span className="text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {activeProblem.bestTimeComplexity}
                      </span>
                    </div>
                  )}
                  {activeProblem.bestSpaceComplexity && (
                    <div className="flex items-center gap-1 text-zinc-400">
                      <span className="text-zinc-600">Space:</span>
                      <span className="text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {activeProblem.bestSpaceComplexity}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  {(() => {
                    try {
                      const tags = JSON.parse(
                        activeProblem.topicTags || "[]"
                      ) as string[];
                      return tags.map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          #{t}
                        </Badge>
                      ));
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Tabs: Attempt History vs Problem Notes */}
            <Tabs defaultValue="attempts" className="w-full">
              <TabsList className="grid grid-cols-2 w-full h-8 bg-zinc-900/90 border border-zinc-800/80">
                <TabsTrigger value="attempts" className="text-xs">
                  Attempt History ({activeProblem.attempts.length})
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs">
                  Solution Notes & Edge Cases
                </TabsTrigger>
              </TabsList>

              {/* Attempts Tab */}
              <TabsContent value="attempts" className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                    Past Practice Sessions
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsLogAttemptOpen(true)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Log Attempt
                  </Button>
                </div>

                {activeProblem.attempts.length === 0 ? (
                  <div className="py-10 text-center text-xs text-zinc-600 italic border border-dashed border-zinc-800/80 rounded-md">
                    No attempts logged for this problem yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProblem.attempts.map((att) => (
                      <div
                        key={att.id}
                        className="rounded-md bg-zinc-950/70 border border-zinc-800/80 overflow-hidden text-xs"
                      >
                        <div className="p-3 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/40">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                att.passed ? "bg-emerald-400" : "bg-rose-400"
                              }`}
                            />
                            <span className="font-mono text-zinc-300">
                              {formatDate(att.date)}
                            </span>
                            <Badge variant="secondary" className="text-[9px] font-mono">
                              {att.language}
                            </Badge>
                          </div>
                          <span className="font-mono text-zinc-400">
                            {att.timeSpentMinutes} mins
                          </span>
                        </div>

                        {att.notes && (
                          <div className="p-3 text-zinc-300 text-xs">
                            {att.notes}
                          </div>
                        )}

                        {att.solutionCode && (
                          <div className="border-t border-zinc-800/60 bg-zinc-950 p-3 font-mono text-[11px] overflow-x-auto text-zinc-300 leading-relaxed">
                            <pre>
                              <code>{att.solutionCode}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Notes Tab: Embedded Polymorphic EntityNotes! */}
              <TabsContent value="notes" className="mt-4">
                <EntityNotes
                  entityType="problem"
                  entityId={activeProblem.id}
                  entityTitle={activeProblem.title}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>

      {/* Log Attempt Dialog */}
      <Dialog open={isLogAttemptOpen} onOpenChange={setIsLogAttemptOpen}>
        <DialogContent className="max-w-lg p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Log Problem Attempt ({activeProblem?.title})
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogAttempt} className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Time (Minutes)
                </label>
                <Input
                  type="number"
                  value={attMinutes}
                  onChange={(e) => setAttMinutes(e.target.value)}
                  required
                  className="h-8 text-xs bg-zinc-900/80 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Language
                </label>
                <select
                  value={attLanguage}
                  onChange={(e) => setAttLanguage(e.target.value)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="TypeScript">TypeScript</option>
                  <option value="Go">Go</option>
                  <option value="Python">Python</option>
                  <option value="C++">C++</option>
                  <option value="Rust">Rust</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Outcome
                </label>
                <select
                  value={attPassed ? "passed" : "failed"}
                  onChange={(e) => setAttPassed(e.target.value === "passed")}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="passed">Passed (Accepted)</option>
                  <option value="failed">Failed / Attempted</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Solution Code (optional)
              </label>
              <Textarea
                placeholder="Paste working solution code..."
                value={attCode}
                onChange={(e) => setAttCode(e.target.value)}
                rows={5}
                className="text-xs bg-zinc-900/80 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Reflection / Bugs encountered
              </label>
              <Input
                placeholder="e.g. Edge case when array length is 0..."
                value={attNotes}
                onChange={(e) => setAttNotes(e.target.value)}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsLogAttemptOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Attempt
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Problem Dialog */}
      <Dialog open={isNewProblemOpen} onOpenChange={setIsNewProblemOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Add New Algorithmic Problem
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProblem} className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Problem Title
              </label>
              <Input
                placeholder="e.g. Course Schedule II"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Platform
                </label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as any)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="leetcode">LeetCode</option>
                  <option value="codeforces">Codeforces</option>
                  <option value="neetcode">NeetCode</option>
                  <option value="system_design">System Design</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Difficulty
                </label>
                <select
                  value={newDiff}
                  onChange={(e) => setNewDiff(e.target.value as any)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Pattern Tags (comma separated)
              </label>
              <Input
                placeholder="e.g. Graph, Topological Sort, BFS"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Best Time
                </label>
                <Input
                  placeholder="e.g. O(V + E)"
                  value={newTimeComp}
                  onChange={(e) => setNewTimeComp(e.target.value)}
                  className="text-xs bg-zinc-900/80 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Best Space
                </label>
                <Input
                  placeholder="e.g. O(V)"
                  value={newSpaceComp}
                  onChange={(e) => setNewSpaceComp(e.target.value)}
                  className="text-xs bg-zinc-900/80 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Key Breakthrough / Intuition
              </label>
              <Textarea
                placeholder="What is the key trick or reduction?"
                value={newInsight}
                onChange={(e) => setNewInsight(e.target.value)}
                rows={2}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="new-revision"
                checked={newNeedsRevision}
                onChange={(e) => setNewNeedsRevision(e.target.checked)}
                className="rounded bg-zinc-900 border-zinc-700 text-zinc-100"
              />
              <label htmlFor="new-revision" className="text-xs text-zinc-300 cursor-pointer">
                Queue for Spaced Revision
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewProblemOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!newTitle.trim()}>
                Create Problem
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
