"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useTimerStore";

export function TitleManager() {
  const { activeTimer } = useAppStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeTimer) {
      document.title = "FocusTrack";
      return;
    }

    if (activeTimer.pausedAt) {
      const pausedElapsed = Math.floor((activeTimer.pausedAt - activeTimer.startedAt) / 1000);
      document.title = `(Pausado) ${formatTitleTime(pausedElapsed)} - ${activeTimer.taskName || "Sem título"}`;
      return;
    }

    // Initial calculation
    const calcElapsed = () => Math.floor((Date.now() - activeTimer.startedAt) / 1000);
    setElapsed(calcElapsed());

    // Update every second
    const interval = setInterval(() => {
      const seconds = calcElapsed();
      setElapsed(seconds);
      document.title = `${formatTitleTime(seconds)} - ${activeTimer.taskName || "Sem título"}`;
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  return null; // This component does not render anything visually
}

function formatTitleTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  const pad = (num: number) => num.toString().padStart(2, "0");
  
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}
