"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckSquare, FileText, DollarSign, BookOpen, Loader2 } from "lucide-react";
import {
  captureTaskAction,
  captureNoteAction,
  captureTransactionAction,
  captureLearningCheckpointAction,
  getQuickCaptureOptions,
} from "@/lib/actions/quick-capture";

interface QuickCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "task" | "note" | "expense" | "checkpoint";
}

export function QuickCaptureModal({
  open,
  onOpenChange,
  defaultTab = "task",
}: QuickCaptureModalProps) {
  const [activeTab, setActiveTab] = React.useState<string>(defaultTab);
  const [loading, setLoading] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Options
  const [options, setOptions] = React.useState<{
    projects: { id: string; title: string }[];
    accounts: { id: string; name: string; balance: number }[];
    topics: { id: string; title: string }[];
  }>({ projects: [], accounts: [], topics: [] });

  // Task form state
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskProjectId, setTaskProjectId] = React.useState("");
  const [taskPriority, setTaskPriority] = React.useState<"low" | "medium" | "high" | "urgent">("medium");
  const [taskFocusToday, setTaskFocusToday] = React.useState(false);

  // Note form state
  const [noteTitle, setNoteTitle] = React.useState("");
  const [noteContent, setNoteContent] = React.useState("");
  const [noteTags, setNoteTags] = React.useState("");

  // Expense form state
  const [txType, setTxType] = React.useState<"income" | "expense">("expense");
  const [txAmount, setTxAmount] = React.useState("");
  const [txAccountId, setTxAccountId] = React.useState("");
  const [txCategory, setTxCategory] = React.useState("food");
  const [txDescription, setTxDescription] = React.useState("");

  // Checkpoint form state
  const [cpTopicId, setCpTopicId] = React.useState("");
  const [cpCheckpoint, setCpCheckpoint] = React.useState("");
  const [cpNextStep, setCpNextStep] = React.useState("");

  // Sync tab when opened with specific tab
  React.useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      setSuccessMsg(null);
      getQuickCaptureOptions().then((opts) => {
        setOptions(opts);
        if (opts.projects[0]) setTaskProjectId(opts.projects[0].id);
        if (opts.accounts[0]) setTxAccountId(opts.accounts[0].id);
        if (opts.topics[0]) setCpTopicId(opts.topics[0].id);
      });
    }
  }, [open, defaultTab]);

  // Global key listener for Cmd+J
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleCreateTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!taskTitle.trim() || !taskProjectId) return;
    setLoading(true);
    try {
      await captureTaskAction({
        title: taskTitle.trim(),
        projectId: taskProjectId,
        priority: taskPriority,
        isFocusToday: taskFocusToday,
      });
      setTaskTitle("");
      setSuccessMsg("Task captured successfully");
      setTimeout(() => onOpenChange(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!noteTitle.trim()) return;
    setLoading(true);
    try {
      const tags = noteTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      await captureNoteAction({
        title: noteTitle.trim(),
        content: noteContent.trim(),
        tags,
      });
      setNoteTitle("");
      setNoteContent("");
      setNoteTags("");
      setSuccessMsg("Note saved");
      setTimeout(() => onOpenChange(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0 || !txAccountId || !txDescription.trim()) return;
    setLoading(true);
    try {
      await captureTransactionAction({
        accountId: txAccountId,
        type: txType,
        amount: amountNum,
        category: txCategory,
        description: txDescription.trim(),
      });
      setTxAmount("");
      setTxDescription("");
      setSuccessMsg("Transaction logged");
      setTimeout(() => onOpenChange(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCheckpoint = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!cpTopicId || !cpCheckpoint.trim()) return;
    setLoading(true);
    try {
      await captureLearningCheckpointAction({
        topicId: cpTopicId,
        checkpoint: cpCheckpoint.trim(),
        nextStep: cpNextStep.trim(),
      });
      setCpCheckpoint("");
      setCpNextStep("");
      setSuccessMsg("Learning checkpoint updated");
      setTimeout(() => onOpenChange(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-5 bg-zinc-950 border-zinc-800">
        <DialogHeader className="flex flex-row items-center justify-between pb-1">
          <DialogTitle className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            Quick Capture
          </DialogTitle>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
            <span>Press</span>
            <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              ⌘Enter
            </kbd>
            <span>to save</span>
          </div>
        </DialogHeader>

        {successMsg ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 animate-in zoom-in-75 duration-150">
              ✓
            </div>
            <p className="text-xs font-medium text-zinc-200">{successMsg}</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full h-8 bg-zinc-900/90 border border-zinc-800/80 mb-3">
              <TabsTrigger value="task" className="text-[11px] gap-1.5 data-[state=active]:bg-zinc-800">
                <CheckSquare className="h-3 w-3 text-amber-400" />
                <span>Task</span>
              </TabsTrigger>
              <TabsTrigger value="note" className="text-[11px] gap-1.5 data-[state=active]:bg-zinc-800">
                <FileText className="h-3 w-3 text-indigo-400" />
                <span>Note</span>
              </TabsTrigger>
              <TabsTrigger value="expense" className="text-[11px] gap-1.5 data-[state=active]:bg-zinc-800">
                <DollarSign className="h-3 w-3 text-emerald-400" />
                <span>Money</span>
              </TabsTrigger>
              <TabsTrigger value="checkpoint" className="text-[11px] gap-1.5 data-[state=active]:bg-zinc-800">
                <BookOpen className="h-3 w-3 text-cyan-400" />
                <span>Study</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Task */}
            <TabsContent value="task" className="mt-0">
              <form
                onSubmit={handleCreateTask}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleCreateTask();
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <Input
                    placeholder="Task title..."
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    autoFocus
                    required
                    className="text-xs bg-zinc-900/80 border-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-1 block">Project</label>
                    <select
                      value={taskProjectId}
                      onChange={(e) => setTaskProjectId(e.target.value)}
                      className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-900/80 px-2 text-xs text-zinc-200 outline-none"
                    >
                      {options.projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 mb-1 block">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-900/80 px-2 text-xs text-zinc-200 outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="focus-today"
                    checked={taskFocusToday}
                    onChange={(e) => setTaskFocusToday(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-zinc-100"
                  />
                  <label htmlFor="focus-today" className="text-xs text-zinc-300 cursor-pointer select-none">
                    Pin to Today's Daily Focus
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={loading || !taskTitle.trim()}>
                    {loading && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                    Create Task
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Tab: Note */}
            <TabsContent value="note" className="mt-0">
              <form
                onSubmit={handleCreateNote}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleCreateNote();
                  }
                }}
                className="space-y-3"
              >
                <Input
                  placeholder="Note title or idea..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  autoFocus
                  required
                  className="text-xs bg-zinc-900/80 border-zinc-800"
                />

                <Textarea
                  placeholder="Content (markdown supported)..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  className="text-xs bg-zinc-900/80 border-zinc-800 font-mono"
                />

                <div>
                  <Input
                    placeholder="Tags (comma separated, e.g. architecture, raft, cues)..."
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                    className="text-xs bg-zinc-900/80 border-zinc-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={loading || !noteTitle.trim()}>
                    {loading && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                    Save Note
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Tab: Money */}
            <TabsContent value="expense" className="mt-0">
              <form
                onSubmit={handleCreateTransaction}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleCreateTransaction();
                  }
                }}
                className="space-y-3"
              >
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType("expense")}
                    className={`flex-1 py-1 text-xs rounded border transition-colors ${
                      txType === "expense"
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-300 font-medium"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-400"
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType("income")}
                    className={`flex-1 py-1 text-xs rounded border transition-colors ${
                      txType === "income"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-medium"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-400"
                    }`}
                  >
                    Income
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-1 block">Amount ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      required
                      autoFocus
                      className="text-xs bg-zinc-900/80 border-zinc-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 mb-1 block">Account</label>
                    <select
                      value={txAccountId}
                      onChange={(e) => setTxAccountId(e.target.value)}
                      className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-900/80 px-2 text-xs text-zinc-200 outline-none"
                    >
                      {options.accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (${acc.balance.toFixed(0)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-1 block">Category</label>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-900/80 px-2 text-xs text-zinc-200 outline-none"
                    >
                      <option value="food">Food & Dining</option>
                      <option value="software_subs">Software & Cloud</option>
                      <option value="tech_hardware">Hardware & Tech</option>
                      <option value="housing">Housing & Utilities</option>
                      <option value="fitness">Fitness & Health</option>
                      <option value="salary">Salary</option>
                      <option value="freelance">Freelance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 mb-1 block">Description</label>
                    <Input
                      placeholder="Coffee, AWS, Grocery..."
                      value={txDescription}
                      onChange={(e) => setTxDescription(e.target.value)}
                      required
                      className="text-xs bg-zinc-900/80 border-zinc-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading || !txAmount || !txDescription.trim()}
                  >
                    {loading && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                    Log Transaction
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Tab: Checkpoint */}
            <TabsContent value="checkpoint" className="mt-0">
              <form
                onSubmit={handleUpdateCheckpoint}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleUpdateCheckpoint();
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-[10px] text-zinc-400 mb-1 block">Learning Topic</label>
                  <select
                    value={cpTopicId}
                    onChange={(e) => setCpTopicId(e.target.value)}
                    className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-900/80 px-2 text-xs text-zinc-200 outline-none"
                  >
                    {options.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 mb-1 block">
                    Where did you stop? (Checkpoint)
                  </label>
                  <Input
                    placeholder="e.g. Chapter 4: Multi-level page tables..."
                    value={cpCheckpoint}
                    onChange={(e) => setCpCheckpoint(e.target.value)}
                    required
                    autoFocus
                    className="text-xs bg-zinc-900/80 border-zinc-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 mb-1 block">
                    What's next? (Immediate next step)
                  </label>
                  <Input
                    placeholder="e.g. Implement toy TLB cache simulator in C..."
                    value={cpNextStep}
                    onChange={(e) => setCpNextStep(e.target.value)}
                    className="text-xs bg-zinc-900/80 border-zinc-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading || !cpCheckpoint.trim()}
                  >
                    {loading && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                    Update Checkpoint
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
