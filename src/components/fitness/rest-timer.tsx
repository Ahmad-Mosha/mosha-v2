"use client";

import * as React from "react";
import { Clock, Play, Pause, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RestTimerProps {
  initialSeconds?: number;
  onClose?: () => void;
}

export function RestTimer({ initialSeconds = 90, onClose }: RestTimerProps) {
  const [targetSeconds, setTargetSeconds] = React.useState(initialSeconds);
  const [secondsLeft, setSecondsLeft] = React.useState(initialSeconds);
  const [isRunning, setIsRunning] = React.useState(true);

  React.useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            // Visual/audio notification
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const setPreset = (sec: number) => {
    setTargetSeconds(sec);
    setSecondsLeft(sec);
    setIsRunning(true);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  const progressPct = targetSeconds > 0 ? ((targetSeconds - secondsLeft) / targetSeconds) * 100 : 0;

  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg shadow-lg">
      <div className="flex items-center gap-2">
        <Clock className={`h-4 w-4 ${secondsLeft === 0 ? "text-emerald-400 animate-bounce" : "text-indigo-400"}`} />
        <span className={`font-mono text-sm font-bold ${secondsLeft === 0 ? "text-emerald-400" : "text-zinc-100"}`}>
          {timeStr}
        </span>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex items-center gap-1 text-[10px] font-mono">
        {[60, 90, 120, 180].map((s) => (
          <button
            key={s}
            onClick={() => setPreset(s)}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              targetSeconds === s && secondsLeft > 0
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {s}s
          </button>
        ))}
      </div>

      {/* Play/Pause & Reset */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
        >
          {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
        <button
          onClick={() => {
            setSecondsLeft(targetSeconds);
            setIsRunning(true);
          }}
          className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer ml-1"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
