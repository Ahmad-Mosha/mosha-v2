"use client";

import * as React from "react";
import {
  HardDriveDownload,
  Database,
  FileJson,
  FileText,
  CheckCircle2,
  Cloud,
  ShieldCheck,
  Server,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportAllDataAction } from "@/lib/actions/export";

interface SettingsClientProps {
  initialCounts: {
    goals: number;
    projects: number;
    tasks: number;
    learningTopics: number;
    studySessions: number;
    problems: number;
    exercises: number;
    workoutSessions: number;
    transactions: number;
    notes: number;
  };
}

export function SettingsClient({ initialCounts }: SettingsClientProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportSuccess, setExportSuccess] = React.useState(false);

  const handleDownloadJSON = async () => {
    setIsExporting(true);
    try {
      const payload = await exportAllDataAction();
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mosha-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadMarkdownNotes = async () => {
    setIsExporting(true);
    try {
      const payload = await exportAllDataAction();
      const notesList = payload.data.notes;

      let mdContent = `# MOSHA V2 — Universal Notes Backup\nExported: ${new Date().toISOString()}\nTotal Notes: ${notesList.length}\n\n---\n\n`;

      notesList.forEach((n) => {
        mdContent += `## ${n.title}\n`;
        mdContent += `*Domain: ${n.entityType} | Created: ${n.createdAt} | Updated: ${n.updatedAt}*\n`;
        mdContent += `*Tags: ${n.tags}*\n\n`;
        mdContent += `${n.content}\n\n---\n\n`;
      });

      const blob = new Blob([mdContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mosha-notes-${new Date().toISOString().split("T")[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800/60">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">
          Data Ownership & System Architecture
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Full data sovereignty. Never trapped in an opaque database. Zero-vendor lock-in.
        </p>
      </div>

      {/* Database Integrity & Statistics */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
              Database Records Snapshot
            </h2>
          </div>
          <Badge variant="success" className="text-[10px] font-mono">
            SQLite Active &bull; mosha.db
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Engineering Projects", count: initialCounts.projects },
            { label: "Sprint Tasks", count: initialCounts.tasks },
            { label: "Universal Notes", count: initialCounts.notes },
            { label: "Learning Topics", count: initialCounts.learningTopics },
            { label: "Study Sessions", count: initialCounts.studySessions },
            { label: "DSA Problems", count: initialCounts.problems },
            { label: "Workout Sessions", count: initialCounts.workoutSessions },
            { label: "Exercises in Library", count: initialCounts.exercises },
            { label: "Transactions", count: initialCounts.transactions },
            { label: "Major Goals", count: initialCounts.goals },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-md bg-zinc-900/60 border border-zinc-800/70"
            >
              <div className="text-[10px] text-zinc-500 truncate">
                {item.label}
              </div>
              <div className="text-lg font-bold font-mono text-zinc-100 mt-0.5">
                {item.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Actions */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <HardDriveDownload className="h-4 w-4 text-indigo-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
            Data Export & Backup
          </h2>
        </div>
        <p className="text-xs text-zinc-400">
          Generate complete, uncompressed, structured exports of your entire personal operating system at any time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* JSON Export */}
          <div className="p-4 rounded-md bg-zinc-900/50 border border-zinc-800/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold text-zinc-200">
                  Full Database JSON Backup
                </h3>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Complete relational JSON export containing all goals, tasks, learning logs, problems, workout sets, cashflow, and notes.
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleDownloadJSON}
              disabled={isExporting}
              className="w-full text-xs gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download JSON Backup</span>
            </Button>
          </div>

          {/* Markdown Notes Archive */}
          <div className="p-4 rounded-md bg-zinc-900/50 border border-zinc-800/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-zinc-200">
                  Markdown Notes Archive
                </h3>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Formatted markdown document with frontmatter metadata for all standalone and entity-attached notes.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadMarkdownNotes}
              disabled={isExporting}
              className="w-full text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Notes (.md)</span>
            </Button>
          </div>
        </div>

        {exportSuccess && (
          <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in-50">
            <CheckCircle2 className="h-4 w-4" />
            <span>Export generated and download initiated successfully.</span>
          </div>
        )}
      </div>

      {/* Turso Cloud Migration Path */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-sky-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
            Turso Zero-Code-Change Migration Ready
          </h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          MOSHA V2 is constructed on top of <strong>Drizzle ORM</strong> with <strong>@libsql/client</strong>. Because LibSQL is the underlying engine of Turso, you can migrate to Turso Cloud without rewriting a single query or schema file:
        </p>

        <div className="p-3 rounded-md bg-zinc-900/70 border border-zinc-800 font-mono text-xs text-zinc-300 space-y-2">
          <div className="text-zinc-500 text-[10px] uppercase">
            Steps to deploy to Turso:
          </div>
          <div>1. <code className="text-amber-300">turso db create mosha-v2</code></div>
          <div>2. Set environment variables in <code className="text-indigo-300">.env.local</code>:</div>
          <div className="pl-4 text-zinc-400 text-[11px]">
            DATABASE_URL="libsql://mosha-v2-[org].turso.io"<br />
            DATABASE_AUTH_TOKEN="your-turso-auth-token"
          </div>
          <div>3. Run <code className="text-emerald-300">pnpm db:push</code></div>
        </div>
      </div>
    </div>
  );
}
