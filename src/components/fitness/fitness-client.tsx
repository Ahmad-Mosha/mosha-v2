"use client";

import * as React from "react";
import {
  Dumbbell,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  Calendar,
  Check,
  RotateCcw,
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  WorkoutRoutine,
  Exercise,
  WorkoutSession,
  WorkoutSet,
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
import { RestTimer } from "./rest-timer";
import {
  startWorkoutSessionAction,
  logWorkoutSetAction,
  updateWorkoutSetAction,
  deleteWorkoutSetAction,
  finishWorkoutSessionAction,
  deleteWorkoutSessionAction,
  createExerciseAction,
  createRoutineAction,
} from "@/lib/actions/fitness";
import { formatDate } from "@/lib/utils";

type SessionWithSets = WorkoutSession & { sets: WorkoutSet[] };
type RoutineWithExercises = WorkoutRoutine & { exerciseIds: string[] };

interface FitnessClientProps {
  initialRoutines: RoutineWithExercises[];
  initialExercises: Exercise[];
  initialSessions: SessionWithSets[];
  historyByExercise: Record<string, { date: string; sets: WorkoutSet[] }[]>;
}

export function FitnessClient({
  initialRoutines,
  initialExercises,
  initialSessions,
  historyByExercise,
}: FitnessClientProps) {
  const [routines, setRoutines] = React.useState(initialRoutines);
  const [exercisesList, setExercisesList] = React.useState(initialExercises);
  const [sessions, setSessions] = React.useState<SessionWithSets[]>(initialSessions);

  // Active workout detection
  const activeSession = sessions.find((s) => s.status === "in_progress");

  // Modals
  const [isNewExerciseOpen, setIsNewExerciseOpen] = React.useState(false);
  const [isNewRoutineOpen, setIsNewRoutineOpen] = React.useState(false);
  const [isFinishSessionOpen, setIsFinishSessionOpen] = React.useState(false);
  const [isAddExerciseToSessionOpen, setIsAddExerciseToSessionOpen] = React.useState(false);
  const [showRestTimer, setShowRestTimer] = React.useState(false);

  // Finish session state
  const [sessionRating, setSessionRating] = React.useState(5);
  const [sessionNotes, setSessionNotes] = React.useState("");

  // Muscle filter for exercise library
  const [muscleFilter, setMuscleFilter] = React.useState<string>("all");

  // Forms
  const [newExName, setNewExName] = React.useState("");
  const [newExMuscle, setNewExMuscle] = React.useState<"chest" | "back" | "shoulders" | "legs" | "arms" | "core" | "full_body">("chest");
  const [newExEquipment, setNewExEquipment] = React.useState<"barbell" | "dumbbell" | "cable" | "machine" | "bodyweight">("barbell");
  const [newExPR, setNewExPR] = React.useState("");
  const [newExNotes, setNewExNotes] = React.useState("");

  // New Routine Form
  const [newRoutineName, setNewRoutineName] = React.useState("");
  const [newRoutineDesc, setNewRoutineDesc] = React.useState("");
  const [newRoutineDays, setNewRoutineDays] = React.useState("3");
  const [selectedExerciseIds, setSelectedExerciseIds] = React.useState<string[]>([]);

  // Exercise map
  const exerciseMap = React.useMemo(() => {
    return Object.fromEntries(exercisesList.map((e) => [e.id, e]));
  }, [exercisesList]);

  // Handle start workout
  const handleStartWorkout = async (routineId?: string) => {
    const res = await startWorkoutSessionAction({ routineId });
    if (res.id) {
      window.location.reload();
    }
  };

  // Handle set completion / update
  const handleToggleSetComplete = async (set: WorkoutSet) => {
    const nextCompleted = !set.completed;
    await updateWorkoutSetAction(set.id, { completed: nextCompleted });

    setSessions((prev) =>
      prev.map((s) =>
        s.id === set.sessionId
          ? {
              ...s,
              sets: s.sets.map((item) =>
                item.id === set.id ? { ...item, completed: nextCompleted } : item
              ),
            }
          : s
      )
    );

    if (nextCompleted) {
      setShowRestTimer(true);
    }
  };

  const handleUpdateSetField = async (
    setId: string,
    field: "weightKg" | "reps" | "rpe" | "isWarmup" | "isPR",
    value: any
  ) => {
    await updateWorkoutSetAction(setId, { [field]: value });
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        sets: s.sets.map((item) =>
          item.id === setId ? { ...item, [field]: value } : item
        ),
      }))
    );
  };

  const handleAddSet = async (sessionId: string, exerciseId: string) => {
    const currentSets =
      activeSession?.sets.filter((s) => s.exerciseId === exerciseId) || [];
    const lastSet = currentSets[currentSets.length - 1];

    const newSetNum = currentSets.length + 1;
    const defaultWeight = lastSet ? lastSet.weightKg : 0;
    const defaultReps = lastSet ? lastSet.reps : 8;

    const res = await logWorkoutSetAction({
      sessionId,
      exerciseId,
      setNumber: newSetNum,
      reps: defaultReps,
      weightKg: defaultWeight,
      completed: false,
    });

    if (res.id) {
      const createdSet: WorkoutSet = {
        id: res.id,
        sessionId,
        exerciseId,
        setNumber: newSetNum,
        weightKg: defaultWeight,
        reps: defaultReps,
        rpe: null,
        isWarmup: false,
        isPR: false,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, sets: [...s.sets, createdSet] } : s
        )
      );
    }
  };

  const handleDeleteSet = async (setId: string) => {
    await deleteWorkoutSetAction(setId);
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        sets: s.sets.filter((item) => item.id !== setId),
      }))
    );
  };

  const handleAddExerciseToActiveSession = async (exerciseId: string) => {
    if (!activeSession) return;
    await logWorkoutSetAction({
      sessionId: activeSession.id,
      exerciseId,
      setNumber: 1,
      weightKg: 0,
      reps: 8,
      completed: false,
    });
    setIsAddExerciseToSessionOpen(false);
    window.location.reload();
  };

  const handleFinishWorkout = async () => {
    if (!activeSession) return;
    await finishWorkoutSessionAction({
      sessionId: activeSession.id,
      rating: sessionRating,
      notes: sessionNotes,
    });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    setIsFinishSessionOpen(false);
    window.location.reload();
  };

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const res = await createExerciseAction({
      name: newExName.trim(),
      muscleGroup: newExMuscle,
      equipment: newExEquipment,
      personalRecord: newExPR.trim() || undefined,
      notes: newExNotes.trim() || undefined,
    });

    if (res.id) {
      const created: Exercise = {
        id: res.id,
        name: newExName.trim(),
        muscleGroup: newExMuscle,
        equipment: newExEquipment,
        personalRecord: newExPR.trim() || null,
        notes: newExNotes.trim() || "",
        createdAt: new Date().toISOString(),
      };
      setExercisesList([created, ...exercisesList]);
      setNewExName("");
      setNewExPR("");
      setNewExNotes("");
      setIsNewExerciseOpen(false);
    }
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;

    const res = await createRoutineAction({
      name: newRoutineName.trim(),
      description: newRoutineDesc.trim(),
      daysPerWeek: parseInt(newRoutineDays) || 3,
      exerciseIds: selectedExerciseIds,
    });

    if (res.id) {
      window.location.reload();
    }
  };

  // Group active session sets by exercise
  const activeSessionExercises = React.useMemo(() => {
    if (!activeSession) return [];
    const exerciseIds = Array.from(new Set(activeSession.sets.map((s) => s.exerciseId)));
    return exerciseIds.map((exId) => {
      const ex = exerciseMap[exId];
      const sets = activeSession.sets.filter((s) => s.exerciseId === exId);
      const history = historyByExercise[exId] || [];
      const prevSession = history.find((h) => h.date !== activeSession.date) || history[0];
      return {
        exercise: ex,
        sets,
        prevSession,
      };
    });
  }, [activeSession, exerciseMap, historyByExercise]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Fitness & Progressive Training
            </h1>
            {activeSession ? (
              <Badge variant="accent" className="text-[10px] animate-pulse">
                Active Workout In Progress
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] font-mono">
                {sessions.length} Sessions Logged
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tactile set logging, previous session weights, and progressive overload tracking.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {activeSession ? (
            <Button
              size="sm"
              onClick={() => setIsFinishSessionOpen(true)}
              className="h-8 text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold"
            >
              <Check className="h-4 w-4" />
              <span>Finish Workout</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => handleStartWorkout()}
              className="h-8 text-xs gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Start Workout</span>
            </Button>
          )}
        </div>
      </div>

      {/* Rest Timer Float / Banner */}
      {showRestTimer && (
        <div className="sticky top-16 z-30 flex justify-end">
          <RestTimer initialSeconds={90} onClose={() => setShowRestTimer(false)} />
        </div>
      )}

      {/* ACTIVE WORKOUT MODE VIEW */}
      {activeSession ? (
        <div className="space-y-6 animate-in fade-in-50">
          {/* Active Workout Top Banner */}
          <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                Live Workout Mode
              </span>
              <h2 className="text-base font-bold text-zinc-100">
                {activeSession.name}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddExerciseToSessionOpen(true)}
                className="h-8 text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Exercise
              </Button>
            </div>
          </div>

          {/* Exercise Groups with Fast Tactile Set Logging */}
          <div className="space-y-5">
            {activeSessionExercises.map(({ exercise, sets, prevSession }) => {
              if (!exercise) return null;

              return (
                <div
                  key={exercise.id}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-950 overflow-hidden"
                >
                  {/* Exercise Header */}
                  <div className="p-4 bg-zinc-900/40 border-b border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-zinc-100">
                          {exercise.name}
                        </h3>
                        <Badge variant="secondary" className="text-[9px] uppercase font-mono">
                          {exercise.muscleGroup}
                        </Badge>
                        {exercise.personalRecord && (
                          <Badge variant="accent" className="text-[9px] font-mono">
                            PR: {exercise.personalRecord}
                          </Badge>
                        )}
                      </div>

                      {/* Previous Session History Callout! */}
                      {prevSession && prevSession.sets.length > 0 && (
                        <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                          <span className="text-zinc-500">Last session ({formatDate(prevSession.date)}): </span>
                          {prevSession.sets
                            .map((s) => `${s.weightKg}kg×${s.reps}`)
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddSet(activeSession.id, exercise.id)}
                      className="h-7 text-xs gap-1 text-zinc-300 hover:text-zinc-100"
                    >
                      <Plus className="h-3 w-3" />
                      Add Set
                    </Button>
                  </div>

                  {/* Sets Table */}
                  <div className="p-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[10px] font-mono uppercase text-zinc-500 border-b border-zinc-800/60 text-left">
                          <th className="pb-2 w-12 text-center">Set</th>
                          <th className="pb-2 w-28">Weight (kg)</th>
                          <th className="pb-2 w-24">Reps</th>
                          <th className="pb-2 w-20">RPE</th>
                          <th className="pb-2 w-20">Warmup</th>
                          <th className="pb-2 w-20 text-center">Done</th>
                          <th className="pb-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/40">
                        {sets.map((set, idx) => (
                          <tr
                            key={set.id}
                            className={`transition-colors ${
                              set.completed
                                ? "bg-emerald-500/5 text-zinc-300"
                                : "hover:bg-zinc-900/30"
                            }`}
                          >
                            <td className="py-2 font-mono text-center font-semibold text-zinc-400">
                              {idx + 1}
                            </td>

                            <td className="py-2 pr-2">
                              <input
                                type="number"
                                step="0.5"
                                value={set.weightKg === 0 ? "" : set.weightKg}
                                placeholder="0"
                                onChange={(e) =>
                                  handleUpdateSetField(
                                    set.id,
                                    "weightKg",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="h-7 w-20 rounded bg-zinc-900 border border-zinc-800 px-2 text-xs font-mono text-zinc-100 outline-none focus:border-zinc-600"
                              />
                            </td>

                            <td className="py-2 pr-2">
                              <input
                                type="number"
                                value={set.reps === 0 ? "" : set.reps}
                                placeholder="0"
                                onChange={(e) =>
                                  handleUpdateSetField(
                                    set.id,
                                    "reps",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="h-7 w-16 rounded bg-zinc-900 border border-zinc-800 px-2 text-xs font-mono text-zinc-100 outline-none focus:border-zinc-600"
                              />
                            </td>

                            <td className="py-2 pr-2">
                              <input
                                type="number"
                                step="0.5"
                                max="10"
                                min="5"
                                value={set.rpe || ""}
                                placeholder="8"
                                onChange={(e) =>
                                  handleUpdateSetField(
                                    set.id,
                                    "rpe",
                                    parseFloat(e.target.value) || null
                                  )
                                }
                                className="h-7 w-14 rounded bg-zinc-900 border border-zinc-800 px-2 text-xs font-mono text-zinc-100 outline-none focus:border-zinc-600"
                              />
                            </td>

                            <td className="py-2 pr-2">
                              <input
                                type="checkbox"
                                checked={set.isWarmup}
                                onChange={(e) =>
                                  handleUpdateSetField(
                                    set.id,
                                    "isWarmup",
                                    e.target.checked
                                  )
                                }
                                className="rounded bg-zinc-900 border-zinc-700"
                              />
                            </td>

                            <td className="py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSetComplete(set)}
                                className={`h-7 w-7 rounded-md flex items-center justify-center mx-auto transition-all cursor-pointer ${
                                  set.completed
                                    ? "bg-emerald-500 text-zinc-950 font-bold shadow-xs scale-105"
                                    : "border border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600"
                                }`}
                              >
                                <Check className="h-4 w-4 stroke-[3]" />
                              </button>
                            </td>

                            <td className="py-2 text-right">
                              <button
                                onClick={() => handleDeleteSet(set.id)}
                                className="p-1 text-zinc-600 hover:text-rose-400 rounded transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* STANDARD OVERVIEW MODE (Tabs: History, Exercise Library, Routines) */
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid grid-cols-3 w-full h-8 bg-zinc-900/90 border border-zinc-800/80 mb-6">
            <TabsTrigger value="history" className="text-xs">
              Workout History ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="exercises" className="text-xs">
              Exercise Library & PRs ({exercisesList.length})
            </TabsTrigger>
            <TabsTrigger value="routines" className="text-xs">
              Routines & Plans ({routines.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: WORKOUT HISTORY */}
          <TabsContent value="history" className="space-y-4">
            {sessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-800/80 rounded-lg">
                No completed workouts yet. Click "Start Workout" above to begin your session.
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((sess) => {
                  const completedSets = sess.sets.filter((s) => s.completed);
                  const totalVolume = completedSets.reduce(
                    (acc, s) => acc + s.weightKg * s.reps,
                    0
                  );
                  const exerciseCount = new Set(sess.sets.map((s) => s.exerciseId)).size;

                  return (
                    <div
                      key={sess.id}
                      className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-all space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-zinc-100">
                              {sess.name}
                            </h3>
                            <Badge variant="secondary" className="font-mono text-[10px]">
                              {formatDate(sess.date)}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {exerciseCount} exercises &bull; {completedSets.length} sets completed &bull; Total Volume:{" "}
                            <span className="font-mono text-zinc-200">{totalVolume.toLocaleString()} kg</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {sess.rating && (
                            <span className="text-xs font-mono text-amber-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                              ★ {sess.rating}/5
                            </span>
                          )}
                          <button
                            onClick={() => {
                              if (confirm("Delete this workout session log?")) {
                                deleteWorkoutSessionAction(sess.id);
                                setSessions((prev) => prev.filter((s) => s.id !== sess.id));
                              }
                            }}
                            className="p-1 text-zinc-600 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {sess.notes && (
                        <p className="text-xs text-zinc-400 italic pt-1 border-t border-zinc-800/40">
                          &ldquo;{sess.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: EXERCISE LIBRARY & PRS */}
          <TabsContent value="exercises" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Muscle Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "all", label: "All Muscles" },
                  { id: "chest", label: "Chest" },
                  { id: "back", label: "Back" },
                  { id: "shoulders", label: "Shoulders" },
                  { id: "legs", label: "Legs" },
                  { id: "arms", label: "Arms" },
                  { id: "core", label: "Core" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMuscleFilter(m.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      muscleFilter === m.id
                        ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60"
                        : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 border border-zinc-800/60"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <Button
                size="sm"
                onClick={() => setIsNewExerciseOpen(true)}
                className="h-8 text-xs gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Exercise</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exercisesList
                .filter((e) => muscleFilter === "all" || e.muscleGroup === muscleFilter)
                .map((ex) => (
                  <div
                    key={ex.id}
                    className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100">
                          {ex.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                            {ex.muscleGroup}
                          </Badge>
                          <span className="text-[10px] font-mono text-zinc-500 capitalize">
                            {ex.equipment}
                          </span>
                        </div>
                      </div>

                      {ex.personalRecord ? (
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-mono text-amber-400 block">
                            Personal Record
                          </span>
                          <span className="text-xs font-bold font-mono text-zinc-100">
                            {ex.personalRecord}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[9px]">
                          No PR yet
                        </Badge>
                      )}
                    </div>

                    {ex.notes && (
                      <p className="text-xs text-zinc-400 bg-zinc-900/50 p-2.5 rounded border border-zinc-800/40">
                        {ex.notes}
                      </p>
                    )}

                    {/* Embedded Polymorphic EntityNotes! */}
                    <div className="pt-2 border-t border-zinc-800/50">
                      <EntityNotes
                        entityType="exercise"
                        entityId={ex.id}
                        entityTitle={ex.name}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          {/* TAB 3: ROUTINES & PLANS */}
          <TabsContent value="routines" className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">
                Preset training split templates
              </span>
              <Button
                size="sm"
                onClick={() => setIsNewRoutineOpen(true)}
                className="h-8 text-xs gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Routine</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routines.map((rt) => (
                <div
                  key={rt.id}
                  className="p-5 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-zinc-100">
                        {rt.name}
                      </h3>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {rt.daysPerWeek}x / week
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400">{rt.description}</p>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-zinc-500">
                      {rt.exerciseIds.length} exercises programmed
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleStartWorkout(rt.id)}
                      className="h-7 text-xs gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Start Routine</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Finish Workout Dialog */}
      <Dialog open={isFinishSessionOpen} onOpenChange={setIsFinishSessionOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Complete Workout Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1.5 block">
                Session Feeling / Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setSessionRating(star)}
                    className={`flex-1 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                      sessionRating === star
                        ? "bg-amber-400 text-zinc-950 shadow-sm"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    ★ {star}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Workout Notes & Reflections
              </label>
              <Textarea
                placeholder="How did the weights feel? Any fatigue, PRs, or form cues to remember?"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={3}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsFinishSessionOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleFinishWorkout}
                className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold"
              >
                Finish & Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Exercise to Session Dialog */}
      <Dialog open={isAddExerciseToSessionOpen} onOpenChange={setIsAddExerciseToSessionOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Add Exercise to Current Workout
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto pt-2">
            {exercisesList.map((ex) => (
              <div
                key={ex.id}
                onClick={() => handleAddExerciseToActiveSession(ex.id)}
                className="p-2.5 rounded bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/60 flex items-center justify-between cursor-pointer text-xs"
              >
                <div className="font-medium text-zinc-200">{ex.name}</div>
                <Badge variant="secondary" className="text-[9px] uppercase font-mono">
                  {ex.muscleGroup}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Exercise Dialog */}
      <Dialog open={isNewExerciseOpen} onOpenChange={setIsNewExerciseOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Create New Exercise
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateExercise} className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Exercise Name
              </label>
              <Input
                placeholder="e.g. Incline Dumbbell Press"
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                required
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Muscle Group
                </label>
                <select
                  value={newExMuscle}
                  onChange={(e) => setNewExMuscle(e.target.value as any)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="chest">Chest</option>
                  <option value="back">Back</option>
                  <option value="shoulders">Shoulders</option>
                  <option value="legs">Legs</option>
                  <option value="arms">Arms</option>
                  <option value="core">Core</option>
                  <option value="full_body">Full Body</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Equipment
                </label>
                <select
                  value={newExEquipment}
                  onChange={(e) => setNewExEquipment(e.target.value as any)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="barbell">Barbell</option>
                  <option value="dumbbell">Dumbbell</option>
                  <option value="cable">Cable</option>
                  <option value="machine">Machine</option>
                  <option value="bodyweight">Bodyweight</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Personal Record (PR)
              </label>
              <Input
                placeholder="e.g. 36kg x 8 reps"
                value={newExPR}
                onChange={(e) => setNewExPR(e.target.value)}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Technique Cues & Setup
              </label>
              <Input
                placeholder="e.g. Set bench to 30 degrees, retract scapula..."
                value={newExNotes}
                onChange={(e) => setNewExNotes(e.target.value)}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewExerciseOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!newExName.trim()}>
                Create Exercise
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Routine Dialog */}
      <Dialog open={isNewRoutineOpen} onOpenChange={setIsNewRoutineOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Create New Workout Routine
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRoutine} className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Routine Name
              </label>
              <Input
                placeholder="e.g. Push Hypertrophy A"
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value)}
                required
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Description
              </label>
              <Input
                placeholder="e.g. Chest, front delts, and triceps focus"
                value={newRoutineDesc}
                onChange={(e) => setNewRoutineDesc(e.target.value)}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Target Days Per Week
              </label>
              <Input
                type="number"
                value={newRoutineDays}
                onChange={(e) => setNewRoutineDays(e.target.value)}
                className="text-xs bg-zinc-900/80 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Select Programmed Exercises
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-zinc-900/50 rounded border border-zinc-800">
                {exercisesList.map((ex) => {
                  const isChecked = selectedExerciseIds.includes(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedExerciseIds(selectedExerciseIds.filter((id) => id !== ex.id));
                        } else {
                          setSelectedExerciseIds([...selectedExerciseIds, ex.id]);
                        }
                      }}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-800/60 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded bg-zinc-900 border-zinc-700"
                      />
                      <span className="text-zinc-200">{ex.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewRoutineOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!newRoutineName.trim()}>
                Create Routine
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
