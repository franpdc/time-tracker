"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useTimerStore";

export function TitleManager() {
  const { activeTimer } = useAppStore();

  useEffect(() => {
    if (!activeTimer) {
      document.title = "moment";
      return;
    }

    if (activeTimer.pausedAt) {
      const pausedElapsed = Math.floor((activeTimer.pausedAt - activeTimer.startedAt) / 1000);
      document.title = `(Pausado) ${formatTitleTime(pausedElapsed)} - ${activeTimer.taskName || "Sem título"}`;
      return;
    }

    // Initial calculation
    const getSeconds = () => Math.floor((Date.now() - activeTimer.startedAt) / 1000);
    document.title = `${formatTitleTime(getSeconds())} - ${activeTimer.taskName || "Sem título"}`;

    // Update every second
    const interval = setInterval(() => {
      document.title = `${formatTitleTime(getSeconds())} - ${activeTimer.taskName || "Sem título"}`;
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
