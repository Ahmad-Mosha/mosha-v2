"use client";

import * as React from "react";
import { Plus, FileText, ChevronDown, ChevronUp, Trash2, Edit3, Check } from "lucide-react";
import { Note } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownPreview } from "@/components/editor/markdown-preview";
import { createNoteAction, deleteNoteAction, updateNoteAction } from "@/lib/actions/notes";
import { formatDate } from "@/lib/utils";

interface EntityNotesProps {
  entityType: string;
  entityId: string;
  entityTitle?: string;
  initialNotes?: Note[];
}

export function EntityNotes({
  entityType,
  entityId,
  entityTitle,
  initialNotes = [],
}: EntityNotesProps) {
  const [notesList, setNotesList] = React.useState<Note[]>(initialNotes);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newContent, setNewContent] = React.useState("");
  const [expandedNoteId, setExpandedNoteId] = React.useState<string | null>(
    initialNotes[0]?.id || null
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await createNoteAction({
      title: newTitle.trim(),
      content: newContent.trim(),
      entityType,
      entityId,
      tags: [entityType],
    });

    if (res.id) {
      const created: Note = {
        id: res.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: JSON.stringify([entityType]),
        pinned: false,
        archived: false,
        entityType,
        entityId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotesList([created, ...notesList]);
      setExpandedNoteId(created.id);
      setNewTitle("");
      setNewContent("");
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this note?")) {
      await deleteNoteAction(id);
      setNotesList((prev) => prev.filter((n) => n.id !== id));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
            Linked Notes & Specs {notesList.length > 0 && `(${notesList.length})`}
          </h3>
        </div>
        {!isCreating && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCreating(true)}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Note
          </Button>
        )}
      </div>

      {/* Creation form */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="p-3.5 rounded-md border border-zinc-800 bg-zinc-950 space-y-2.5 animate-in fade-in-50"
        >
          <Input
            placeholder="Note title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            required
            className="text-xs bg-zinc-900/80"
          />
          <Textarea
            placeholder="Markdown content, insights, design notes..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            className="text-xs bg-zinc-900/80 font-mono"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!newTitle.trim()}>
              Save Note
            </Button>
          </div>
        </form>
      )}

      {/* List of notes */}
      {notesList.length === 0 && !isCreating ? (
        <div className="py-6 text-center text-xs text-zinc-600 italic border border-dashed border-zinc-800/80 rounded-md">
          No notes attached to this {entityType.replace("_", " ")}. Click "Add Note" to write one.
        </div>
      ) : (
        <div className="space-y-2">
          {notesList.map((n) => {
            const isExpanded = expandedNoteId === n.id;
            return (
              <div
                key={n.id}
                className="rounded-md border border-zinc-800/80 bg-zinc-950/70 overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedNoteId(isExpanded ? null : n.id)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-200">
                      {n.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                    <span>{formatDate(n.updatedAt)}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-zinc-800/60 bg-zinc-950/40 space-y-3">
                    <MarkdownPreview content={n.content} />
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="text-[10px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete Note</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
