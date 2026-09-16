"use client";

import * as React from "react";
import {
  BookOpen,
  Plus,
  Clock,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Circle,
  FileText,
  Bookmark,
  Calendar,
  Layers,
  ArrowRight,
  Trash2,
  Edit2,
} from "lucide-react";
import {
  LearningTopic,
  LearningResource,
  StudySession,
} from "@/lib/db/schema";
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
  createLearningTopicAction,
  updateCheckpointAction,
  toggleFocusTopicAction,
  addLearningResourceAction,
  updateResourceStatusAction,
  logStudySessionAction,
  deleteLearningTopicAction,
} from "@/lib/actions/learning";
import { formatDate } from "@/lib/utils";

type TopicWithDetails = LearningTopic & {
  resources: LearningResource[];
  sessions: StudySession[];
};

interface LearningClientProps {
  initialTopics: TopicWithDetails[];
}

const CATEGORIES = [
  { id: "all", label: "All Topics" },
  { id: "systems", label: "Operating Systems" },
  { id: "networking", label: "Networking" },
  { id: "databases", label: "Databases" },
  { id: "distributed", label: "Distributed Systems" },
  { id: "languages", label: "Languages & Runtimes" },
  { id: "architecture", label: "Architecture" },
];

export function LearningClient({ initialTopics }: LearningClientProps) {
  const [topics, setTopics] = React.useState<TopicWithDetails[]>(initialTopics);
  const [activeTopicId, setActiveTopicId] = React.useState<string>(
    initialTopics[0]?.id || ""
  );
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  // Modals
  const [isNewTopicOpen, setIsNewTopicOpen] = React.useState(false);
  const [isLogSessionOpen, setIsLogSessionOpen] = React.useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = React.useState(false);
  const [isEditCheckpointOpen, setIsEditCheckpointOpen] = React.useState(false);

  // New Topic Form
  const [newTitle, setNewTitle] = React.useState("");
  const [newCat, setNewCat] = React.useState<"systems" | "networking" | "databases" | "languages" | "distributed" | "architecture" | "other">("systems");
  const [newIcon, setNewIcon] = React.useState("📚");
  const [newDiff, setNewDiff] = React.useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [newCp, setNewCp] = React.useState("");
  const [newNext, setNewNext] = React.useState("");

  // Checkpoint Edit Form
  const [editCp, setEditCp] = React.useState("");
  const [editNext, setEditNext] = React.useState("");

  // Study Session Form
  const [sessionMinutes, setSessionMinutes] = React.useState("60");
  const [sessionDate, setSessionDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [sessionSummary, setSessionSummary] = React.useState("");

  // Resource Form
  const [resTitle, setResTitle] = React.useState("");
  const [resUrl, setResUrl] = React.useState("");
  const [resType, setResType] = React.useState<"book" | "paper" | "course" | "doc" | "video" | "repo">("book");
  const [resNotes, setResNotes] = React.useState("");

  const activeTopic = topics.find((t) => t.id === activeTopicId) || topics[0];

  React.useEffect(() => {
    if (activeTopic) {
      setEditCp(activeTopic.currentCheckpoint);
      setEditNext(activeTopic.nextStep);
    }
  }, [activeTopicId]);

  const filteredTopics = React.useMemo(() => {
    if (categoryFilter === "all") return topics;
    return topics.filter((t) => t.category === categoryFilter);
  }, [topics, categoryFilter]);

  // Handlers
  const handleToggleFocus = async () => {
    if (!activeTopic) return;
    const nextVal = !activeTopic.isCurrentFocus;
    await toggleFocusTopicAction(activeTopic.id, nextVal);
    setTopics((prev) =>
      prev.map((t) => (t.id === activeTopic.id ? { ...t, isCurrentFocus: nextVal } : t))
    );
  };

  const handleSaveCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopic) return;
    await updateCheckpointAction(activeTopic.id, editCp, editNext);
    setTopics((prev) =>
      prev.map((t) =>
        t.id === activeTopic.id
          ? { ...t, currentCheckpoint: editCp, nextStep: editNext }
          : t
      )
    );
    setIsEditCheckpointOpen(false);
  };

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopic) return;
    const mins = parseInt(sessionMinutes) || 30;

    const res = await logStudySessionAction({
      topicId: activeTopic.id,
      durationMinutes: mins,
      date: sessionDate,
      summary: sessionSummary,
    });

    if (res.id) {
      const newSession: StudySession = {
        id: res.id,
        topicId: activeTopic.id,
        durationMinutes: mins,
        date: sessionDate,
        summary: sessionSummary.trim(),
        createdAt: new Date().toISOString(),
      };
      setTopics((prev) =>
        prev.map((t) =>
          t.id === activeTopic.id
            ? { ...t, sessions: [newSession, ...t.sessions] }
            : t
        )
      );
      setSessionSummary("");
      setIsLogSessionOpen(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopic || !resTitle.trim()) return;

    const res = await addLearningResourceAction({
      topicId: activeTopic.id,
      title: resTitle.trim(),
      url: resUrl.trim() || undefined,
      type: resType,
      notes: resNotes.trim(),
    });

    if (res.id) {
      const newRes: LearningResource = {
        id: res.id,
        topicId: activeTopic.id,
        title: resTitle.trim(),
        url: resUrl.trim() || null,
        type: resType,
        status: "queued",
        notes: resNotes.trim(),
        createdAt: new Date().toISOString(),
      };
      setTopics((prev) =>
        prev.map((t) =>
          t.id === activeTopic.id
            ? { ...t, resources: [...t.resources, newRes] }
            : t
        )
      );
      setResTitle("");
      setResUrl("");
      setResNotes("");
      setIsAddResourceOpen(false);
    }
  };

  const handleResourceStatusChange = async (
    resourceId: string,
    status: "queued" | "active" | "completed"
  ) => {
    await updateResourceStatusAction(resourceId, status);
    setTopics((prev) =>
      prev.map((t) => ({
        ...t,
        resources: t.resources.map((r) =>
          r.id === resourceId ? { ...r, status } : r
        ),
      }))
    );
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await createLearningTopicAction({
      title: newTitle.trim(),
      category: newCat,
      icon: newIcon.trim() || "📚",
      difficulty: newDiff,
      currentCheckpoint: newCp.trim(),
      nextStep: newNext.trim(),
      isCurrentFocus: true,
    });

    if (res.id) {
      const created: TopicWithDetails = {
        id: res.id,
        title: newTitle.trim(),
        category: newCat,
        icon: newIcon.trim() || "📚",
        status: "in_progress",
        difficulty: newDiff,
        currentCheckpoint: newCp.trim(),
        nextStep: newNext.trim(),
        isCurrentFocus: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resources: [],
        sessions: [],
      };
      setTopics([created, ...topics]);
      setActiveTopicId(created.id);
      setNewTitle("");
      setNewCp("");
      setNewNext("");
      setIsNewTopicOpen(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!activeTopic) return;
    if (confirm(`Are you sure you want to delete topic "${activeTopic.title}"?`)) {
      await deleteLearningTopicAction(activeTopic.id);
      const remaining = topics.filter((t) => t.id !== activeTopic.id);
      setTopics(remaining);
      setActiveTopicId(remaining[0]?.id || "");
    }
  };

  const totalStudyMinutes = activeTopic
    ? activeTopic.sessions.reduce((acc, s) => acc + s.durationMinutes, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Technical Learning & Mastery
            </h1>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {topics.length} Topics
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Continuous engineering depth, stateful checkpoints, and study attention logging.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsNewTopicOpen(true)}
          className="h-8 text-xs gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Topic</span>
        </Button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === cat.id
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-zinc-800/60"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Topics List */}
        <div className="space-y-2 lg:col-span-1">
          {filteredTopics.map((topic) => {
            const isSelected = topic.id === activeTopicId;
            const hours = (
              topic.sessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60
            ).toFixed(1);

            return (
              <div
                key={topic.id}
                onClick={() => setActiveTopicId(topic.id)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-zinc-900 border-zinc-700 shadow-xs"
                    : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{topic.icon}</span>
                    <h3 className="text-xs font-semibold text-zinc-200">
                      {topic.title}
                    </h3>
                  </div>
                  {topic.isCurrentFocus && (
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                    {topic.category}
                  </Badge>
                  <Badge
                    variant={
                      topic.difficulty === "advanced"
                        ? "danger"
                        : topic.difficulty === "intermediate"
                        ? "warning"
                        : "outline"
                    }
                    className="text-[9px] uppercase font-mono"
                  >
                    {topic.difficulty}
                  </Badge>
                  <span className="text-[10px] font-mono text-zinc-500 ml-auto">
                    {hours}h logged
                  </span>
                </div>

                {topic.currentCheckpoint && (
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-2 pl-2 border-l border-indigo-500/40 font-mono">
                    {topic.currentCheckpoint}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Topic Deep Dive */}
        {activeTopic && (
          <div className="lg:col-span-2 space-y-6">
            {/* Topic Header Card */}
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 rounded-md bg-zinc-900 border border-zinc-800">
                    {activeTopic.icon}
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">
                      {activeTopic.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                        {activeTopic.category}
                      </Badge>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {(totalStudyMinutes / 60).toFixed(1)} hours studied &bull;{" "}
                        {activeTopic.sessions.length} sessions
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={activeTopic.isCurrentFocus ? "default" : "outline"}
                    onClick={handleToggleFocus}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>
                      {activeTopic.isCurrentFocus ? "Current Focus" : "Set as Focus"}
                    </span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsLogSessionOpen(true)}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Log Session</span>
                  </Button>

                  <button
                    onClick={handleDeleteTopic}
                    className="p-1.5 text-zinc-600 hover:text-rose-400 rounded transition-colors"
                    title="Delete Topic"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* The Two Critical Checkpoint Callouts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Where did I stop? */}
                <div className="p-3.5 rounded-md bg-zinc-900/60 border border-zinc-800/80 space-y-1 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      Where I Stopped
                    </span>
                    <button
                      onClick={() => setIsEditCheckpointOpen(true)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200 transition-opacity p-0.5"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 font-mono leading-relaxed">
                    {activeTopic.currentCheckpoint || "No checkpoint logged. Click to add."}
                  </p>
                </div>

                {/* What's next? */}
                <div className="p-3.5 rounded-md bg-zinc-900/40 border border-zinc-800/70 space-y-1 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3" />
                      Immediate Next Action
                    </span>
                    <button
                      onClick={() => setIsEditCheckpointOpen(true)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200 transition-opacity p-0.5"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    {activeTopic.nextStep || "No next action configured. Click to add."}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs: Study Sessions vs Resources vs Notes */}
            <Tabs defaultValue="sessions" className="w-full">
              <TabsList className="grid grid-cols-3 w-full h-8 bg-zinc-900/90 border border-zinc-800/80">
                <TabsTrigger value="sessions" className="text-xs">
                  Study Log ({activeTopic.sessions.length})
                </TabsTrigger>
                <TabsTrigger value="resources" className="text-xs">
                  Resources ({activeTopic.resources.length})
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs">
                  Topic Notes
                </TabsTrigger>
              </TabsList>

              {/* Study Sessions Tab */}
              <TabsContent value="sessions" className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                    Study Sessions Timeline
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsLogSessionOpen(true)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Log Study Session
                  </Button>
                </div>

                {activeTopic.sessions.length === 0 ? (
                  <div className="py-10 text-center text-xs text-zinc-600 italic border border-dashed border-zinc-800/80 rounded-md">
                    No study sessions recorded yet. Log your first session!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeTopic.sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3.5 rounded-md bg-zinc-950/70 border border-zinc-800/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-zinc-300">
                            {formatDate(sess.date)}
                          </span>
                          <Badge variant="accent" className="font-mono text-[10px]">
                            {sess.durationMinutes} min ({ (sess.durationMinutes / 60).toFixed(1) }h)
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {sess.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                    Books, Research Papers & RFCs
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddResourceOpen(true)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Resource
                  </Button>
                </div>

                {activeTopic.resources.length === 0 ? (
                  <div className="py-10 text-center text-xs text-zinc-600 italic border border-dashed border-zinc-800/80 rounded-md">
                    No learning resources registered yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeTopic.resources.map((res) => (
                      <div
                        key={res.id}
                        className="p-3 rounded-md bg-zinc-950/70 border border-zinc-800/70 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-200">
                              {res.title}
                            </span>
                            <Badge variant="secondary" className="text-[9px] uppercase font-mono">
                              {res.type}
                            </Badge>
                          </div>
                          {res.notes && (
                            <p className="text-[11px] text-zinc-400">{res.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {res.url && (
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-zinc-200 p-1 transition-colors"
                              title="Open link"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <select
                            value={res.status}
                            onChange={(e) =>
                              handleResourceStatusChange(res.id, e.target.value as any)
                            }
                            className="h-6 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 px-1.5 outline-none uppercase font-mono"
                          >
                            <option value="queued">Queued</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Notes Tab: Embedded Polymorphic EntityNotes! */}
              <TabsContent value="notes" className="mt-4">
                <EntityNotes
                  entityType="learning_topic"
                  entityId={activeTopic.id}
                  entityTitle={activeTopic.title}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Edit Checkpoint Dialog */}
      <Dialog open={isEditCheckpointOpen} onOpenChange={setIsEditCheckpointOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Update Checkpoint & Next Action
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCheckpoint} className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Where did you stop? (Checkpoint)
              </label>
              <Textarea
                placeholder="e.g. Chapter 4: Multi-level page tables & TLB shootdowns..."
                value={editCp}
                onChange={(e) => setEditCp(e.target.value)}
                rows={3}
                required
                className="text-xs bg-zinc-900/80 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Immediate Next Action (What's Next?)
              </label>
              <Textarea
                placeholder="e.g. Implement toy TLB cache simulator in C..."
                value={editNext}
                onChange={(e) => setEditNext(e.target.value)}
                rows={2}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditCheckpointOpen(false)}
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

      {/* Log Study Session Dialog */}
      <Dialog open={isLogSessionOpen} onOpenChange={setIsLogSessionOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Log Study Session ({activeTopic?.title})
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogSession} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Date
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Duration (Minutes)
                </label>
                <Input
                  type="number"
                  step="5"
                  value={sessionMinutes}
                  onChange={(e) => setSessionMinutes(e.target.value)}
                  required
                  className="h-8 text-xs bg-zinc-900/80 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Session Summary / Key Takeaways
              </label>
              <Textarea
                placeholder="What concepts did you master or experiment with?"
                value={sessionSummary}
                onChange={(e) => setSessionSummary(e.target.value)}
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
                onClick={() => setIsLogSessionOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!sessionSummary.trim()}>
                Save Session
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Resource Dialog */}
      <Dialog open={isAddResourceOpen} onOpenChange={setIsAddResourceOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Add Learning Resource
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddResource} className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Resource Title
              </label>
              <Input
                placeholder="e.g. Operating Systems: Three Easy Pieces (OSTEP)"
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                required
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Type
                </label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value as any)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="book">Book</option>
                  <option value="paper">Research Paper</option>
                  <option value="doc">Official Documentation / RFC</option>
                  <option value="course">Course</option>
                  <option value="repo">Code Repository</option>
                  <option value="video">Video Lecture</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  URL (optional)
                </label>
                <Input
                  placeholder="https://..."
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  className="text-xs bg-zinc-900/80"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Notes / Chapters Focus
              </label>
              <Input
                placeholder="e.g. Chapters 18-20 on Paging and TLBs"
                value={resNotes}
                onChange={(e) => setResNotes(e.target.value)}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddResourceOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!resTitle.trim()}>
                Add Resource
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Topic Dialog */}
      <Dialog open={isNewTopicOpen} onOpenChange={setIsNewTopicOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Add New Technical Learning Topic
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTopic} className="space-y-3 pt-2">
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
                  Topic Title
                </label>
                <Input
                  placeholder="e.g. Linux Kernel Network Stack (eBPF & XDP)"
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
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as any)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="systems">Operating Systems</option>
                  <option value="networking">Networking</option>
                  <option value="databases">Databases</option>
                  <option value="distributed">Distributed Systems</option>
                  <option value="languages">Languages & Runtimes</option>
                  <option value="architecture">Architecture</option>
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
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Current Checkpoint (Where are you right now?)
              </label>
              <Input
                placeholder="e.g. Chapter 1: Packet flow through socket layers..."
                value={newCp}
                onChange={(e) => setNewCp(e.target.value)}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Immediate Next Action
              </label>
              <Input
                placeholder="e.g. Write simple XDP drop filter in C..."
                value={newNext}
                onChange={(e) => setNewNext(e.target.value)}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewTopicOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!newTitle.trim()}>
                Create Topic
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
