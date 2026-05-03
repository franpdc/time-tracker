"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAppStore, TimeEntry } from "@/store/useTimerStore";
import { Play, Square, Pause, FolderOpen, History, Target, Clock, Settings, Calendar as CalendarIcon } from "lucide-react";
import { format, isSameDay, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDuration } from "@/lib/utils";
import { toast } from "sonner";
import { AddManualEntryModal } from "@/components/timer/add-manual-entry-modal";
import { CalendarView } from "@/components/timer/calendar-view";
import { DailyLogCard } from "@/components/timer/daily-log-card";
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
  const todaySeconds = todayEntries.reduce((acc, e) => acc + e.duration, 0);
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
            <p className="text-2xs text-muted-foreground uppercase tracking-[0.14em] font-medium">
              {format(today, "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
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
            <div className="h-12 rounded-xl skeleton" />
            <div className="h-12 rounded-xl skeleton" />
          </div>
        ) : (
          <>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Left Column: Timer & Stats */}
                <div className="flex flex-col">
                  {/* Daily Goal Progress */}
                  {goalSeconds > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Progresso do dia</span>
                        <span className="text-xs font-medium text-foreground tabular-nums">
                          {formatDuration(todaySeconds)} <span className="text-muted-foreground/60">/ {formatDuration(goalSeconds)}</span>
                        </span>
                      </div>
                      <div className="h-2 bg-card rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${goalProgress}%`,
                            background: goalProgress >= 100
                              ? "linear-gradient(90deg, #00E676, #00C853)"
                              : "linear-gradient(90deg, #00F5FF, #00B8D4)",
                            boxShadow: goalProgress >= 100
                              ? "0 0 12px rgba(0, 230, 118, 0.4)"
                              : "0 0 12px rgba(0, 245, 255, 0.3)",
                          }}
                        />
                      </div>
                      {goalProgress >= 100 && (
                        <p className="text-xs text-green-live mt-2 font-medium tracking-wide">Meta do dia atingida</p>
                      )}
                    </div>
                  )}

                  {/* Timer Area */}
                  <div className="bg-card rounded-2xl border border-border shadow-card p-6 mb-8 transition-all duration-300 ease-out focus-within:ring-2 focus-within:ring-cyan-glow/20 focus-within:border-cyan-glow/40 focus-within:shadow-[0_0_20px_rgba(0,245,255,0.05)]">
                    {activeTimer ? (
                      /* Active Timer */
                      <div className="flex flex-col items-center gap-5">
                        {/* AO VIVO badge */}
                        <div className="inline-flex items-center gap-2 rounded-full bg-green-live/10 px-3 py-1">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-live absolute inline-flex h-full w-full rounded-full bg-green-live opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-live" />
                          </span>
                          <span className="text-2xs font-semibold tracking-[0.14em] text-green-live uppercase">Ao vivo</span>
                        </div>

                        {/* Task name + project inline */}
                        <div className="flex items-center gap-3 w-full max-w-lg">
                          <input
                            type="text"
                            value={taskName}
                            onChange={e => handleTaskNameChange(e.target.value)}
                            placeholder="Nome da tarefa..."
                            className="flex-1 bg-transparent text-center text-xl font-semibold tracking-[-0.01em] text-foreground placeholder:text-muted-foreground/30 border-none outline-none focus:outline-none focus-visible:outline-none"
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <div className="flex shrink-0 items-center justify-center h-9 rounded-xl bg-surface-hover border border-border hover:bg-accent hover:border-cyan-glow/30 transition-all duration-300 ease-out active:scale-[0.98] cursor-pointer px-2.5 gap-2">
                                {selectedProject ? (
                                  <>
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                                    <span className="text-xs font-medium text-foreground max-w-[80px] truncate">{selectedProject.name}</span>
                                  </>
                                ) : (
                                  <FolderOpen className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                                )}
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                              <DropdownMenuItem onClick={() => handleProjectSelect(null)} className="focus:bg-accent cursor-pointer">Nenhum projeto</DropdownMenuItem>
                              {projects.length > 0 && <DropdownMenuSeparator className="bg-accent" />}
                              {projects.map(p => (
                                <DropdownMenuItem key={p.id} onClick={() => handleProjectSelect(p.id)} className="flex items-center gap-2 focus:bg-accent cursor-pointer">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                  {p.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Timer display */}
                        <div className="flex items-baseline tabular-nums tracking-[-0.04em] text-foreground font-bold">
                          {(() => {
                            const display = formatElapsed(elapsed);
                            const parts = display.split(":");
                            return parts.map((part, i) => (
                              <React.Fragment key={i}>
                                <span className="text-6xl">{part}</span>
                                {i < parts.length - 1 && (
                                  <span className="text-5xl text-muted-foreground/40 font-light px-1">:</span>
                                )}
                              </React.Fragment>
                            ));
                          })()}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleStop}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover border border-border text-muted-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all duration-300 ease-out active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
                            aria-label="Parar timer"
                          >
                            <Square className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                          </button>
                          {activeTimer.pausedAt ? (
                            <button
                              onClick={resumeTimer}
                              className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-accent text-foreground hover:brightness-110 transition-all duration-300 ease-out active:scale-[0.96] shadow-glow-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-accent/60"
                              style={{ boxShadow: "0 0 20px rgba(255, 107, 0, 0.3)" }}
                              aria-label="Retomar timer"
                            >
                              <Play className="h-5 w-5 ml-0.5" fill="currentColor" strokeWidth={0} />
                            </button>
                          ) : (
                            <button
                              onClick={pauseTimer}
                              className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-glow text-[#0D0D0D] hover:brightness-110 transition-all duration-300 ease-out active:scale-[0.96] animate-breathe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/60"
                              aria-label="Pausar timer"
                            >
                              <Pause className="h-5 w-5" fill="currentColor" strokeWidth={0} />
                            </button>
                          )}
                        </div>
                        <p className="text-2xs text-muted-foreground/70 tracking-wide">Espaço para pausar e retomar</p>
                      </div>
                    ) : (
                      /* Idle Timer */
                      <div className="flex items-center gap-3 relative">
                        <input
                          type="text"
                          value={taskName}
                          onChange={e => { handleTaskNameChange(e.target.value); setShowSuggestions(true); }}
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          onKeyDown={e => { if (e.key === "Enter") handleStart(); }}
                          placeholder="O que vamos focar agora?"
                          className="flex-1 bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/50 border-none outline-none focus:outline-none focus-visible:outline-none"
                        />

                        {/* Suggestions */}
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-16 mt-2 bg-card border border-border rounded-xl overflow-hidden z-50 shadow-elevated">
                            <div className="px-3 py-2 border-b border-border flex items-center gap-2 bg-surface-hover">
                              <History className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recentes</span>
                            </div>
                            {suggestions.map(([name, pid]) => (
                              <button
                                key={name}
                                onClick={() => { setTaskName(name); setProjectId(pid); setShowSuggestions(false); }}
                                className="w-full px-3 py-2.5 text-left hover:bg-surface-hover transition-colors duration-150 flex items-center justify-between"
                              >
                                <span className="text-sm text-foreground">{name}</span>
                                {pid && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: projects.find(p => p.id === pid)?.color }} />
                                    <span className="text-2xs text-muted-foreground">{projects.find(p => p.id === pid)?.name}</span>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <div className="flex shrink-0 items-center justify-center h-9 rounded-xl bg-surface-hover border border-border hover:bg-accent hover:border-cyan-glow/30 transition-all duration-200 cursor-pointer px-2.5 gap-2">
                              {selectedProject ? (
                                <>
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                                  <span className="text-xs font-medium text-foreground max-w-[80px] truncate">{selectedProject.name}</span>
                                </>
                              ) : (
                                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                            <DropdownMenuItem onClick={() => handleProjectSelect(null)} className="focus:bg-accent cursor-pointer">Nenhum projeto</DropdownMenuItem>
                            {projects.length > 0 && <DropdownMenuSeparator className="bg-accent" />}
                            {projects.map(p => (
                              <DropdownMenuItem key={p.id} onClick={() => handleProjectSelect(p.id)} className="flex items-center gap-2 focus:bg-accent cursor-pointer">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                {p.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                          onClick={handleStart}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-accent text-foreground hover:brightness-110 transition-all duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                          style={{ boxShadow: "0 0 20px rgba(255, 107, 0, 0.25)" }}
                          aria-label="Iniciar timer"
                        >
                          <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats Row */}
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-card rounded-2xl p-4 border border-border shadow-card transition-all duration-200 hover:border-cyan-glow/20">
                      <p className="text-2xs text-muted-foreground uppercase tracking-[0.14em] font-medium mb-1.5">Hoje</p>
                      <p className="text-2xl font-bold text-cyan-glow tabular-nums tracking-[-0.02em]">{formatDuration(todaySeconds)}</p>
                    </div>
                    <div className="bg-card rounded-2xl p-4 border border-border shadow-card transition-all duration-200 hover:border-cyan-glow/20">
                      <p className="text-2xs text-muted-foreground uppercase tracking-[0.14em] font-medium mb-1.5">Sessões</p>
                      <p className="text-2xl font-bold text-foreground tabular-nums tracking-[-0.02em]">{todayEntries.length}</p>
                    </div>
                    <div className="bg-card rounded-2xl p-4 border border-border shadow-card transition-all duration-200 hover:border-cyan-glow/20">
                      <p className="text-2xs text-muted-foreground uppercase tracking-[0.14em] font-medium mb-1.5">Sequência</p>
                      <p className="text-2xl font-bold text-foreground tabular-nums tracking-[-0.02em]">
                        {streak} <span className="text-sm font-normal text-muted-foreground">dias</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Daily Log Card */}
                <div className="flex flex-col">
                  <DailyLogCard />
                </div>
              </div>

              {/* Calendar View */}
              <div className="mb-8">
                <CalendarView />
              </div>

              {/* Keyboard shortcut hint */}
              <div className="pb-10 text-center">
                <p className="text-2xs text-muted-foreground/40 uppercase tracking-[0.18em]">
                  Espaço · Iniciar / Pausar &nbsp;·&nbsp; Enter · Iniciar
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
