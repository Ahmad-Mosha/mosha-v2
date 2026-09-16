"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { GlobalCommand } from "@/components/command/global-command";
import { QuickCaptureModal } from "@/components/command/quick-capture-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [captureOpen, setCaptureOpen] = React.useState(false);
  const [captureTab, setCaptureTab] = React.useState<"task" | "note" | "expense" | "checkpoint">("task");

  const openQuickCapture = (tab: "task" | "note" | "expense" | "checkpoint" = "task") => {
    setCaptureTab(tab);
    setCaptureOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex antialiased selection:bg-zinc-800 selection:text-zinc-100">
      {/* Sidebar navigation */}
      <Sidebar onOpenQuickCapture={() => openQuickCapture("task")} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenCommand={() => setCommandOpen(true)}
          onOpenQuickCapture={() => openQuickCapture("task")}
        />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Command & Quick Capture */}
      <GlobalCommand
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onOpenQuickCapture={openQuickCapture}
      />
      <QuickCaptureModal
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        defaultTab={captureTab}
      />
    </div>
  );
}
