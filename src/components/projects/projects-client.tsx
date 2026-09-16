"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  Plus,
  FolderKanban,
  CheckCircle2,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Project, Sprint, Task, Subtask } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { TaskDetailModal } from "./task-detail-modal";
import {
  createProjectAction,
  createTaskAction,
  moveTaskAction,
} from "@/lib/actions/projects";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

type TaskWithSubtasks = Task & { subtasks?: Subtask[] };

interface ProjectsClientProps {
  initialProjects: Project[];
  initialSprints: Sprint[];
  initialTasks: TaskWithSubtasks[];
}

const COLUMNS = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "in_review", title: "In Review" },
  { id: "done", title: "Done" },
] as const;

type ColumnId = (typeof COLUMNS)[number]["id"];

export function ProjectsClient({
  initialProjects,
  initialSprints,
  initialTasks,
}: ProjectsClientProps) {
  const [projectsList, setProjectsList] = React.useState(initialProjects);
  const [sprintsList, setSprintsList] = React.useState(initialSprints);
  const [tasksList, setTasksList] = React.useState<TaskWithSubtasks[]>(initialTasks);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("all");
  const [viewMode, setViewMode] = React.useState<"board" | "list">("board");

  // Drag & drop state
  const [activeTask, setActiveTask] = React.useState<TaskWithSubtasks | null>(null);

  // Modals state
  const [activeModalTask, setActiveModalTask] = React.useState<TaskWithSubtasks | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = React.useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = React.useState(false);
  const [newTaskStatus, setNewTaskStatus] = React.useState<ColumnId>("todo");

  // New Project Form
  const [newProjTitle, setNewProjTitle] = React.useState("");
  const [newProjDesc, setNewProjDesc] = React.useState("");
  const [newProjPriority, setNewProjPriority] = React.useState<"low" | "medium" | "high" | "urgent">("high");
  const [newProjTech, setNewProjTech] = React.useState("");
  const [newProjRepo, setNewProjRepo] = React.useState("");

  // New Task Form
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskProjectId, setNewTaskProjectId] = React.useState(
    initialProjects[0]?.id || ""
  );
  const [newTaskPriority, setNewTaskPriority] = React.useState<"low" | "medium" | "high" | "urgent">("medium");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag begins
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const projectMap = React.useMemo(() => {
    return Object.fromEntries(projectsList.map((p) => [p.id, p]));
  }, [projectsList]);

  // Filter tasks based on selected project
  const visibleTasks = React.useMemo(() => {
    if (selectedProjectId === "all") return tasksList;
    return tasksList.filter((t) => t.projectId === selectedProjectId);
  }, [tasksList, selectedProjectId]);

  const activeProject = projectsList.find((p) => p.id === selectedProjectId);

  // Group tasks by column
  const tasksByColumn = React.useMemo(() => {
    const map: Record<ColumnId, TaskWithSubtasks[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    visibleTasks.forEach((task) => {
      const col = (task.status as ColumnId) || "todo";
      if (map[col]) map[col].push(task);
      else map.todo.push(task);
    });
    return map;
  }, [visibleTasks]);

  // Drag Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasksList.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Moving a task over another task in a different column
    if (isOverTask) {
      setTasksList((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);

        if (prev[activeIndex].status !== prev[overIndex].status) {
          const updated = [...prev];
          updated[activeIndex] = {
            ...updated[activeIndex],
            status: prev[overIndex].status,
          };
          return arrayMove(updated, activeIndex, overIndex);
        }
        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Moving a task over an empty column
    if (isOverColumn) {
      setTasksList((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const columnStatus = over.data.current?.status as ColumnId;
        if (prev[activeIndex].status !== columnStatus) {
          const updated = [...prev];
          updated[activeIndex] = {
            ...updated[activeIndex],
            status: columnStatus,
          };
          return updated;
        }
        return prev;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const task = tasksList.find((t) => t.id === activeId);
    if (!task) return;

    // Determine final status & order
    const taskIndex = tasksList.findIndex((t) => t.id === activeId);
    await moveTaskAction({
      taskId: activeId,
      newStatus: task.status as any,
      newOrder: taskIndex,
    });
  };

  const handleOpenNewTaskModal = (status: ColumnId = "todo") => {
    setNewTaskStatus(status);
    if (selectedProjectId !== "all") {
      setNewTaskProjectId(selectedProjectId);
    } else if (projectsList[0]) {
      setNewTaskProjectId(projectsList[0].id);
    }
    setIsNewTaskOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskProjectId) return;

    const res = await createTaskAction({
      projectId: newTaskProjectId,
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      status: newTaskStatus,
    });

    if (res.id) {
      const created: TaskWithSubtasks = {
        id: res.id,
        projectId: newTaskProjectId,
        sprintId: null,
        title: newTaskTitle.trim(),
        description: "",
        status: newTaskStatus,
        priority: newTaskPriority,
        order: 0,
        dueDate: null,
        estimateHours: null,
        isFocusToday: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtasks: [],
      };
      setTasksList([created, ...tasksList]);
      setNewTaskTitle("");
      setIsNewTaskOpen(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;

    const techArr = newProjTech
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await createProjectAction({
      title: newProjTitle.trim(),
      description: newProjDesc.trim(),
      priority: newProjPriority,
      techStack: techArr,
      repositoryUrl: newProjRepo.trim() || undefined,
    });

    if (res.id) {
      const created: Project = {
        id: res.id,
        title: newProjTitle.trim(),
        description: newProjDesc.trim(),
        status: "active",
        priority: newProjPriority,
        goalId: null,
        techStack: JSON.stringify(techArr),
        repositoryUrl: newProjRepo.trim() || null,
        startDate: new Date().toISOString().split("T")[0],
        targetDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjectsList([created, ...projectsList]);
      setSelectedProjectId(created.id);
      setNewProjTitle("");
      setNewProjDesc("");
      setNewProjTech("");
      setNewProjRepo("");
      setIsNewProjectOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Project Selection Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Projects & Sprints
            </h1>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {tasksList.length} Tasks
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Physical drag-and-drop sprint planning and execution.
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* View mode toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-md">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === "board"
                  ? "bg-zinc-800 text-zinc-100 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-zinc-800 text-zinc-100 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsNewProjectOpen(true)}
            className="h-8 text-xs gap-1.5"
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span>New Project</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenNewTaskModal("todo")}
            className="h-8 text-xs gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Project Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedProjectId("all")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            selectedProjectId === "all"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs"
              : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-zinc-800/60"
          }`}
        >
          All Projects
        </button>

        {projectsList.map((p) => {
          const isSelected = selectedProjectId === p.id;
          const pTasks = tasksList.filter((t) => t.projectId === p.id);
          const pDone = pTasks.filter((t) => t.status === "done").length;
          const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

          return (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs"
                  : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-zinc-800/60"
              }`}
            >
              <span>{p.title}</span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950/80 px-1 py-0.2 rounded">
                {pct}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Project Details Banner (if specific project is selected) */}
      {activeProject && (
        <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-100">
                {activeProject.title}
              </h2>
              <Badge variant="accent" className="text-[10px] uppercase font-mono">
                {activeProject.status}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl">
              {activeProject.description || "No description provided."}
            </p>

            {/* Tech stack pills */}
            {activeProject.techStack && (
              <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                {(() => {
                  try {
                    const stack = JSON.parse(activeProject.techStack) as string[];
                    return stack.map((tech) => (
                      <span
                        key={tech}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400"
                      >
                        {tech}
                      </span>
                    ));
                  } catch {
                    return null;
                  }
                })()}
              </div>
            )}
          </div>

          {activeProject.repositoryUrl && (
            <a
              href={activeProject.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1.5 shrink-0 bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <span>Repository</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* Kanban Board View */}
      {viewMode === "board" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                tasks={tasksByColumn[col.id]}
                projectMap={projectMap}
                onCardClick={(task) => setActiveModalTask(task)}
                onQuickAdd={(status) => handleOpenNewTaskModal(status)}
              />
            ))}
          </div>

          {/* Floating Drag Overlay */}
          <DragOverlay>
            {activeTask ? (
              <KanbanCard
                task={activeTask}
                projectName={projectMap[activeTask.projectId]?.title}
                onClick={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 divide-y divide-zinc-800/60 overflow-hidden">
          {visibleTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No tasks found.
            </div>
          ) : (
            visibleTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setActiveModalTask(task)}
                className="p-3.5 flex items-center justify-between hover:bg-zinc-900/40 cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      task.status === "done"
                        ? "bg-emerald-400"
                        : task.status === "in_progress"
                        ? "bg-amber-400"
                        : "bg-zinc-600"
                    }`}
                  />
                  <div>
                    <div className="font-medium text-zinc-200">{task.title}</div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {projectMap[task.projectId]?.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="capitalize text-[10px]">
                    {task.status.replace("_", " ")}
                  </Badge>
                  <Badge
                    variant={
                      task.priority === "urgent"
                        ? "danger"
                        : task.priority === "high"
                        ? "warning"
                        : "outline"
                    }
                    className="capitalize text-[10px]"
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
            ))
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={activeModalTask}
        open={!!activeModalTask}
        onOpenChange={(open) => !open && setActiveModalTask(null)}
        projects={projectsList}
        sprints={sprintsList}
        onTaskUpdated={() => {
          // Re-fetch updated tasks or reload
          window.location.reload();
        }}
      />

      {/* New Project Dialog */}
      <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Create New Software Project
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] uppercase font-mono text-zinc-400 mb-1 block">
                Project Title
              </label>
              <Input
                placeholder="e.g. Distributed Consensus Engine..."
                value={newProjTitle}
                onChange={(e) => setNewProjTitle(e.target.value)}
                autoFocus
                required
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-zinc-400 mb-1 block">
                Description
              </label>
              <Textarea
                placeholder="What problem does this project solve?"
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                rows={2}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-mono text-zinc-400 mb-1 block">
                  Priority
                </label>
                <select
                  value={newProjPriority}
                  onChange={(e) => setNewProjPriority(e.target.value as any)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-zinc-400 mb-1 block">
                  Repository URL
                </label>
                <Input
                  placeholder="https://github.com/..."
                  value={newProjRepo}
                  onChange={(e) => setNewProjRepo(e.target.value)}
                  className="text-xs bg-zinc-900/80"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-zinc-400 mb-1 block">
                Tech Stack (comma separated)
              </label>
              <Input
                placeholder="e.g. Go, gRPC, Protobuf, BoltDB"
                value={newProjTech}
                onChange={(e) => setNewProjTech(e.target.value)}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewProjectOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!newProjTitle.trim()}>
                Create Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              New Task ({newTaskStatus.replace("_", " ")})
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] uppercase font-mono text-zinc-400 mb-1 block">
                Task Title
              </label>
              <Input
                placeholder="What needs to be implemented?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
                required
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-mono text-zinc-400 mb-1 block">
                  Project
                </label>
                <select
                  value={newTaskProjectId}
                  onChange={(e) => setNewTaskProjectId(e.target.value)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  {projectsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-zinc-400 mb-1 block">
                  Priority
                </label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewTaskOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!newTaskTitle.trim()}>
                Create Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
