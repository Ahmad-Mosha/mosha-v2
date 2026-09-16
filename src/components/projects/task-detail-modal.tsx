"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  FileText,
  Save,
} from "lucide-react";
import { Task, Subtask, Project, Sprint } from "@/lib/db/schema";
import { EntityNotes } from "@/components/notes/entity-notes";
import {
  updateTaskAction,
  deleteTaskAction,
  addSubtaskAction,
  toggleSubtaskAction,
  deleteSubtaskAction,
} from "@/lib/actions/projects";

interface TaskDetailModalProps {
  task: (Task & { subtasks?: Subtask[] }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  sprints: Sprint[];
  onTaskUpdated?: () => void;
}

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  projects,
  sprints,
  onTaskUpdated,
}: TaskDetailModalProps) {
  if (!task) return null;

  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description);
  const [status, setStatus] = React.useState(task.status);
  const [priority, setPriority] = React.useState(task.priority);
  const [sprintId, setSprintId] = React.useState(task.sprintId || "");
  const [dueDate, setDueDate] = React.useState(task.dueDate || "");
  const [estimateHours, setEstimateHours] = React.useState(
    task.estimateHours ? String(task.estimateHours) : ""
  );
  const [isFocusToday, setIsFocusToday] = React.useState(task.isFocusToday);

  // Subtasks state
  const [subtasksList, setSubtasksList] = React.useState<Subtask[]>(
    task.subtasks || []
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Sync state on task change
  React.useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setPriority(task.priority);
    setSprintId(task.sprintId || "");
    setDueDate(task.dueDate || "");
    setEstimateHours(task.estimateHours ? String(task.estimateHours) : "");
    setIsFocusToday(task.isFocusToday);
    setSubtasksList(task.subtasks || []);
  }, [task]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateTaskAction(task.id, {
      title,
      description,
      status: status as any,
      priority: priority as any,
      sprintId: sprintId || null,
      dueDate: dueDate || null,
      estimateHours: estimateHours ? parseFloat(estimateHours) : null,
      isFocusToday,
    });
    setIsSaving(false);
    onTaskUpdated?.();
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const res = await addSubtaskAction(task.id, newSubtaskTitle.trim());
    if (res.id) {
      setSubtasksList([
        ...subtasksList,
        {
          id: res.id,
          taskId: task.id,
          title: newSubtaskTitle.trim(),
          completed: false,
          order: subtasksList.length,
        },
      ]);
      setNewSubtaskTitle("");
      onTaskUpdated?.();
    }
  };

  const handleToggleSubtask = async (subtaskId: string, current: boolean) => {
    const next = !current;
    await toggleSubtaskAction(subtaskId, next);
    setSubtasksList((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, completed: next } : s))
    );
    onTaskUpdated?.();
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    await deleteSubtaskAction(subtaskId);
    setSubtasksList((prev) => prev.filter((s) => s.id !== subtaskId));
    onTaskUpdated?.();
  };

  const handleDeleteTask = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTaskAction(task.id);
      onOpenChange(false);
      onTaskUpdated?.();
    }
  };

  const project = projects.find((p) => p.id === task.projectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6 bg-zinc-950 border-zinc-800">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase">
            <span>{project?.title || "Project Task"}</span>
            <span>&bull;</span>
            <span className="text-zinc-400">ID: {task.id}</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            className="w-full text-base font-semibold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-zinc-700 outline-none pb-1"
          />
        </DialogHeader>

        {/* Top Properties Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-md bg-zinc-900/50 border border-zinc-800/60 text-xs">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                updateTaskAction(task.id, { status: e.target.value as any }).then(
                  () => onTaskUpdated?.()
                );
              }}
              className="h-7 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
            >
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as any);
                updateTaskAction(task.id, { priority: e.target.value as any }).then(
                  () => onTaskUpdated?.()
                );
              }}
              className="h-7 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Sprint</label>
            <select
              value={sprintId}
              onChange={(e) => {
                setSprintId(e.target.value);
                updateTaskAction(task.id, {
                  sprintId: e.target.value || null,
                }).then(() => onTaskUpdated?.());
              }}
              className="h-7 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none truncate"
            >
              <option value="">(No Sprint / Backlog)</option>
              {sprints
                .filter((s) => s.projectId === task.projectId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                updateTaskAction(task.id, { dueDate: e.target.value || null }).then(
                  () => onTaskUpdated?.()
                );
              }}
              className="h-7 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none font-mono"
            />
          </div>
        </div>

        {/* Daily Focus Pin Toggle */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              id="task-focus"
              checked={isFocusToday}
              onChange={(e) => {
                setIsFocusToday(e.target.checked);
                updateTaskAction(task.id, { isFocusToday: e.target.checked }).then(
                  () => onTaskUpdated?.()
                );
              }}
              className="rounded bg-zinc-900 border-zinc-700 text-zinc-100"
            />
            <label htmlFor="task-focus" className="flex items-center gap-1.5 cursor-pointer">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Prioritize on Today's Daily Focus</span>
            </label>
          </div>

          <button
            onClick={handleDeleteTask}
            className="text-xs text-zinc-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Task</span>
          </button>
        </div>

        {/* Tabs: Details / Subtasks vs Notes */}
        <Tabs defaultValue="details" className="w-full pt-1">
          <TabsList className="grid grid-cols-2 w-full h-8 bg-zinc-900/90 border border-zinc-800/80">
            <TabsTrigger value="details" className="text-xs">
              Details & Subtasks ({subtasksList.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">
              Linked Notes & Specs
            </TabsTrigger>
          </TabsList>

          {/* Details & Subtasks tab */}
          <TabsContent value="details" className="space-y-4 mt-3">
            {/* Description */}
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1 block">
                Description / Context
              </label>
              <Textarea
                placeholder="Add implementation notes, technical context, or acceptance criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSave}
                rows={3}
                className="text-xs bg-zinc-900/60"
              />
            </div>

            {/* Subtasks checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                  Subtasks Checklist
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {subtasksList.filter((s) => s.completed).length} of{" "}
                  {subtasksList.length} completed
                </span>
              </div>

              {/* Add subtask */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <Input
                  placeholder="Add a new subtask (press Enter)..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="h-7 text-xs bg-zinc-900/70"
                />
                <Button type="submit" size="sm" variant="secondary" className="h-7 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </form>

              {/* Subtasks list */}
              <div className="space-y-1 pt-1">
                {subtasksList.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/60 transition-colors text-xs"
                  >
                    <div
                      onClick={() => handleToggleSubtask(st.id, st.completed)}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      {st.completed ? (
                        <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-zinc-500 shrink-0" />
                      )}
                      <span
                        className={
                          st.completed
                            ? "text-zinc-500 line-through"
                            : "text-zinc-200"
                        }
                      >
                        {st.title}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="text-zinc-600 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Notes tab: Embedded EntityNotes! */}
          <TabsContent value="notes" className="mt-3">
            <EntityNotes
              entityType="task"
              entityId={task.id}
              entityTitle={task.title}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
