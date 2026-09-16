"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  FolderKanban,
  BookOpen,
  Code2,
  Dumbbell,
  Wallet,
  Target,
  FileText,
  HardDriveDownload,
  Plus,
  Play,
  DollarSign,
  CheckSquare,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";

interface GlobalCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenQuickCapture: (tab?: "task" | "note" | "expense" | "checkpoint") => void;
}

export function GlobalCommand({
  open,
  onOpenChange,
  onOpenQuickCapture,
}: GlobalCommandProps) {
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search MOSHA..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => onOpenQuickCapture("task"))
            }
          >
            <CheckSquare className="h-4 w-4 text-amber-400" />
            <span>Create New Task</span>
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => onOpenQuickCapture("note"))
            }
          >
            <FileText className="h-4 w-4 text-indigo-400" />
            <span>Capture Note / Idea</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => onOpenQuickCapture("expense"))
            }
          >
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span>Log Expense or Income</span>
            <CommandShortcut>E</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/fitness?action=new-session"))
            }
          >
            <Play className="h-4 w-4 text-rose-400" />
            <span>Start Workout Session</span>
            <CommandShortcut>W</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation Jumps */}
        <CommandGroup heading="Navigate Domains">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/"))}
          >
            <Compass className="h-4 w-4 text-zinc-400" />
            <span>Go to Today / Home</span>
            <CommandShortcut>G H</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/projects"))}
          >
            <FolderKanban className="h-4 w-4 text-zinc-400" />
            <span>Projects & Sprint Board</span>
            <CommandShortcut>G P</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/learning"))}
          >
            <BookOpen className="h-4 w-4 text-zinc-400" />
            <span>Technical Learning & Checkpoints</span>
            <CommandShortcut>G L</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/problems"))}
          >
            <Code2 className="h-4 w-4 text-zinc-400" />
            <span>Problem Solving & Revisions</span>
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/fitness"))}
          >
            <Dumbbell className="h-4 w-4 text-zinc-400" />
            <span>Fitness & Workouts</span>
            <CommandShortcut>G F</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/money"))}
          >
            <Wallet className="h-4 w-4 text-zinc-400" />
            <span>Money & Cashflow</span>
            <CommandShortcut>G M</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/goals"))}
          >
            <Target className="h-4 w-4 text-zinc-400" />
            <span>Major Life Goals</span>
            <CommandShortcut>G G</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/notes"))}
          >
            <FileText className="h-4 w-4 text-zinc-400" />
            <span>Universal Notes Hub</span>
            <CommandShortcut>G N</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/settings"))}
          >
            <HardDriveDownload className="h-4 w-4 text-zinc-400" />
            <span>Settings & Data Export</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
