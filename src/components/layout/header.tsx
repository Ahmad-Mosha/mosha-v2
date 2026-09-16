"use client";

import { usePathname } from "next/navigation";
import { Search, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Today", subtitle: "Daily focus & active command center" },
  "/projects": { title: "Projects & Sprints", subtitle: "Active software engineering workflows" },
  "/learning": { title: "Technical Learning", subtitle: "Deep computer science mastery & checkpoints" },
  "/problems": { title: "Problem Solving", subtitle: "Algorithmic practice & spaced revision" },
  "/fitness": { title: "Fitness & Training", subtitle: "Tactile workout logging & progressive overload" },
  "/money": { title: "Personal Money", subtitle: "Financial awareness, cashflow & wishlist" },
  "/goals": { title: "Major Goals", subtitle: "Long-term North Stars & reflections" },
  "/notes": { title: "Notes Hub", subtitle: "Universal thoughts, specs & technical references" },
  "/settings": { title: "Data Ownership & Backup", subtitle: "Full JSON export and database management" },
};

interface HeaderProps {
  onOpenCommand: () => void;
  onOpenQuickCapture: () => void;
}

export function Header({ onOpenCommand, onOpenQuickCapture }: HeaderProps) {
  const pathname = usePathname();
  const currentRoute = ROUTE_TITLES[pathname] || {
    title: pathname.split("/")[1] ? pathname.split("/")[1].charAt(0).toUpperCase() + pathname.split("/")[1].slice(1) : "MOSHA",
    subtitle: "Personal Operating System",
  };

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="h-14 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title / Context */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
          {currentRoute.title}
        </h1>
        <span className="hidden md:inline-block text-xs text-zinc-500 font-normal">
          {currentRoute.subtitle}
        </span>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3">
        {/* Date Context */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 font-mono bg-zinc-900/50 border border-zinc-800/60 px-2.5 py-1 rounded-md">
          <Calendar className="h-3 w-3 text-zinc-500" />
          <span>{todayStr}</span>
        </div>

        {/* Search / Command Trigger */}
        <button
          onClick={onOpenCommand}
          className="flex items-center gap-2 h-8 px-3 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shadow-xs"
        >
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Search or command...</span>
          <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-300">
            ⌘K
          </kbd>
        </button>

        {/* Quick Capture Button */}
        <Button
          onClick={onOpenQuickCapture}
          size="sm"
          className="h-8 gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium text-xs shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Capture</span>
          <kbd className="hidden md:inline ml-1 px-1 py-0.2 rounded bg-zinc-200/80 border border-zinc-300 font-mono text-[9px] text-zinc-700">
            ⌘J
          </kbd>
        </Button>
      </div>
    </header>
  );
}
