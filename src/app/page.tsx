"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAppStore, TimeEntry } from "@/store/useTimerStore";
import { Play, Square, Pause, FolderOpen, History, Plus, ChevronRight, Target } from "lucide-react";
import { format, isSameDay, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDuration } from "@/lib/utils";
import { toast } from "sonner";
import { AddManualEntryModal } from "@/components/timer/add-manual-entry-modal";
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

  useEffect(() => { setMounted(true); }, []);

  // Sync with active timer
  useEffect(() => {
    if (activeTimer) {
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
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
  }, [activeTimer, taskName, projectId]);

  const handleStart = useCallback(() => {
    startTimer(taskName.trim() || "Sem título", projectId);
  }, [startTimer, taskName, projectId]);

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

  const handleContinue = useCallback((entry: TimeEntry) => {
    startTimer(entry.taskName, entry.projectId);
    toast("Timer iniciado", { description: entry.taskName });
  }, [startTimer]);

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

  // Yesterday's data
  const yesterday = subDays(today, 1);
  const yesterdayEntries = entries
    .filter(e => isSameDay(new Date(e.startedAt), yesterday))
    .sort((a, b) => b.startedAt - a.startedAt);

  // Format elapsed time
  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const selectedProject = projects.find(p => p.id === projectId);
  const getProjectColor = (id: string | null) => projects.find(p => p.id === id)?.color || "#555555";
  const getProjectName = (id: string | null) => projects.find(p => p.id === id)?.name || "Sem Projeto";

  const handleGoalSave = () => {
    const val = parseInt(goalInput);
    if (!isNaN(val) && val > 0) {
      setDailyGoal(val * 60); // convert hours to minutes
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
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-4">
          {mounted && (
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
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
                    className="w-12 h-7 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] px-2 text-xs text-white focus:outline-none focus:border-cyan-glow text-center"
                  />
                  <span className="text-[10px] text-muted-foreground">h/dia</span>
                  <button onClick={handleGoalSave} className="text-[10px] text-cyan-glow hover:text-cyan-glow/80">OK</button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingGoal(true); setGoalInput(String(dailyGoalMinutes / 60)); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#333] transition-colors group"
                  title="Editar meta diária"
                >
                  <Target className="w-3 h-3 text-muted-foreground group-hover:text-cyan-glow transition-colors" />
                  <span className="text-[10px] text-muted-foreground group-hover:text-white transition-colors">
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
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-cyan-glow border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Daily Goal Progress */}
            {goalSeconds > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Progresso do dia</span>
                  <span className="text-xs font-medium text-white tabular-nums">
                    {formatDuration(todaySeconds)} / {formatDuration(goalSeconds)}
                  </span>
                </div>
                <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
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
                  <p className="text-[11px] text-green-live mt-1.5 font-medium">🎯 Meta do dia atingida!</p>
                )}
              </div>
            )}

            {/* Timer Area — Inline Compact */}
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-5 mb-8">
              {activeTimer ? (
                /* Active Timer */
                <div className="flex flex-col items-center gap-4">
                  {/* AO VIVO badge */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-green-live/10 px-3 py-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-live absolute inline-flex h-full w-full rounded-full bg-green-live opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-live" />
                    </span>
                    <span className="text-[10px] font-semibold tracking-wide text-green-live uppercase">Ao vivo</span>
                  </div>

                  {/* Task name + project inline */}
                  <div className="flex items-center gap-3 w-full max-w-lg">
                    <input
                      type="text"
                      value={taskName}
                      onChange={e => handleTaskNameChange(e.target.value)}
                      placeholder="Nome da tarefa..."
                      className="flex-1 bg-transparent text-center text-xl font-bold text-white placeholder:text-[#333] border-none focus:outline-none"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <div className="flex shrink-0 items-center justify-center h-9 rounded-xl bg-[#242424] border border-[#333] hover:bg-[#2A2A2A] transition-colors cursor-pointer px-2.5 gap-2">
                          {selectedProject ? (
                            <>
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                              <span className="text-xs font-medium text-white max-w-[80px] truncate">{selectedProject.name}</span>
                            </>
                          ) : (
                            <FolderOpen className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-[#1A1A1A] border-[#2A2A2A]">
                        <DropdownMenuItem onClick={() => handleProjectSelect(null)} className="focus:bg-[#242424] cursor-pointer">Nenhum projeto</DropdownMenuItem>
                        {projects.length > 0 && <DropdownMenuSeparator className="bg-[#2A2A2A]" />}
                        {projects.map(p => (
                          <DropdownMenuItem key={p.id} onClick={() => handleProjectSelect(p.id)} className="flex items-center gap-2 focus:bg-[#242424] cursor-pointer">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                            {p.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Timer display */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tabular-nums tracking-tight text-white">
                      {formatElapsed(elapsed)}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleStop}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-[#242424] border border-[#333] text-white hover:bg-[#2A2A2A] transition-all active:scale-95"
                    >
                      <Square className="h-5 w-5" fill="currentColor" />
                    </button>
                    {activeTimer.pausedAt ? (
                      <button
                        onClick={resumeTimer}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-accent text-white hover:bg-orange-accent/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,107,0,0.3)]"
                      >
                        <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
                      </button>
                    ) : (
                      <button
                        onClick={pauseTimer}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-glow text-[#0D0D0D] hover:bg-cyan-glow/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,245,255,0.3)]"
                      >
                        <Pause className="h-5 w-5" fill="currentColor" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Espaço para pausar/retomar</p>
                </div>
              ) : (
                /* Idle Timer — Inline */
                <div className="flex items-center gap-3 relative">
                  <input
                    type="text"
                    value={taskName}
                    onChange={e => { handleTaskNameChange(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={e => { if (e.key === "Enter") handleStart(); }}
                    placeholder="O que vamos focar agora?"
                    className="flex-1 bg-transparent text-base font-medium text-white placeholder:text-[#444] border-none focus:outline-none"
                  />

                  {/* Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-16 mt-2 bg-[#242424] border border-[#333] rounded-xl overflow-hidden z-50 shadow-2xl">
                      <div className="px-3 py-2 border-b border-[#333] flex items-center gap-2">
                        <History className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recentes</span>
                      </div>
                      {suggestions.map(([name, pid]) => (
                        <button key={name} onClick={() => { setTaskName(name); setProjectId(pid); setShowSuggestions(false); }}
                          className="w-full px-3 py-2.5 text-left hover:bg-[#2A2A2A] transition-colors flex items-center justify-between">
                          <span className="text-sm text-white">{name}</span>
                          {pid && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: projects.find(p => p.id === pid)?.color }} />
                              <span className="text-[10px] text-muted-foreground">{projects.find(p => p.id === pid)?.name}</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <div className="flex shrink-0 items-center justify-center h-9 rounded-xl bg-[#242424] border border-[#333] hover:bg-[#2A2A2A] transition-colors cursor-pointer px-2.5 gap-2">
                        {selectedProject ? (
                          <>
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                            <span className="text-xs font-medium text-white max-w-[80px] truncate">{selectedProject.name}</span>
                          </>
                        ) : (
                          <FolderOpen className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-[#1A1A1A] border-[#2A2A2A]">
                      <DropdownMenuItem onClick={() => handleProjectSelect(null)} className="focus:bg-[#242424] cursor-pointer">Nenhum projeto</DropdownMenuItem>
                      {projects.length > 0 && <DropdownMenuSeparator className="bg-[#2A2A2A]" />}
                      {projects.map(p => (
                        <DropdownMenuItem key={p.id} onClick={() => handleProjectSelect(p.id)} className="flex items-center gap-2 focus:bg-[#242424] cursor-pointer">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button
                    onClick={handleStart}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-accent text-white hover:bg-orange-accent/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,107,0,0.25)]"
                  >
                    <Play className="h-4.5 w-4.5 ml-0.5" fill="currentColor" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Hoje</p>
                <p className="text-2xl font-bold text-cyan-glow tabular-nums">{formatDuration(todaySeconds)}</p>
              </div>
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sessões</p>
                <p className="text-2xl font-bold text-white tabular-nums">{todayEntries.length}</p>
              </div>
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sequência</p>
                <p className="text-2xl font-bold text-white tabular-nums">{streak} <span className="text-sm font-normal text-muted-foreground">dias</span></p>
              </div>
            </div>

            {/* Today's Entries */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Hoje</h2>
                <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(todaySeconds)}</span>
              </div>

              {todayEntries.length === 0 ? (
                <div className="bg-[#1A1A1A] rounded-xl border border-dashed border-[#2A2A2A] p-8 text-center">
                  <p className="text-sm text-[#555]">Nenhuma sessão hoje ainda.</p>
                  <p className="text-xs text-[#444] mt-1">Digite uma tarefa acima e clique ▶ para começar.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {todayEntries.map(entry => (
                    <div key={entry.id} className="flex items-center gap-3 px-4 py-3 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] hover:border-[#333] transition-colors group">
                      {/* Continue button */}
                      <button
                        onClick={() => handleContinue(entry)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#242424] text-muted-foreground hover:text-orange-accent hover:bg-orange-accent/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Continuar esta tarefa"
                      >
                        <Play className="h-3 w-3 ml-0.5" fill="currentColor" />
                      </button>

                      {/* Project color */}
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getProjectColor(entry.projectId) }} />

                      {/* Task info */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white font-medium truncate block">{entry.taskName}</span>
                      </div>

                      {/* Project name */}
                      <span className="text-[11px] text-muted-foreground truncate max-w-[100px] hidden sm:block">
                        {getProjectName(entry.projectId)}
                      </span>

                      {/* Time range */}
                      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                        {format(new Date(entry.startedAt), "HH:mm")} – {format(new Date(entry.endedAt), "HH:mm")}
                      </span>

                      {/* Duration */}
                      <span className="text-sm font-medium text-white tabular-nums shrink-0 w-20 text-right">
                        {formatDuration(entry.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Yesterday's Entries */}
            {yesterdayEntries.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-white">Ontem</h2>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDuration(yesterdayEntries.reduce((acc, e) => acc + e.duration, 0))}
                  </span>
                </div>
                <div className="space-y-1">
                  {yesterdayEntries.slice(0, 5).map(entry => (
                    <div key={entry.id} className="flex items-center gap-3 px-4 py-3 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] hover:border-[#333] transition-colors group">
                      <button
                        onClick={() => handleContinue(entry)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#242424] text-muted-foreground hover:text-orange-accent hover:bg-orange-accent/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Continuar esta tarefa"
                      >
                        <Play className="h-3 w-3 ml-0.5" fill="currentColor" />
                      </button>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getProjectColor(entry.projectId) }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[#999] font-medium truncate block">{entry.taskName}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate max-w-[100px] hidden sm:block">{getProjectName(entry.projectId)}</span>
                      <span className="text-sm font-medium text-[#777] tabular-nums shrink-0 w-20 text-right">{formatDuration(entry.duration)}</span>
                    </div>
                  ))}
                  {yesterdayEntries.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center py-2">+{yesterdayEntries.length - 5} sessões</p>
                  )}
                </div>
              </div>
            )}

            {/* Keyboard shortcut hint */}
            <div className="mt-8 text-center">
              <p className="text-[10px] text-[#333] uppercase tracking-wider">
                Espaço = Iniciar/Pausar • Enter = Iniciar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
