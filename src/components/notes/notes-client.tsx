"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Pin,
  Trash2,
  Tag,
  FolderKanban,
  BookOpen,
  Code2,
  Dumbbell,
  Target,
  FileText,
  Check,
  Split,
  Eye,
  Edit3,
  Archive,
} from "lucide-react";
import { Note } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MarkdownPreview } from "@/components/editor/markdown-preview";
import {
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
} from "@/lib/actions/notes";
import { formatDate } from "@/lib/utils";

interface NotesClientProps {
  initialNotes: Note[];
  projectsList: { id: string; title: string }[];
  topicsList: { id: string; title: string }[];
  problemsList: { id: string; title: string }[];
}

export function NotesClient({
  initialNotes,
  projectsList,
  topicsList,
  problemsList,
}: NotesClientProps) {
  const [notesList, setNotesList] = React.useState<Note[]>(initialNotes);
  const [activeNoteId, setActiveNoteId] = React.useState<string>(
    initialNotes[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [entityFilter, setEntityFilter] = React.useState<string>("all");
  const [editorMode, setEditorMode] = React.useState<"edit" | "preview" | "split">("split");

  // Active note state
  const activeNote = notesList.find((n) => n.id === activeNoteId) || notesList[0];
  const [title, setTitle] = React.useState(activeNote?.title || "");
  const [content, setContent] = React.useState(activeNote?.content || "");
  const [tags, setTags] = React.useState<string[]>(() => {
    try {
      return activeNote?.tags ? JSON.parse(activeNote.tags) : [];
    } catch {
      return [];
    }
  });
  const [tagInput, setTagInput] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "unsaved">("saved");

  // Keep active note fields in sync when selection changes
  React.useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      try {
        setTags(JSON.parse(activeNote.tags || "[]"));
      } catch {
        setTags([]);
      }
      setSaveStatus("saved");
    }
  }, [activeNoteId]);

  // All distinct tags across notes
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    notesList.forEach((n) => {
      try {
        const parsed = JSON.parse(n.tags || "[]") as string[];
        parsed.forEach((t) => tagSet.add(t));
      } catch {}
    });
    return Array.from(tagSet);
  }, [notesList]);

  // Filter notes
  const filteredNotes = React.useMemo(() => {
    return notesList.filter((note) => {
      // Entity filter
      if (entityFilter !== "all" && note.entityType !== entityFilter) {
        return false;
      }
      // Tag filter
      if (selectedTag) {
        try {
          const parsed = JSON.parse(note.tags || "[]") as string[];
          if (!parsed.includes(selectedTag)) return false;
        } catch {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = note.title.toLowerCase().includes(q);
        const matchContent = note.content.toLowerCase().includes(q);
        return matchTitle || matchContent;
      }
      return true;
    });
  }, [notesList, entityFilter, selectedTag, searchQuery]);

  // Debounced auto-save or manual save
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setSaveStatus("unsaved");
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSaveStatus("unsaved");
  };

  const saveCurrentNote = async () => {
    if (!activeNote) return;
    setIsSaving(true);
    await updateNoteAction(activeNote.id, {
      title,
      content,
      tags,
    });
    // Update local state
    setNotesList((prev) =>
      prev.map((n) =>
        n.id === activeNote.id
          ? {
              ...n,
              title,
              content,
              tags: JSON.stringify(tags),
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
    setIsSaving(false);
    setSaveStatus("saved");
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase();
      if (!tags.includes(clean)) {
        const nextTags = [...tags, clean];
        setTags(nextTags);
        if (activeNote) {
          updateNoteAction(activeNote.id, { tags: nextTags });
          setNotesList((prev) =>
            prev.map((n) =>
              n.id === activeNote.id
                ? { ...n, tags: JSON.stringify(nextTags) }
                : n
            )
          );
        }
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    if (activeNote) {
      updateNoteAction(activeNote.id, { tags: nextTags });
      setNotesList((prev) =>
        prev.map((n) =>
          n.id === activeNote.id
            ? { ...n, tags: JSON.stringify(nextTags) }
            : n
        )
      );
    }
  };

  const handleTogglePin = async () => {
    if (!activeNote) return;
    const nextPinned = !activeNote.pinned;
    await updateNoteAction(activeNote.id, { pinned: nextPinned });
    setNotesList((prev) =>
      prev
        .map((n) => (n.id === activeNote.id ? { ...n, pinned: nextPinned } : n))
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    );
  };

  const handleCreateNewNote = async () => {
    const res = await createNoteAction({
      title: "Untitled Note",
      content: "",
      tags: selectedTag ? [selectedTag] : [],
      entityType: entityFilter === "all" ? "standalone" : entityFilter,
    });
    if (res.id) {
      const newNoteItem: Note = {
        id: res.id,
        title: "Untitled Note",
        content: "",
        tags: JSON.stringify(selectedTag ? [selectedTag] : []),
        pinned: false,
        archived: false,
        entityType: entityFilter === "all" ? "standalone" : entityFilter,
        entityId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotesList([newNoteItem, ...notesList]);
      setActiveNoteId(res.id);
    }
  };

  const handleDeleteActiveNote = async () => {
    if (!activeNote) return;
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNoteAction(activeNote.id);
      const remaining = notesList.filter((n) => n.id !== activeNote.id);
      setNotesList(remaining);
      setActiveNoteId(remaining[0]?.id || "");
    }
  };

  const handleEntityChange = async (entityType: string, entityId: string | null) => {
    if (!activeNote) return;
    await updateNoteAction(activeNote.id, { entityType, entityId });
    setNotesList((prev) =>
      prev.map((n) =>
        n.id === activeNote.id ? { ...n, entityType, entityId } : n
      )
    );
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-lg border border-zinc-800/80 bg-zinc-950 overflow-hidden">
      {/* Left Column: Note Browser */}
      <div className="w-80 shrink-0 border-r border-zinc-800/80 flex flex-col bg-zinc-950/60">
        {/* Top bar: search & new */}
        <div className="p-3 border-b border-zinc-800/70 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-zinc-900/60"
              />
            </div>
            <Button
              size="sm"
              onClick={handleCreateNewNote}
              className="h-8 px-2.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
              title="Create note"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Domain entity filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] text-zinc-400 scrollbar-none">
            {[
              { id: "all", label: "All" },
              { id: "standalone", label: "General" },
              { id: "learning_topic", label: "Learning" },
              { id: "project", label: "Projects" },
              { id: "problem", label: "DSA" },
              { id: "exercise", label: "Fitness" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEntityFilter(tab.id)}
                className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  entityFilter === tab.id
                    ? "bg-zinc-800 text-zinc-100 font-medium"
                    : "hover:bg-zinc-900 text-zinc-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tag filters (if any) */}
        {allTags.length > 0 && (
          <div className="px-3 py-2 border-b border-zinc-800/60 flex items-center gap-1.5 flex-wrap">
            <Tag className="h-3 w-3 text-zinc-500" />
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer mr-1"
              >
                Clear
              </button>
            )}
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No notes found.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = note.id === activeNoteId;
              let noteTagsList: string[] = [];
              try {
                noteTagsList = JSON.parse(note.tags || "[]");
              } catch {}

              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`p-2.5 rounded-md cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-zinc-900 border-zinc-700/80 shadow-xs"
                      : "border-transparent hover:bg-zinc-900/50 hover:border-zinc-800/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-zinc-200 truncate">
                      {note.title || "Untitled Note"}
                    </h4>
                    {note.pinned && (
                      <Pin className="h-3 w-3 text-amber-400 shrink-0 fill-amber-400/20" />
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                    {note.content || "Empty note"}
                  </p>

                  <div className="flex items-center justify-between gap-1 mt-2 text-[10px] text-zinc-500 font-mono">
                    <span className="capitalize">{note.entityType}</span>
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Note Editor & Preview */}
      {activeNote ? (
        <div className="flex-1 flex flex-col bg-zinc-950">
          {/* Editor Header / Controls */}
          <div className="h-12 border-b border-zinc-800/80 px-4 flex items-center justify-between">
            {/* View Mode Switches */}
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-zinc-400">
              <button
                onClick={() => setEditorMode("edit")}
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                  editorMode === "edit" ? "bg-zinc-800 text-zinc-100" : "hover:text-zinc-200"
                }`}
                title="Edit Only"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setEditorMode("split")}
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                  editorMode === "split" ? "bg-zinc-800 text-zinc-100" : "hover:text-zinc-200"
                }`}
                title="Split View"
              >
                <Split className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setEditorMode("preview")}
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                  editorMode === "preview" ? "bg-zinc-800 text-zinc-100" : "hover:text-zinc-200"
                }`}
                title="Preview Only"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Note Metadata & Actions */}
            <div className="flex items-center gap-3">
              {/* Linked Entity Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500 font-mono">Domain:</span>
                <select
                  value={activeNote.entityType}
                  onChange={(e) => handleEntityChange(e.target.value, null)}
                  className="h-7 text-xs bg-zinc-900 border border-zinc-800 rounded px-2 text-zinc-300 outline-none"
                >
                  <option value="standalone">General / Standalone</option>
                  <option value="learning_topic">Learning Topic</option>
                  <option value="project">Project</option>
                  <option value="problem">DSA Problem</option>
                  <option value="exercise">Fitness / Exercise</option>
                  <option value="goal">Major Goal</option>
                </select>

                {/* Sub-entity picker if entityType is learning_topic or project */}
                {activeNote.entityType === "project" && (
                  <select
                    value={activeNote.entityId || ""}
                    onChange={(e) => handleEntityChange("project", e.target.value || null)}
                    className="h-7 text-xs bg-zinc-900 border border-zinc-800 rounded px-2 text-zinc-300 outline-none max-w-[140px] truncate"
                  >
                    <option value="">Select Project...</option>
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                )}

                {activeNote.entityType === "learning_topic" && (
                  <select
                    value={activeNote.entityId || ""}
                    onChange={(e) => handleEntityChange("learning_topic", e.target.value || null)}
                    className="h-7 text-xs bg-zinc-900 border border-zinc-800 rounded px-2 text-zinc-300 outline-none max-w-[140px] truncate"
                  >
                    <option value="">Select Topic...</option>
                    {topicsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Pin Toggle */}
              <button
                onClick={handleTogglePin}
                className={`p-1.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer ${
                  activeNote.pinned ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title={activeNote.pinned ? "Unpin Note" : "Pin Note"}
              >
                <Pin className={`h-4 w-4 ${activeNote.pinned ? "fill-amber-400/20" : ""}`} />
              </button>

              {/* Save Status / Button */}
              <Button
                size="sm"
                variant={saveStatus === "unsaved" ? "default" : "outline"}
                onClick={saveCurrentNote}
                disabled={isSaving}
                className="h-7 text-xs px-2.5"
              >
                {isSaving ? "Saving..." : saveStatus === "unsaved" ? "Save Note" : "Saved"}
              </Button>

              {/* Delete */}
              <button
                onClick={handleDeleteActiveNote}
                className="p-1.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Delete Note"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Note Title & Tags Bar */}
          <div className="p-4 pb-2 border-b border-zinc-800/60 space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Note Title..."
              className="w-full bg-transparent text-lg font-bold text-zinc-100 placeholder:text-zinc-600 outline-none tracking-tight"
            />

            {/* Tags line */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="text-[10px] gap-1 bg-zinc-900 border border-zinc-800 text-zinc-300"
                >
                  #{t}
                  <button
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-400 cursor-pointer ml-0.5"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="+ tag..."
                className="h-5 text-[11px] bg-transparent text-zinc-400 placeholder:text-zinc-600 outline-none w-20"
              />
            </div>
          </div>

          {/* Main Editing / Preview Canvas */}
          <div className="flex-1 overflow-hidden flex">
            {/* Editor Pane */}
            {(editorMode === "edit" || editorMode === "split") && (
              <div
                className={`flex-1 flex flex-col p-4 overflow-y-auto ${
                  editorMode === "split" ? "border-r border-zinc-800/60" : ""
                }`}
              >
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      saveCurrentNote();
                    }
                  }}
                  placeholder="Type markdown content here... (Cmd+S to save)
# Heading 1
## Heading 2
- [ ] Task
```ts
const code = 'hello';
```"
                  className="w-full h-full bg-transparent resize-none outline-none font-mono text-xs text-zinc-200 placeholder:text-zinc-600 leading-relaxed"
                />
              </div>
            )}

            {/* Preview Pane */}
            {(editorMode === "preview" || editorMode === "split") && (
              <div className="flex-1 p-5 overflow-y-auto bg-zinc-950/40">
                <MarkdownPreview content={content} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
          <FileText className="h-10 w-10 text-zinc-700 mb-3" />
          <p className="text-sm font-medium text-zinc-400">No note selected</p>
          <p className="text-xs text-zinc-600 mt-1">
            Choose a note from the left sidebar or create a new one.
          </p>
          <Button
            size="sm"
            onClick={handleCreateNewNote}
            className="mt-4 text-xs bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Note
          </Button>
        </div>
      )}
    </div>
  );
}
