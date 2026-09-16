"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckSquare, Calendar, Sparkles, GripVertical } from "lucide-react";
import { Task, Subtask } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface KanbanCardProps {
  task: Task & { subtasks?: Subtask[] };
  projectName?: string;
  onClick: () => void;
  isOverlay?: boolean;
}

export function KanbanCard({
  task,
  projectName,
  onClick,
  isOverlay = false,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const completedSubtasks =
    task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-md border p-3 text-xs select-none transition-all cursor-pointer ${
        isOverlay
          ? "bg-zinc-900 border-zinc-600 shadow-2xl scale-105 rotate-1 z-50 ring-1 ring-zinc-400/20"
          : isDragging
          ? "opacity-30 border-dashed border-zinc-700 bg-zinc-950/40"
          : "bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60 shadow-xs"
      }`}
      onClick={onClick}
    >
      {/* Top Header: Priority Badge & Drag Handle */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Badge
            variant={
              task.priority === "urgent"
                ? "danger"
                : task.priority === "high"
                ? "warning"
                : "secondary"
            }
            className="text-[10px] px-1.5 py-0 capitalize"
          >
            {task.priority}
          </Badge>

          {task.isFocusToday && (
            <span title="Today's Focus">
              <Sparkles className="h-3 w-3 text-amber-400" />
            </span>
          )}
        </div>

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab active:cursor-grabbing p-1 -mr-1 rounded hover:bg-zinc-800/60 text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-medium text-zinc-100 leading-snug mb-2 group-hover:text-zinc-50">
        {task.title}
      </h4>

      {/* Footer / Context */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-800/40">
        <div className="flex items-center gap-2">
          {projectName && (
            <span className="truncate max-w-[90px] text-zinc-400">
              {projectName}
            </span>
          )}

          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1 text-zinc-400">
              <CheckSquare className="h-3 w-3 text-zinc-500" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-1 text-zinc-400">
            <Calendar className="h-3 w-3 text-zinc-500" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
