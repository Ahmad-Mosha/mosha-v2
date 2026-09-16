"use client";

import React from "react";
import { CheckSquare, Square, Copy, Check } from "lucide-react";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = "" }: MarkdownPreviewProps) {
  const [copiedCodeIndex, setCopiedCodeIndex] = React.useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  if (!content.trim()) {
    return (
      <div className="py-8 text-center text-xs text-zinc-600 italic">
        No content yet. Start writing...
      </div>
    );
  }

  // Simple, robust parser for markdown blocks
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockLines: string[] = [];
  let codeBlockCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block open/close
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // Close code block
        const codeText = codeBlockLines.join("\n");
        const currentIndex = codeBlockCount++;
        elements.push(
          <div
            key={`code-${i}`}
            className="my-3 rounded-md border border-zinc-800 bg-zinc-950/90 overflow-hidden text-xs font-mono"
          >
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/80 bg-zinc-900/60 text-[10px] text-zinc-400">
              <span>{codeBlockLang || "code"}</span>
              <button
                type="button"
                onClick={() => copyCode(codeText, currentIndex)}
                className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
              >
                {copiedCodeIndex === currentIndex ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-zinc-200 text-xs leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLang = "";
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-zinc-200 mt-4 mb-1.5">
          {line.slice(4)}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-semibold text-zinc-100 mt-5 mb-2 pb-1 border-b border-zinc-800/60">
          {line.slice(3)}
        </h2>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-lg font-bold text-zinc-100 mt-6 mb-2">
          {line.slice(2)}
        </h1>
      );
      continue;
    }

    // Checkbox lists
    if (line.trim().startsWith("- [ ] ")) {
      elements.push(
        <div key={i} className="flex items-center gap-2 my-1 text-xs text-zinc-300">
          <Square className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          <span>{line.trim().slice(6)}</span>
        </div>
      );
      continue;
    }
    if (line.trim().startsWith("- [x] ") || line.trim().startsWith("- [X] ")) {
      elements.push(
        <div key={i} className="flex items-center gap-2 my-1 text-xs text-zinc-400 line-through">
          <CheckSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>{line.trim().slice(6)}</span>
        </div>
      );
      continue;
    }

    // Bullet lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-xs text-zinc-300 my-0.5">
          {renderFormattedText(line.trim().slice(2))}
        </li>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="border-l-2 border-indigo-500/60 pl-3 py-1 my-2 text-xs italic text-zinc-400 bg-zinc-900/30 rounded-r"
        >
          {line.slice(2)}
        </blockquote>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-xs text-zinc-300 leading-relaxed my-1">
        {renderFormattedText(line)}
      </p>
    );
  }

  return <div className={`space-y-0.5 text-zinc-300 ${className}`}>{elements}</div>;
}

// Helper to render bold (**text**), italics (*text*), and inline code (`code`)
function renderFormattedText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-zinc-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-zinc-300">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-zinc-900 border border-zinc-800 px-1 py-0.5 text-[11px] font-mono text-zinc-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}
