"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Circle, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Task, Subtask } from "@/lib/db/schema";
import { KanbanCard } from "./kanban-card";

interface KanbanColumnProps {
  id: "backlog" | "todo" | "in_progress" | "in_review" | "done";
  title: string;
  tasks: (Task & { subtasks?: Subtask[] })[];
  projectMap: Record<string, { title: string }>;
  onCardClick: (task: Task & { subtasks?: Subtask[] }) => void;
  onQuickAdd: (status: "backlog" | "todo" | "in_progress" | "in_review" | "done") => void;
}

const COLUMN_CONFIG = {
  backlog: {
    label: "Backlog",
    color: "text-zinc-500",
    dot: "bg-zinc-500",
    icon: Circle,
  },
  todo: {
    label: "To Do",
    color: "text-sky-400",
    dot: "bg-sky-400",
    icon: Circle,
  },
  in_progress: {
    label: "In Progress",
    color: "text-amber-400",
    dot: "bg-amber-400",
    icon: Clock,
  },
  in_review: {
    label: "In Review",
    color: "text-indigo-400",
    dot: "bg-indigo-400",
    icon: AlertCircle,
  },
  done: {
    label: "Done",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
    icon: CheckCircle2,
  },
};

export function KanbanColumn({
  id,
  title,
  tasks,
  projectMap,
  onCardClick,
  onQuickAdd,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "Column",
      status: id,
    },
  });

  const config = COLUMN_CONFIG[id] || COLUMN_CONFIG.todo;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 shrink-0 rounded-lg border bg-zinc-950/50 p-2.5 transition-colors ${
        isOver
          ? "border-zinc-500/50 bg-zinc-900/40 ring-1 ring-zinc-500/20"
          : "border-zinc-800/70"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1.5 py-1 mb-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${config.dot}`} />
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
            {title}
          </h3>
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onQuickAdd(id)}
          className="h-6 w-6 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
          title={`Add task to ${title}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cards Area */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-2 overflow-y-auto min-h-[140px] pr-0.5">
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              projectName={projectMap[task.projectId]?.title}
              onClick={() => onCardClick(task)}
            />
          ))}

          {tasks.length === 0 && (
            <div className="h-28 border border-dashed border-zinc-800/60 rounded flex items-center justify-center text-[11px] text-zinc-600 italic">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
