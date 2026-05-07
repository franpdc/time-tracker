"use client";

import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { FolderOpen, Play, Square, Pause, Trash2, History } from "lucide-react";
import { useAppStore, TimeEntry, ActiveTimer } from "@/store/useTimerStore";
import { toast } from "sonner";
import { formatDuration } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface EditEntryModalProps {
  entry?: TimeEntry;
  activeTimer?: ActiveTimer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLive?: boolean;
}

export function EditEntryModal({ entry, activeTimer, open, onOpenChange, isLive }: EditEntryModalProps) {
  const { 
    projects, updateEntry, deleteEntry, entries,
    pauseTimer, resumeTimer, stopTimer, updateActiveTimer 
  } = useAppStore();
  
  const [taskName, setTaskName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const [showSuggestions, setShowSuggestions] = useState(false);

  // Suggestions logic
  const recentTasksMap = new Map<string, string | null>();
  entries.forEach(e => {
    if (e.taskName && !recentTasksMap.has(e.taskName)) {
      recentTasksMap.set(e.taskName, e.projectId);
    }
  });
  const suggestions = Array.from(recentTasksMap.entries())
    .filter(([name]) => name.toLowerCase().includes(taskName.toLowerCase()))
    .slice(0, 5);

  // Initial state and live elapsed logic
  useEffect(() => {
    if (!open) return;

    const syncState = () => {
      if (isLive && activeTimer) {
        setTaskName(activeTimer.taskName);
        setProjectId(activeTimer.projectId);
        setDate(format(new Date(activeTimer.startedAt), "yyyy-MM-dd"));
        setStartTime(format(new Date(activeTimer.startedAt), "HH:mm"));
      } else if (entry) {
        setTaskName(entry.taskName);
        setProjectId(entry.projectId);
        setDate(format(new Date(entry.startedAt), "yyyy-MM-dd"));
        setStartTime(format(new Date(entry.startedAt), "HH:mm"));
        setEndTime(format(new Date(entry.endedAt), "HH:mm"));
      }
    };

    const timeout = setTimeout(syncState, 0);

    let interval: NodeJS.Timeout | undefined;
    if (isLive && activeTimer) {
      const updateElapsed = () => {
        const endedAt = activeTimer.pausedAt || Date.now();
        setElapsed(Math.max(0, Math.floor((endedAt - activeTimer.startedAt) / 1000)));
      };
      
      updateElapsed();
      if (!activeTimer.pausedAt) {
        interval = setInterval(updateElapsed, 1000);
      }
    }

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [open, entry, activeTimer, isLive]);

  const selectedProject = projects.find((p) => p.id === projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const startDateTime = parse(`${date} ${startTime}`, "yyyy-MM-dd HH:mm", new Date());
      const startedAt = startDateTime.getTime();

      if (isLive && activeTimer) {
        // Save edits to active session
        updateActiveTimer({
          taskName: taskName.trim() || "Foco atual",
          projectId,
          startedAt,
        });
        onOpenChange(false);
      } else if (entry) {
        // Save edits to past entry
        const endDateTime = parse(`${date} ${endTime}`, "yyyy-MM-dd HH:mm", new Date());
        let endedAt = endDateTime.getTime();

        if (endedAt < startedAt) {
          endedAt += 24 * 60 * 60 * 1000;
        }

        const duration = Math.floor((endedAt - startedAt) / 1000);

        updateEntry(entry.id, {
          taskName: taskName.trim() || "Foco manual",
          projectId,
          startedAt,
          endedAt,
          duration,
        });

        onOpenChange(false);
      }
    } catch (err) {
      console.error("Invalid date or time", err);
    }
  };

  const handleStop = () => {
    stopTimer();
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (entry) {
      deleteEntry(entry.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-[425px] bg-card border-border text-foreground rounded-2xl shadow-elevated"
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="text-lg">
            {isLive ? "Sessão Ativa" : "Editar Sessão"}
          </DialogTitle>
        </DialogHeader>

        {isLive && activeTimer && (
          <div className="flex flex-col items-center py-6 bg-surface-hover/30 rounded-2xl border border-border/50 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-live/10 px-3 py-1 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-live absolute inline-flex h-full w-full rounded-full bg-green-live opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-live" />
              </span>
              <span className="text-[10px] font-bold tracking-[0.14em] text-green-live uppercase">
                {activeTimer.pausedAt ? "Pausado" : "Ao vivo"}
              </span>
            </div>
            
            <div className="text-4xl font-bold tabular-nums tracking-tight mb-6">
              {formatDuration(elapsed)}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleStop}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all active:scale-[0.94]"
                title="Parar e gravar"
              >
                <Square className="h-4 w-4" fill="currentColor" strokeWidth={0} />
              </button>
              {activeTimer.pausedAt ? (
                <button
                  onClick={resumeTimer}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-accent text-foreground hover:brightness-110 transition-all active:scale-[0.96] shadow-glow-orange"
                >
                  <Play className="h-5 w-5 ml-0.5" fill="currentColor" strokeWidth={0} />
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-glow text-[#0D0D0D] hover:brightness-110 transition-all active:scale-[0.96] animate-breathe"
                >
                  <Pause className="h-5 w-5" fill="currentColor" strokeWidth={0} />
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">O que você fez?</label>
            <div className="flex items-center gap-2 relative">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ex: Trabalho, Estudo..."
                  value={taskName}
                  onChange={(e) => { setTaskName(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  required
                  className="w-full h-10 rounded-xl bg-transparent border border-border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus:border-cyan-glow/50 transition-all duration-200"
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl overflow-hidden z-50 shadow-elevated">
                    <div className="px-3 py-2 border-b border-border flex items-center gap-2 bg-surface-hover">
                      <History className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recentes</span>
                    </div>
                    {suggestions.map(([name, pid]) => (
                      <button
                        key={name}
                        type="button"
                        onClick={(e) => { 
                          e.preventDefault();
                          setTaskName(name); 
                          setProjectId(pid); 
                          setShowSuggestions(false); 
                        }}
                        className="w-full px-3 py-2.5 text-left hover:bg-surface-hover transition-colors duration-150 flex items-center justify-between"
                      >
                        <span className="text-sm text-foreground">{name}</span>
                        {pid && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: projects.find(p => p.id === pid)?.color }} />
                            <span className="text-[10px] font-medium text-muted-foreground">{projects.find(p => p.id === pid)?.name}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div
                    className="flex shrink-0 items-center justify-center h-10 rounded-xl bg-card border border-border hover:bg-surface-hover hover:border-cyan-glow/30 transition-all duration-200 ease-out active:scale-[0.97] cursor-pointer px-3 gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
                    title={selectedProject ? selectedProject.name : "Vincular a um projeto"}
                  >
                    {selectedProject ? (
                      <>
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: selectedProject.color }}
                        />
                        <span className="text-xs font-medium max-w-[80px] truncate">
                          {selectedProject.name}
                        </span>
                      </>
                    ) : (
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border z-[60]">
                  <DropdownMenuItem onClick={() => setProjectId(null)} className="focus:bg-accent cursor-pointer text-foreground">
                    Nenhum projeto
                  </DropdownMenuItem>
                  {projects.length > 0 && <DropdownMenuSeparator className="bg-accent" />}
                  {projects.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => setProjectId(p.id)}
                      className="flex items-center gap-2 focus:bg-accent cursor-pointer text-foreground"
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
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full h-10 rounded-xl bg-transparent border border-border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus:border-cyan-glow/50 transition-all duration-200 text-foreground [color-scheme:dark]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Hora de início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full h-10 rounded-xl bg-transparent border border-border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus:border-cyan-glow/50 transition-all duration-200 text-foreground [color-scheme:dark]"
              />
            </div>
            {!isLive && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Hora de término</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full h-10 rounded-xl bg-transparent border border-border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus:border-cyan-glow/50 transition-all duration-200 text-foreground [color-scheme:dark]"
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="flex items-center">
              {!isLive && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-2 rounded-xl text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                  title="Excluir sessão"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DialogClose render={
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all duration-300 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
                >
                  Cancelar
                </button>
              } />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-glow text-black text-sm font-bold hover:bg-cyan-glow/90 transition-all duration-200 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background shadow-[0_0_16px_rgba(0,245,255,0.2)]"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
