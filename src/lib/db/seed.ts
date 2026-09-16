import { db } from "./index";
import {
  goals,
  goalMilestones,
  goalReflections,
  projects,
  sprints,
  tasks,
  subtasks,
  learningTopics,
  learningResources,
  studySessions,
  problems,
  problemAttempts,
  workoutRoutines,
  exercises,
  routineExercises,
  workoutSessions,
  workoutSets,
  financialAccounts,
  transactions,
  upcomingCashflows,
  wishlistItems,
  notes,
} from "./schema";

export async function seedDatabase() {
  console.log("🌱 Seeding MOSHA V2 database...");

  // 1. Major Goals
  const goal1Id = "goal-dist-systems";
  const goal2Id = "goal-peak-fitness";
  const goal3Id = "goal-ship-mosha";

  await db.insert(goals).values([
    {
      id: goal1Id,
      title: "Master Distributed Systems & High-Throughput Engineering",
      category: "engineering",
      icon: "⚡",
      status: "active",
      targetYearOrDate: "2027-01-01",
      visionStatement: "Build resilient, fault-tolerant systems capable of millions of RPS with deep mechanical sympathy, consensus protocol mastery, and clear low-level understanding.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: goal2Id,
      title: "Peak Physical Conditioning & 100kg Bench Press",
      category: "fitness",
      icon: "🏋️‍♂️",
      status: "active",
      targetYearOrDate: "2026-12-31",
      visionStatement: "Build lasting strength, maintain sub-15% body fat, hit 100kg bench press for clean reps, and sustain 5km cardiovascular conditioning.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: goal3Id,
      title: "Design & Build MOSHA into Daily Life Operating System",
      category: "career",
      icon: "🌌",
      status: "active",
      targetYearOrDate: "2026-10-01",
      visionStatement: "Consolidate my projects, technical learning, problem solving, workouts, money, and thoughts into one tactile, joyful, and privacy-first personal operating system.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  await db.insert(goalMilestones).values([
    {
      id: "gm-1",
      goalId: goal1Id,
      title: "Read Google Spanner, Raft & Bigtable original papers",
      targetDate: "2026-08-15",
      completed: true,
      completedAt: "2026-08-10",
      order: 1,
    },
    {
      id: "gm-2",
      goalId: goal1Id,
      title: "Implement Raft consensus algorithm from scratch in Go",
      targetDate: "2026-11-01",
      completed: false,
      order: 2,
    },
    {
      id: "gm-3",
      goalId: goal1Id,
      title: "Build distributed KV store with linearizable consistency",
      targetDate: "2026-12-30",
      completed: false,
      order: 3,
    },
    {
      id: "gm-4",
      goalId: goal2Id,
      title: "Hit 90kg bench press for 5 clean reps",
      targetDate: "2026-09-01",
      completed: true,
      completedAt: "2026-08-28",
      order: 1,
    },
    {
      id: "gm-5",
      goalId: goal2Id,
      title: "Hit 100kg bench press for 1RM",
      targetDate: "2026-12-01",
      completed: false,
      order: 2,
    },
  ]).onConflictDoNothing();

  await db.insert(goalReflections).values([
    {
      id: "gr-1",
      goalId: goal1Id,
      date: "2026-09-10",
      title: "Breakthrough on Raft election safety invariant",
      content: "Spent 3 hours dissecting election timeouts and how term numbers enforce safety during network partitions. It finally clicked: an elected leader is guaranteed to contain all committed log entries without needing log repair back-propagation.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "gr-2",
      goalId: goal2Id,
      date: "2026-09-12",
      title: "Bench press bar path adjustment",
      content: "Switched to slightly more tucked elbows and explosive leg drive off the bottom. 87.5kg felt substantially faster and zero shoulder pinch.",
      createdAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  // 2. Projects & Sprints & Tasks
  const proj1Id = "proj-mosha";
  const proj2Id = "proj-gopher-raft";
  const proj3Id = "proj-kernel-allocator";

  await db.insert(projects).values([
    {
      id: proj1Id,
      title: "MOSHA V2 — Personal Operating System",
      description: "My unified personal operating system integrating projects, technical learning, problem solving, workouts, money, and notes.",
      status: "active",
      priority: "urgent",
      goalId: goal3Id,
      techStack: JSON.stringify(["Next.js", "TypeScript", "TailwindCSS", "SQLite", "Framer Motion", "Drizzle"]),
      repositoryUrl: "https://github.com/Ahmad-Mosha/mosha-v2",
      startDate: "2026-09-01",
      targetDate: "2026-10-01",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: proj2Id,
      title: "GopherRaft — Distributed Consensus Engine",
      description: "A production-grade implementation of the Raft consensus algorithm written in Go, featuring log compaction, membership changes, and gRPC transport.",
      status: "active",
      priority: "high",
      goalId: goal1Id,
      techStack: JSON.stringify(["Go", "gRPC", "Protobuf", "BoltDB"]),
      repositoryUrl: "https://github.com/Ahmad-Mosha/gopher-raft",
      startDate: "2026-08-15",
      targetDate: "2026-11-15",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: proj3Id,
      title: "SlabMem — Minimalist C Kernel Memory Allocator",
      description: "Custom slab & buddy memory allocator for bare metal x86-64 kernel development.",
      status: "planning",
      priority: "medium",
      goalId: goal1Id,
      techStack: JSON.stringify(["C", "x86-64 Assembly", "Make"]),
      startDate: "2026-10-15",
      targetDate: "2026-12-01",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  const sprint1Id = "sprint-mosha-1";
  await db.insert(sprints).values([
    {
      id: sprint1Id,
      projectId: proj1Id,
      name: "Sprint 1: Core Engine & Workflows",
      goal: "Ship full interactive Kanban board, universal notes, learning checkpoints, and mobile workout logging.",
      status: "active",
      startDate: "2026-09-10",
      endDate: "2026-09-24",
      createdAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  const task1Id = "task-kanban-dnd";
  const task2Id = "task-learning-checkpoint";
  const task3Id = "task-workout-mobile";
  const task4Id = "task-cashflow-forecaster";
  const task5Id = "task-raft-rpc";

  await db.insert(tasks).values([
    {
      id: task1Id,
      projectId: proj1Id,
      sprintId: sprint1Id,
      title: "Implement smooth 60fps Kanban drag & drop board",
      description: "Use @dnd-kit to support moving tasks across status columns and reordering within columns with drop animation indicators.",
      status: "in_progress",
      priority: "urgent",
      order: 1,
      dueDate: "2026-09-18",
      estimateHours: 4,
      isFocusToday: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: task2Id,
      projectId: proj1Id,
      sprintId: sprint1Id,
      title: "Build stateful Learning Checkpoint & next-step widget",
      description: "Ensure learning topics clearly answer 'Where did I stop?' and 'What's next?' with instant inline updating.",
      status: "todo",
      priority: "high",
      order: 2,
      dueDate: "2026-09-19",
      estimateHours: 3,
      isFocusToday: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: task3Id,
      projectId: proj1Id,
      sprintId: sprint1Id,
      title: "Design mobile-first tactile workout set logger",
      description: "Quick 1-tap set completion with historical context ('Last time: 85kg x 8') and auto-fill weights.",
      status: "in_progress",
      priority: "high",
      order: 3,
      dueDate: "2026-09-20",
      estimateHours: 5,
      isFocusToday: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: task4Id,
      projectId: proj1Id,
      sprintId: sprint1Id,
      title: "Build personal financial pulse & cashflow forecaster",
      description: "Track accounts, income/expenses, and upcoming bills with a clean non-overwhelming UI.",
      status: "todo",
      priority: "medium",
      order: 4,
      dueDate: "2026-09-21",
      estimateHours: 3,
      isFocusToday: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: task5Id,
      projectId: proj2Id,
      sprintId: null,
      title: "Implement AppendEntries RPC and Heartbeat mechanism",
      description: "Wire leader heartbeat broadcast loop with monotonic term check and follower log rejection.",
      status: "backlog",
      priority: "high",
      order: 5,
      dueDate: "2026-09-28",
      estimateHours: 8,
      isFocusToday: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  await db.insert(subtasks).values([
    {
      id: "sub-1",
      taskId: task1Id,
      title: "Configure DndContext with Keyboard, Pointer & Touch sensors",
      completed: true,
      order: 1,
    },
    {
      id: "sub-2",
      taskId: task1Id,
      title: "Create DragOverlay for tactile preview card",
      completed: true,
      order: 2,
    },
    {
      id: "sub-3",
      taskId: task1Id,
      title: "Persist column and sort order mutations to SQLite",
      completed: false,
      order: 3,
    },
  ]).onConflictDoNothing();

  // 3. Learning Topics & Study Sessions
  const topic1Id = "topic-os-virtual-memory";
  const topic2Id = "topic-distributed-raft";
  const topic3Id = "topic-go-runtime";

  await db.insert(learningTopics).values([
    {
      id: topic1Id,
      title: "Operating Systems: Virtual Memory & Page Tables",
      category: "systems",
      icon: "🧠",
      status: "in_progress",
      difficulty: "advanced",
      currentCheckpoint: "Chapter 4: Multi-level page tables & TLB shootdowns in Linux x86-64",
      nextStep: "Implement toy TLB simulation in C to observe cache miss latency vs walk penalty",
      isCurrentFocus: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: topic2Id,
      title: "Distributed Systems: Consensus & Fault Tolerance",
      category: "distributed",
      icon: "🌐",
      status: "in_progress",
      difficulty: "advanced",
      currentCheckpoint: "Raft Log Replication safety invariant and leader completeness proof",
      nextStep: "Study Paxos vs Raft trade-offs regarding leader bottleneck under high write concurrency",
      isCurrentFocus: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: topic3Id,
      title: "Go Internals: GMP Scheduler & Memory Allocator",
      category: "languages",
      icon: "🐹",
      status: "in_progress",
      difficulty: "intermediate",
      currentCheckpoint: "Work-stealing algorithm in Go runtime src/runtime/proc.go",
      nextStep: "Benchmark sysmon preemptive scheduling on tight loops without function calls",
      isCurrentFocus: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  await db.insert(learningResources).values([
    {
      id: "res-1",
      topicId: topic1Id,
      title: "Operating Systems: Three Easy Pieces (OSTEP)",
      url: "https://pages.cs.wisc.edu/~remzi/OSTEP/",
      type: "book",
      status: "active",
      notes: "Chapters 18-20 on Paging, Multi-level page tables, and TLBs.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "res-2",
      topicId: topic1Id,
      title: "Understanding the Linux Kernel (Bovet & Cesati)",
      url: "https://www.oreilly.com/library/view/understanding-the-linux/0596005652/",
      type: "book",
      status: "active",
      notes: "Deep dive into page fault handler and zone allocators.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "res-3",
      topicId: topic2Id,
      title: "In Search of an Understandable Consensus Algorithm (Ongaro & Ousterhout)",
      url: "https://raft.github.io/raft.pdf",
      type: "paper",
      status: "completed",
      notes: "Original Raft paper. Essential reading.",
      createdAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  await db.insert(studySessions).values([
    {
      id: "study-1",
      topicId: topic1Id,
      durationMinutes: 90,
      date: "2026-09-14",
      summary: "Read OSTEP chapter on Smaller Tables (Multi-level page tables, inverted page tables). Walked through 4-level page table translation on x86-64: CR3 -> PML4 -> PDPT -> PD -> PT.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "study-2",
      topicId: topic1Id,
      durationMinutes: 60,
      date: "2026-09-15",
      summary: "Studied Hardware TLB handling vs Software-managed TLB (MIPS). Analyzed cost of context switch on TLB invalidation (CR3 write vs PCID tags).",
      createdAt: new Date().toISOString(),
    },
    {
      id: "study-3",
      topicId: topic2Id,
      durationMinutes: 75,
      date: "2026-09-13",
      summary: "Traced AppendEntries RPC conflict resolution logic. Verified how follower overwrites uncommitted conflicting entries.",
      createdAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  // 4. Problems (DSA & Problem Solving)
  const prob1Id = "prob-course-schedule-ii";
  const prob2Id = "prob-lru-cache";
  const prob3Id = "prob-trapping-rain-water";

  await db.insert(problems).values([
    {
      id: prob1Id,
      title: "Course Schedule II",
      platform: "leetcode",
      difficulty: "medium",
      topicTags: JSON.stringify(["Graph", "Topological Sort", "Kahn's Algorithm", "BFS"]),
      status: "solved",
      url: "https://leetcode.com/problems/course-schedule-ii/",
      needsRevision: true,
      revisionDate: "2026-09-16",
      bestTimeComplexity: "O(V + E)",
      bestSpaceComplexity: "O(V + E)",
      keyInsight: "Calculate in-degrees of all nodes. Push all in-degree 0 nodes into a queue. As nodes pop, decrement neighbors' in-degree. If processed node count != numCourses, graph contains a cycle.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: prob2Id,
      title: "LRU Cache",
      platform: "leetcode",
      difficulty: "medium",
      topicTags: JSON.stringify(["Hash Map", "Doubly Linked List", "Design"]),
      status: "mastered",
      url: "https://leetcode.com/problems/lru-cache/",
      needsRevision: false,
      bestTimeComplexity: "O(1) get, O(1) put",
      bestSpaceComplexity: "O(capacity)",
      keyInsight: "Combine a hash map for O(1) key-to-node lookup with a doubly linked list (with dummy head and tail) to achieve O(1) removal and insertion at most recently used position.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: prob3Id,
      title: "Trapping Rain Water",
      platform: "leetcode",
      difficulty: "hard",
      topicTags: JSON.stringify(["Two Pointers", "Monotonic Stack", "Array"]),
      status: "solved",
      url: "https://leetcode.com/problems/trapping-rain-water/",
      needsRevision: true,
      revisionDate: "2026-09-20",
      bestTimeComplexity: "O(N)",
      bestSpaceComplexity: "O(1)",
      keyInsight: "Two pointers inward from left and right. The water trapped at current bar depends on min(max_left, max_right) - height. Advance the pointer with smaller max barrier.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  await db.insert(problemAttempts).values([
    {
      id: "attempt-1",
      problemId: prob1Id,
      date: "2026-09-02",
      timeSpentMinutes: 28,
      passed: true,
      language: "TypeScript",
      solutionCode: `function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  const adj = Array.from({ length: numCourses }, () => [] as number[]);
  const inDegree = new Array(numCourses).fill(0);

  for (const [course, pre] of prerequisites) {
    adj[pre].push(course);
    inDegree[course]++;
  }

  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  const order: number[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    order.push(curr);
    for (const next of adj[curr]) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }

  return order.length === numCourses ? order : [];
}`,
      notes: "Implemented cleanly using Kahn's algorithm. Watch out for disconnected nodes!",
      createdAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  // 5. Fitness Routines, Exercises, Sessions
  const routine1Id = "routine-upper-power";
  const routine2Id = "routine-lower-power";

  await db.insert(workoutRoutines).values([
    {
      id: routine1Id,
      name: "Upper Body Power",
      description: "Heavy horizontal & vertical push/pull focused on strength and progressive overload.",
      daysPerWeek: 2,
      targetMuscles: JSON.stringify(["chest", "back", "shoulders", "arms"]),
      createdAt: new Date().toISOString(),
    },
    {
      id: routine2Id,
      name: "Lower Body & Core",
      description: "Squat, Romanian deadlifts, lunges, and abdominal bracing.",
      daysPerWeek: 2,
      targetMuscles: JSON.stringify(["legs", "core"]),
      createdAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  const ex1Id = "ex-bench-press";
  const ex2Id = "ex-pull-up";
  const ex3Id = "ex-overhead-press";
  const ex4Id = "ex-rdl";

  await db.insert(exercises).values([
    {
      id: ex1Id,
      name: "Barbell Bench Press",
      muscleGroup: "chest",
      equipment: "barbell",
      personalRecord: "90kg x 5 reps",
      notes: "Plant feet firmly, retract and depress scapula, touch mid-sternum, drive bar up and slightly back.",
      createdAt: new Date().toISOString(),
    },
    {
      id: ex2Id,
      name: "Weighted Pull-Up",
      muscleGroup: "back",
      equipment: "bodyweight",
      personalRecord: "+22.5kg x 5 reps",
      notes: "Full dead hang stretch at bottom, chest to bar at top, no kipping.",
      createdAt: new Date().toISOString(),
    },
    {
      id: ex3Id,
      name: "Overhead Barbell Press",
      muscleGroup: "shoulders",
      equipment: "barbell",
      personalRecord: "60kg x 5 reps",
      notes: "Squeeze glutes, brace core, press straight up moving head forward once bar clears chin.",
      createdAt: new Date().toISOString(),
    },
    {
      id: ex4Id,
      name: "Romanian Deadlift",
      muscleGroup: "legs",
      equipment: "barbell",
      personalRecord: "120kg x 6 reps",
      notes: "Hinge at hips, keep bar close to shins, feel deep hamstring stretch, neutral spine.",
      createdAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  await db.insert(routineExercises).values([
    {
      id: "re-1",
      routineId: routine1Id,
      exerciseId: ex1Id,
      order: 1,
      targetSets: 4,
      targetReps: "5-6",
    },
    {
      id: "re-2",
      routineId: routine1Id,
      exerciseId: ex2Id,
      order: 2,
      targetSets: 4,
      targetReps: "5-6",
    },
    {
      id: "re-3",
      routineId: routine1Id,
      exerciseId: ex3Id,
      order: 3,
      targetSets: 3,
      targetReps: "8-10",
    },
  ]).onConflictDoNothing();

  const sess1Id = "sess-upper-last";
  await db.insert(workoutSessions).values([
    {
      id: sess1Id,
      routineId: routine1Id,
      name: "Upper Body Power #18",
      date: "2026-09-14",
      startTime: "18:00",
      endTime: "19:15",
      status: "completed",
      rating: 5,
      notes: "Great energy. Hit clean 87.5kg for 5 on bench press!",
      createdAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  await db.insert(workoutSets).values([
    {
      id: "set-1",
      sessionId: sess1Id,
      exerciseId: ex1Id,
      setNumber: 1,
      reps: 8,
      weightKg: 60,
      rpe: 6,
      isWarmup: true,
      isPR: false,
      completed: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "set-2",
      sessionId: sess1Id,
      exerciseId: ex1Id,
      setNumber: 2,
      reps: 5,
      weightKg: 82.5,
      rpe: 8,
      isWarmup: false,
      isPR: false,
      completed: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "set-3",
      sessionId: sess1Id,
      exerciseId: ex1Id,
      setNumber: 3,
      reps: 5,
      weightKg: 87.5,
      rpe: 8.5,
      isWarmup: false,
      isPR: true,
      completed: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "set-4",
      sessionId: sess1Id,
      exerciseId: ex1Id,
      setNumber: 4,
      reps: 5,
      weightKg: 87.5,
      rpe: 9,
      isWarmup: false,
      isPR: false,
      completed: true,
      createdAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  // 6. Money (Financial Accounts, Transactions, Cashflow, Wishlist)
  const acc1Id = "acc-checking";
  const acc2Id = "acc-savings";
  const acc3Id = "acc-tech-fund";

  await db.insert(financialAccounts).values([
    {
      id: acc1Id,
      name: "Main Checking",
      type: "checking",
      currentBalance: 4620.50,
      currency: "USD",
      isPrimary: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: acc2Id,
      name: "Emergency Reserve (HYSA)",
      type: "savings",
      currentBalance: 19400.00,
      currency: "USD",
      isPrimary: false,
      updatedAt: new Date().toISOString(),
    },
    {
      id: acc3Id,
      name: "Hardware & Gear Fund",
      type: "savings",
      currentBalance: 950.00,
      currency: "USD",
      isPrimary: false,
      updatedAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  await db.insert(transactions).values([
    {
      id: "tx-1",
      accountId: acc1Id,
      type: "income",
      amount: 6800.00,
      category: "salary",
      description: "Monthly Software Engineering Salary",
      date: "2026-09-01",
      isRecurring: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tx-2",
      accountId: acc1Id,
      type: "expense",
      amount: 1450.00,
      category: "housing",
      description: "Apartment Rent & Utilities",
      date: "2026-09-02",
      isRecurring: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tx-3",
      accountId: acc1Id,
      type: "expense",
      amount: 45.00,
      category: "software_subs",
      description: "GitHub Copilot + Cursor Pro subscription",
      date: "2026-09-05",
      isRecurring: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tx-4",
      accountId: acc1Id,
      type: "expense",
      amount: 85.00,
      category: "fitness",
      description: "Gym Membership",
      date: "2026-09-07",
      isRecurring: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tx-5",
      accountId: acc1Id,
      type: "expense",
      amount: 140.00,
      category: "food",
      description: "Weekly Whole Foods groceries",
      date: "2026-09-12",
      isRecurring: false,
      createdAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  await db.insert(upcomingCashflows).values([
    {
      id: "cf-1",
      type: "expense",
      title: "AWS Cloud Infrastructure Invoice",
      amount: 48.20,
      expectedDate: "2026-09-22",
      category: "software_subs",
      isPaid: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "cf-2",
      type: "expense",
      title: "Gigabit Fiber Internet",
      amount: 70.00,
      expectedDate: "2026-09-25",
      category: "housing",
      isPaid: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "cf-3",
      type: "income",
      title: "Engineering Consulting / Code Review",
      amount: 1200.00,
      expectedDate: "2026-09-28",
      category: "freelance",
      isPaid: false,
      createdAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  await db.insert(wishlistItems).values([
    {
      id: "wish-1",
      title: "Keychron Q1 Pro Mechanical Keyboard (Banana Switches)",
      estimatedCost: 210.00,
      savedAmount: 210.00,
      priority: "high",
      targetDate: "2026-09-25",
      notes: "Full CNC aluminum body, QMK/VIA programmable, wireless 2.4G.",
      url: "https://www.keychron.com",
      status: "ready_to_buy",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "wish-2",
      title: "Dell UltraSharp 32-inch 4K USB-C Hub Monitor (U3223QE)",
      estimatedCost: 720.00,
      savedAmount: 500.00,
      priority: "medium",
      targetDate: "2026-11-01",
      notes: "IPS Black technology with 2000:1 contrast ratio. Perfect for coding.",
      status: "saving",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  // 7. Universal Notes (Attached & Standalone)
  await db.insert(notes).values([
    {
      id: "note-standalone-principles",
      title: "First Principles for Software Engineering Architecture",
      content: `## Engineering Axioms
1. **Mechanical Sympathy**: Understand the hardware underneath (cache lines, page tables, TLBs, context switches).
2. **Predictable Data Flow**: Strive for pure transformations where possible and make side effects explicit.
3. **Simplicity over Cleverness**: Debugging is twice as hard as writing the code in the first place.
4. **Latency Numbers Every Programmer Should Know**:
   - L1 cache reference: 0.5 ns
   - Branch mispredict: 5 ns
   - L2 cache reference: 7 ns
   - Mutex lock/unlock: 25 ns
   - Main memory reference: 100 ns
   - Read 1 MB sequentially from SSD: ~16,000 ns`,
      tags: JSON.stringify(["architecture", "principles", "engineering"]),
      pinned: true,
      archived: false,
      entityType: "standalone",
      entityId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "note-os-x86-paging",
      title: "x86-64 4-Level Page Table Translation",
      content: `### Page Table Architecture
- Virtual address in x86-64 uses 48 bits:
  - bits 47:39 -> PML4 (Page Map Level 4) Index (9 bits, 512 entries)
  - bits 38:30 -> PDPT (Page Directory Pointer Table) Index (9 bits)
  - bits 29:21 -> PD (Page Directory) Index (9 bits)
  - bits 20:12 -> PT (Page Table) Index (9 bits)
  - bits 11:0 -> Physical page offset (12 bits = 4KB page size)

### CR3 Register
- Contains physical address of PML4 base.
- When CR3 is reloaded (context switch), entire TLB is flushed unless PCID (Process Context ID) bits are enabled.`,
      tags: JSON.stringify(["os", "systems", "virtual-memory", "x86"]),
      pinned: false,
      archived: false,
      entityType: "learning_topic",
      entityId: topic1Id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "note-bench-form",
      title: "Bench Press Setup & Bar Path Cues",
      content: `### Setup Checklist:
- Eyes directly beneath the racked bar.
- Retract and depress scapula hard into the bench pad.
- Set feet backwards and wedge heels into the floor.
- Unrack with locked lats (pull bar over shoulders, don't press up).
- Lower bar with controlled elbows at roughly 45-60 degree tuck.
- Touch lower sternum smoothly; explode off chest driving backwards toward uprights.`,
      tags: JSON.stringify(["fitness", "technique", "bench-press"]),
      pinned: false,
      archived: false,
      entityType: "exercise",
      entityId: ex1Id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  console.log("✅ Seed finished successfully!");
}

// Run directly if called as a script
if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
