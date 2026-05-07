"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAppStore } from "@/store/useTimerStore";
import { Play, Square, Pause, FolderOpen, History, Target } from "lucide-react";
import { format, isSameDay, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AddManualEntryModal } from "@/components/timer/add-manual-entry-modal";
import { DailyLogPopover } from "@/components/timer/daily-log-popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const {
    activeTimer, startTimer, stopTimer, updateTimer, pauseTimer, resumeTimer,
    projects, entries, dailyGoalMinutes, setDailyGoal,
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Sync with active timer
  useEffect(() => {
    if (activeTimer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTaskName(activeTimer.taskName);
       
      setProjectId(activeTimer.projectId);
    }
  }, [activeTimer]);

  // Elapsed timer
  useEffect(() => {
    if (activeTimer) {
      const update = () => {
        const endedAt = activeTimer.pausedAt || Date.now();
        setElapsed(Math.max(0, Math.floor((endedAt - activeTimer.startedAt) / 1000)));
      };
      const timeout = setTimeout(update, 0);
      let interval: NodeJS.Timeout | undefined;
      if (!activeTimer.pausedAt) {
        interval = setInterval(update, 1000);
      }
      return () => { clearTimeout(timeout); if (interval) clearInterval(interval); };
    } else {
      const timeout = setTimeout(() => setElapsed(0), 0);
      return () => clearTimeout(timeout);
    }
  }, [activeTimer]);

  const handleStart = useCallback(() => {
    startTimer(taskName.trim() || "Sem título", projectId);
  }, [startTimer, taskName, projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (activeTimer) {
          if (activeTimer.pausedAt) resumeTimer();
          else pauseTimer();
        } else {
          handleStart();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTimer, handleStart, pauseTimer, resumeTimer]);

  const handleStop = useCallback(() => {
    const entry = stopTimer();
    if (entry) {
      toast.success(`Sessão de ${formatDuration(entry.duration)} gravada`, {
        description: entry.taskName,
      });
    }
    setTaskName("");
    setProjectId(null);
  }, [stopTimer]);

  const handleTaskNameChange = (val: string) => {
    setTaskName(val);
    if (activeTimer) updateTimer(val, activeTimer.projectId);
  };

  const handleProjectSelect = (id: string | null) => {
    setProjectId(id);
    if (activeTimer) updateTimer(taskName, id);
  };

  // Suggestions from history
  const suggestions = useMemo(() => {
    if (!taskName.trim() || activeTimer) return [];
    const uniqueTasks = new Map<string, string | null>();
    entries.forEach(e => {
      if (!uniqueTasks.has(e.taskName)) uniqueTasks.set(e.taskName, e.projectId);
    });
    return Array.from(uniqueTasks.entries())
      .filter(([name]) => name.toLowerCase().includes(taskName.toLowerCase()))
      .slice(0, 5);
  }, [entries, taskName, activeTimer]);

  // Today's data
  const today = new Date();
  const todayEntries = entries
    .filter(e => isSameDay(new Date(e.startedAt), today))
    .sort((a, b) => b.startedAt - a.startedAt);
  
  // Include elapsed time from active timer if it's today
  const activeTimerElapsed = (activeTimer && isSameDay(new Date(activeTimer.startedAt), today)) ? elapsed : 0;
  const todaySeconds = todayEntries.reduce((acc, e) => acc + e.duration, 0) + activeTimerElapsed;
  
  const goalSeconds = dailyGoalMinutes * 60;
  const goalProgress = goalSeconds > 0 ? Math.min((todaySeconds / goalSeconds) * 100, 100) : 0;

  // Format elapsed time
  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const selectedProject = projects.find(p => p.id === projectId);

  const handleGoalSave = () => {
    const val = parseInt(goalInput);
    if (!isNaN(val) && val > 0) {
      setDailyGoal(val * 60);
      toast.success(`Meta diária atualizada para ${val}h`);
    }
    setEditingGoal(false);
    setGoalInput("");
  };

  // Streak calculation
  const daysWithFocus = new Set(entries.map(e => startOfDay(new Date(e.startedAt)).getTime()));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (daysWithFocus.has(startOfDay(subDays(today, i)).getTime())) streak++;
    else if (i > 0) break;
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="flex items-center gap-4">
          {mounted && (
            <p className="text-2xs text-muted-foreground uppercase tracking-[0.14em] font-medium mr-4">
              {format(today, "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {mounted && <DailyLogPopover />}
          
          {/* Daily Goal */}
          {mounted && (
            <div className="flex items-center gap-2">
              {editingGoal ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    autoFocus
                    placeholder="4"
                    value={goalInput}
                    onChange={e => setGoalInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleGoalSave(); if (e.key === "Escape") setEditingGoal(false); }}
                    className="w-12 h-7 rounded-lg bg-card border border-border px-2 text-xs text-foreground text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus:border-cyan-glow"
                  />
                  <span className="text-2xs text-muted-foreground">h/dia</span>
                  <button
                    onClick={handleGoalSave}
                    className="text-2xs font-semibold text-cyan-glow hover:text-cyan-glow/80 transition-colors duration-200"
                  >OK</button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingGoal(true); setGoalInput(String(dailyGoalMinutes / 60)); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border hover:border-cyan-glow/30 hover:bg-surface-hover transition-all duration-300 ease-out active:scale-[0.96] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
                  title="Editar meta diária"
                >
                  <Target className="w-3.5 h-3.5 text-muted-foreground group-hover:text-cyan-glow transition-colors duration-300" strokeWidth={1.5} />
                  <span className="text-2xs text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    Meta: {dailyGoalMinutes / 60}h
                  </span>
                </button>
              )}
            </div>
          )}
          {mounted && <AddManualEntryModal />}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {!mounted ? (
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
            <div className="h-2 rounded-full skeleton" />
            <div className="h-32 rounded-2xl skeleton" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-20 rounded-xl skeleton" />
              <div className="h-20 rounded-xl skeleton" />
              <div className="h-20 rounded-xl skeleton" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] py-12 px-4 sm:px-8">
            <div className="w-full max-w-2xl space-y-12">
              
              {/* Daily Goal Progress - Centered & Larger */}
              {goalSeconds > 0 && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Progresso do Dia</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatDuration(todaySeconds)} <span className="text-muted-foreground/40 font-medium">/ {formatDuration(goalSeconds)}</span>
                    </span>
                  </div>
                  <div className="h-3 bg-card rounded-full overflow-hidden border border-border/50">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${goalProgress}%`,
                        background: goalProgress >= 100
                          ? "linear-gradient(90deg, #00E676, #00C853)"
                          : "linear-gradient(90deg, #00F5FF, #00B8D4)",
                        boxShadow: goalProgress >= 100
                          ? "0 0 20px rgba(0, 230, 118, 0.3)"
                          : "0 0 20px rgba(0, 245, 255, 0.2)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Main Focus Centerpiece */}
              <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-500 delay-150">
                <h2 className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em] mb-2 opacity-50">O que estamos focando agora?</h2>
                <div className="bg-card rounded-[2.5rem] border border-border shadow-elevated p-10 transition-all duration-500 ease-out focus-within:ring-4 focus-within:ring-cyan-glow/10 focus-within:border-cyan-glow/30 focus-within:shadow-[0_0_40px_rgba(0,245,255,0.08)]">
                  {activeTimer ? (
                    <div className="flex flex-col items-center gap-8">
                      <div className="inline-flex items-center gap-2 rounded-full bg-green-live/10 px-4 py-1.5 border border-green-live/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-live absolute inline-flex h-full w-full rounded-full bg-green-live opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-live" />
                        </span>
                        <span className="text-[10px] font-bold tracking-[0.2em] text-green-live uppercase">Foco Ativo</span>
                      </div>

                      <div className="flex flex-col items-center gap-2 w-full">
                        <input
                          type="text"
                          value={taskName}
                          onChange={e => handleTaskNameChange(e.target.value)}
                          placeholder="Nome da tarefa..."
                          className="w-full bg-transparent text-center text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/20 border-none outline-none focus:outline-none"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <div className="flex shrink-0 items-center justify-center h-10 rounded-2xl bg-surface-hover/50 border border-border hover:bg-accent hover:border-cyan-glow/30 transition-all duration-300 px-4 gap-2.5">
                              {selectedProject ? (
                                <>
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                                  <span className="text-sm font-semibold text-foreground">{selectedProject.name}</span>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <FolderOpen className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                                  <span className="text-sm font-medium text-muted-foreground">Vincular Projeto</span>
                                </div>
                              )}
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="w-56 bg-card border-border shadow-elevated">
                            <DropdownMenuItem onClick={() => handleProjectSelect(null)} className="focus:bg-accent cursor-pointer py-2.5">Nenhum projeto</DropdownMenuItem>
                            {projects.length > 0 && <DropdownMenuSeparator className="bg-accent" />}
                            {projects.map(p => (
                              <DropdownMenuItem key={p.id} onClick={() => handleProjectSelect(p.id)} className="flex items-center gap-3 focus:bg-accent cursor-pointer py-2.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                <span className="font-medium">{p.name}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-baseline tabular-nums tracking-tighter text-foreground font-bold leading-none">
                        {(() => {
                          const display = formatElapsed(elapsed);
                          const parts = display.split(":");
                          return parts.map((part, i) => (
                            <React.Fragment key={i}>
                              <span className="text-8xl md:text-9xl">{part}</span>
                              {i < parts.length - 1 && (
                                <span className="text-7xl md:text-8xl text-muted-foreground/20 font-light px-2">:</span>
                              )}
                            </React.Fragment>
                          ));
                        })()}
                      </div>

                      <div className="flex items-center gap-6">
                        <button
                          onClick={handleStop}
                          className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover border border-border text-muted-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all duration-300 active:scale-[0.9] shadow-sm"
                          aria-label="Parar timer"
                        >
                          <Square className="h-6 w-6" fill="currentColor" strokeWidth={0} />
                        </button>
                        {activeTimer.pausedAt ? (
                          <button
                            onClick={resumeTimer}
                            className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-accent text-foreground hover:brightness-110 transition-all duration-300 active:scale-[0.94] shadow-glow-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-accent/30"
                            aria-label="Retomar timer"
                          >
                            <Play className="h-8 w-8 ml-1" fill="currentColor" strokeWidth={0} />
                          </button>
                        ) : (
                          <button
                            onClick={pauseTimer}
                            className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-glow text-[#0D0D0D] hover:brightness-110 transition-all duration-300 active:scale-[0.94] animate-breathe shadow-glow-cyan focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-glow/30"
                            aria-label="Pausar timer"
                          >
                            <Pause className="h-8 w-8" fill="currentColor" strokeWidth={0} />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-8 py-4">
                      <div className="relative w-full max-w-lg">
                        <input
                          type="text"
                          value={taskName}
                          onChange={e => { handleTaskNameChange(e.target.value); setShowSuggestions(true); }}
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          onKeyDown={e => { if (e.key === "Enter") handleStart(); }}
                          placeholder="No que vamos focar agora?"
                          className="w-full bg-transparent text-center text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/10 border-none outline-none focus:outline-none"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-6 bg-card border border-border rounded-2xl overflow-hidden z-50 shadow-elevated animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-border flex items-center gap-2.5 bg-surface-hover/50">
                              <History className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Sessões Recentes</span>
                            </div>
                            {suggestions.map(([name, pid]) => (
                              <button
                                key={name}
                                onClick={() => { setTaskName(name); setProjectId(pid); setShowSuggestions(false); }}
                                className="w-full px-4 py-4 text-left hover:bg-surface-hover transition-colors duration-150 flex items-center justify-between group"
                              >
                                <span className="text-base font-medium text-foreground group-hover:text-cyan-glow transition-colors">{name}</span>
                                {pid && (
                                  <div className="flex items-center gap-2 bg-accent/30 px-2 py-1 rounded-lg">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: projects.find(p => p.id === pid)?.color }} />
                                    <span className="text-xs font-semibold text-muted-foreground">{projects.find(p => p.id === pid)?.name}</span>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <div className="flex items-center justify-center h-12 rounded-2xl bg-surface-hover/50 border border-border hover:bg-accent hover:border-cyan-glow/30 transition-all duration-300 px-6 gap-3">
                              {selectedProject ? (
                                <>
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                                  <span className="text-sm font-semibold text-foreground">{selectedProject.name}</span>
                                </>
                              ) : (
                                <div className="flex items-center gap-2.5">
                                  <FolderOpen className="w-4.5 h-4.5 text-muted-foreground/50" />
                                  <span className="text-sm font-medium text-muted-foreground/50">Projeto</span>
                                </div>
                              )}
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="w-56 bg-card border-border shadow-elevated">
                            <DropdownMenuItem onClick={() => handleProjectSelect(null)} className="focus:bg-accent cursor-pointer py-2.5 text-sm">Nenhum projeto</DropdownMenuItem>
                            {projects.length > 0 && <DropdownMenuSeparator className="bg-accent" />}
                            {projects.map(p => (
                              <DropdownMenuItem key={p.id} onClick={() => handleProjectSelect(p.id)} className="flex items-center gap-3 focus:bg-accent cursor-pointer py-2.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                <span className="text-sm font-medium">{p.name}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                          onClick={handleStart}
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-accent text-foreground hover:brightness-110 transition-all duration-300 active:scale-[0.92] shadow-glow-orange group"
                        >
                          <Play className="h-6 w-6 ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                   <p className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-[0.3em]">Espaço para Iniciar / Pausar &nbsp;·&nbsp; Enter para Iniciar</p>
                </div>
              </div>

              {/* Metrics Row - Below Timer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-1000 delay-300">
                <div className="bg-card rounded-3xl p-6 border border-border/60 shadow-card transition-all duration-500 hover:border-cyan-glow/30 hover:shadow-glow-cyan/5 group">
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mb-3">Foco Hoje</p>
                  <p className="text-4xl font-black text-cyan-glow tabular-nums tracking-tighter group-hover:scale-105 transition-transform origin-left">{formatDuration(todaySeconds)}</p>
                </div>
                <div className="bg-card rounded-3xl p-6 border border-border/60 shadow-card transition-all duration-500 hover:border-cyan-glow/30 hover:shadow-glow-cyan/5 group">
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mb-3">Sessões</p>
                  <p className="text-4xl font-black text-foreground tabular-nums tracking-tighter group-hover:scale-105 transition-transform origin-left">{todayEntries.length}</p>
                </div>
                <div className="bg-card rounded-3xl p-6 border border-border/60 shadow-card transition-all duration-500 hover:border-cyan-glow/30 hover:shadow-glow-cyan/5 group">
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mb-3">Sequência</p>
                  <p className="text-4xl font-black text-foreground tabular-nums tracking-tighter group-hover:scale-105 transition-transform origin-left">
                    {streak} <span className="text-base font-bold text-muted-foreground/30 uppercase tracking-widest ml-1">DIAS</span>
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
