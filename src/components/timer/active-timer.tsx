"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAppStore } from "@/store/useTimerStore";
import { Play, Square, Pause, FolderOpen, History } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ActiveTimer() {
  const { activeTimer, startTimer, stopTimer, updateTimer, pauseTimer, resumeTimer, projects, entries } = useAppStore();
  const [taskName, setTaskName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Suggestions logic
  const suggestions = useMemo(() => {
    if (!taskName.trim() || activeTimer) return [];
    
    // Get unique tasks from history with their project
    const uniqueTasks = new Map<string, string | null>();
    entries.forEach(e => {
      if (!uniqueTasks.has(e.taskName)) {
        uniqueTasks.set(e.taskName, e.projectId);
      }
    });

    return Array.from(uniqueTasks.entries())
      .filter(([name]) => name.toLowerCase().includes(taskName.toLowerCase()))
      .slice(0, 5);
  }, [entries, taskName, activeTimer]);

  // Sync with store on mount or when activeTimer changes
  useEffect(() => {
    if (activeTimer) {
      setTaskName(activeTimer.taskName);
      setProjectId(activeTimer.projectId);
    }
  }, [activeTimer]);

  useEffect(() => {
    if (activeTimer) {
      const update = () => {
        const endedAt = activeTimer.pausedAt || Date.now();
        setElapsed(Math.max(0, Math.floor((endedAt - activeTimer.startedAt) / 1000)));
      };

      // Update immediately but asynchronously to avoid cascading render warning
      const timeout = setTimeout(update, 0);
      
      let interval: NodeJS.Timeout | undefined;
      if (!activeTimer.pausedAt) {
        interval = setInterval(update, 1000);
      }

      return () => {
        clearTimeout(timeout);
        if (interval) clearInterval(interval);
      };
    } else {
      const timeout = setTimeout(() => setElapsed(0), 0);
      return () => clearTimeout(timeout);
    }
  }, [activeTimer]);

  const handleToggleTimer = useCallback(() => {
    if (activeTimer) {
      stopTimer();
      setTaskName("");
      setProjectId(null);
    } else {
      startTimer(taskName.trim() || "Sem título", projectId);
    }
  }, [activeTimer, stopTimer, startTimer, taskName, projectId]);

  const handleTaskNameChange = (val: string) => {
    setTaskName(val);
    if (activeTimer) {
      updateTimer(val, activeTimer.projectId);
    }
  };

  const handleProjectSelect = (id: string | null) => {
    setProjectId(id);
    if (activeTimer) {
      updateTimer(taskName, id);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");

    if (h > 0) {
      return { display: `${hh}:${mm}:${ss}`, isHour: true };
    }
    return { display: `${mm}:${ss}`, isHour: false };
  };

  const time = formatTime(elapsed);
  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Header section - Task Name is always at the top now */}
      <div className="w-full max-w-xl mb-12 flex flex-col items-center">
        {activeTimer ? (
          <>
            {/* AO VIVO badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-green-live/10 px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-live absolute inline-flex h-full w-full rounded-full bg-green-live opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-live"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-green-live uppercase">
                Ao vivo
              </span>
            </div>
            
            <div className="flex items-center w-full max-w-lg mb-3">
              <input
                type="text"
                placeholder="Nome da tarefa..."
                value={taskName}
                onChange={(e) => handleTaskNameChange(e.target.value)}
                className="flex-1 bg-transparent text-center text-3xl font-bold text-white placeholder:text-[#333333] border-none focus:outline-none focus:ring-0 ml-12"
              />
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div 
                    className="flex shrink-0 items-center justify-center h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] hover:bg-[#242424] transition-colors ml-2 cursor-pointer px-3 gap-2"
                    title={selectedProject ? selectedProject.name : "Vincular a um projeto"}
                  >
                    {selectedProject ? (
                      <>
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: selectedProject.color }}
                        />
                        <span className="text-xs font-medium text-white max-w-[100px] truncate">
                          {selectedProject.name}
                        </span>
                      </>
                    ) : (
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#1A1A1A] border-[#2A2A2A]">
                  <DropdownMenuItem onClick={() => handleProjectSelect(null)} className="focus:bg-[#242424] cursor-pointer">
                    Nenhum projeto
                  </DropdownMenuItem>
                  {projects.length > 0 && <DropdownMenuSeparator className="bg-[#2A2A2A]" />}
                  {projects.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => handleProjectSelect(p.id)}
                      className="flex items-center gap-2 focus:bg-[#242424] cursor-pointer"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center w-full max-w-lg mb-6 relative">
              <input
                type="text"
                placeholder="O que vamos focar agora?"
                value={taskName}
                onChange={(e) => {
                  handleTaskNameChange(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleToggleTimer();
                }}
                className="flex-1 bg-transparent text-center text-2xl font-bold text-white placeholder:text-[#333333] border-none focus:outline-none transition-colors ml-12"
              />

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-full max-w-md bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden z-50 shadow-2xl">
                  <div className="px-3 py-2 border-b border-[#2A2A2A] bg-[#242424]/50 flex items-center gap-2">
                    <History className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sugestões anteriores</span>
                  </div>
                  {suggestions.map(([name, pid]) => (
                    <button
                      key={name}
                      onClick={() => {
                        setTaskName(name);
                        setProjectId(pid);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-[#242424] transition-colors flex items-center justify-between group"
                    >
                      <span className="text-sm text-white group-hover:text-cyan-glow transition-colors">{name}</span>
                      {pid && (
                        <div className="flex items-center gap-1.5 bg-[#2A2A2A] px-2 py-0.5 rounded-full">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: projects.find(p => p.id === pid)?.color }} 
                          />
                          <span className="text-[10px] text-muted-foreground">{projects.find(p => p.id === pid)?.name}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div 
                    className="flex shrink-0 items-center justify-center h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] hover:bg-[#242424] transition-colors ml-2 cursor-pointer px-3 gap-2"
                    title={selectedProject ? selectedProject.name : "Vincular a um projeto"}
                  >
                    {selectedProject ? (
                      <>
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: selectedProject.color }}
                        />
                        <span className="text-xs font-medium text-white max-w-[100px] truncate">
                          {selectedProject.name}
                        </span>
                      </>
                    ) : (
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#1A1A1A] border-[#2A2A2A]">
                  <DropdownMenuItem onClick={() => handleProjectSelect(null)} className="focus:bg-[#242424] cursor-pointer">
                    Nenhum projeto
                  </DropdownMenuItem>
                  {projects.length > 0 && <DropdownMenuSeparator className="bg-[#2A2A2A]" />}
                  {projects.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => handleProjectSelect(p.id)}
                      className="flex items-center gap-2 focus:bg-[#242424] cursor-pointer"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>

      {/* Timer Ring */}
      <div className={`relative flex items-center justify-center w-[320px] h-[320px] ${activeTimer ? "animate-glow" : ""}`}>
        <svg
          className="absolute inset-0"
          width="320"
          height="320"
          viewBox="0 0 320 320"
        >
          <circle
            cx="160"
            cy="160"
            r="140"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="6"
          />
          {activeTimer && (
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              stroke="#00F5FF"
              strokeWidth="6"
              strokeLinecap="round"
              className="transition-all duration-100 ease-linear"
              style={{
                filter: "drop-shadow(0 0 8px rgba(0, 245, 255, 0.5))",
              }}
            />
          )}
        </svg>

        <div className="flex flex-col items-center z-10">
          <div className="flex items-baseline gap-2">
            <div className="flex items-baseline">
              <span className={`text-7xl font-bold tabular-nums tracking-tight ${activeTimer ? "text-white" : "text-[#555555]"}`}>
                {time.display}
              </span>
            </div>
            {!time.isHour && (
              <span className={`text-2xl font-bold ${activeTimer ? "text-cyan-glow" : "text-[#333333]"} self-end mb-2`}>
                min
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3 uppercase tracking-wider">
            {activeTimer ? (time.isHour ? "Horas de foco" : "Minutos de foco") : "Pronto para começar"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-12">
        {activeTimer ? (
          <>
            <button
              onClick={handleToggleTimer}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-white hover:bg-[#242424] transition-all duration-200 active:scale-95"
            >
              <Square className="h-6 w-6" fill="currentColor" />
            </button>
            {activeTimer.pausedAt ? (
              <button
                onClick={resumeTimer}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-accent text-white hover:bg-orange-accent/90 transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(255,107,0,0.3)]"
              >
                <Play className="h-7 w-7 ml-1" fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-glow text-[#0D0D0D] hover:bg-cyan-glow/90 transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(0,245,255,0.3)]"
              >
                <Pause className="h-6 w-6" fill="currentColor" />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleToggleTimer}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-accent text-white hover:bg-orange-accent/90 transition-all duration-200 active:scale-95 shadow-[0_0_30px_rgba(255,107,0,0.3)]"
          >
            <Play className="h-7 w-7 ml-1" fill="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
}
