"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Today", icon: Compass, shortcut: "G H" },
  { href: "/projects", label: "Projects & Sprints", icon: FolderKanban, shortcut: "G P" },
  { href: "/learning", label: "Learning", icon: BookOpen, shortcut: "G L" },
  { href: "/problems", label: "Problem Solving", icon: Code2, shortcut: "G D" },
  { href: "/fitness", label: "Fitness", icon: Dumbbell, shortcut: "G F" },
  { href: "/money", label: "Money", icon: Wallet, shortcut: "G M" },
  { href: "/goals", label: "Major Goals", icon: Target, shortcut: "G G" },
  { href: "/notes", label: "Notes", icon: FileText, shortcut: "G N" },
];

interface SidebarProps {
  onOpenQuickCapture?: () => void;
}

export function Sidebar({ onOpenQuickCapture }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-zinc-800/70 bg-zinc-950/90 flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/60">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-6 w-6 rounded bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs tracking-wider text-zinc-200">
                MOSHA
              </span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-tight -mt-0.5">
                PERSONAL OS
              </span>
            </div>
          </Link>

          <button
            onClick={onOpenQuickCapture}
            title="Quick Capture (⌘J)"
            className="h-7 w-7 rounded-md border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-0.5">
          <div className="px-2 py-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase font-mono">
            Domains
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors group",
                  isActive
                    ? "text-zinc-100 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-md bg-zinc-800/70 border border-zinc-700/40 -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      isActive
                        ? "text-zinc-100"
                        : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                <span
                  className={cn(
                    "text-[9px] font-mono tracking-tighter opacity-0 group-hover:opacity-60 transition-opacity",
                    isActive ? "text-zinc-400 opacity-60" : "text-zinc-600"
                  )}
                >
                  {item.shortcut}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / System Control */}
      <div className="p-2 border-t border-zinc-800/60 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50",
            pathname === "/settings" && "text-zinc-100 bg-zinc-800/70"
          )}
        >
          <div className="flex items-center gap-2.5">
            <HardDriveDownload className="h-3.5 w-3.5 text-zinc-500" />
            <span>Data & Backup</span>
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" title="Local SQLite Active" />
        </Link>

        {/* Global Keyboard Shortcut Pill */}
        <div className="px-2.5 py-2 mt-1 rounded bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-zinc-500" />
            <span>Spotlight</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 font-mono text-[10px] text-zinc-300 shadow-xs">
            ⌘K
          </kbd>
        </div>
      </div>
    </aside>
  );
}
