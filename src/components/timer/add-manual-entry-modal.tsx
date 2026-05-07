"use client";

import { useState } from "react";
import { format, parse, addHours } from "date-fns";
import { FolderOpen, Plus, History } from "lucide-react";
import { useAppStore } from "@/store/useTimerStore";
import { toast } from "sonner";
import { formatDuration } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AddManualEntryModalProps {
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
}

export function AddManualEntryModal({
  initialDate,
  initialStartTime,
  initialEndTime,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger
}: AddManualEntryModalProps) {
  const { projects, addEntry, entries } = useAppStore();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  
  const [taskName, setTaskName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [date, setDate] = useState(initialDate || format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(initialStartTime || "09:00");
  const [endTime, setEndTime] = useState(initialEndTime || (() => {
    if (initialStartTime) {
      try {
        const start = parse(initialStartTime, "HH:mm", new Date());
        const end = addHours(start, 1);
        return format(end, "HH:mm");
      } catch {
        return "10:00";
      }
    }
    return "10:00";
  }));

  const selectedProject = projects.find((p) => p.id === projectId);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const recentTasksMap = new Map<string, string | null>();
  entries.forEach(e => {
    if (e.taskName && !recentTasksMap.has(e.taskName)) {
      recentTasksMap.set(e.taskName, e.projectId);
    }
  });
  const suggestions = Array.from(recentTasksMap.entries())
    .filter(([name]) => name.toLowerCase().includes(taskName.toLowerCase()))
    .slice(0, 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const startDateTime = parse(`${date} ${startTime}`, "yyyy-MM-dd HH:mm", new Date());
      const endDateTime = parse(`${date} ${endTime}`, "yyyy-MM-dd HH:mm", new Date());

      const startedAt = startDateTime.getTime();
      let endedAt = endDateTime.getTime();

      if (endedAt < startedAt) {
        endedAt += 24 * 60 * 60 * 1000;
      }

      const duration = Math.floor((endedAt - startedAt) / 1000);

      addEntry({
        id: crypto.randomUUID(),
        taskName: taskName.trim() || "Foco manual",
        projectId,
        startedAt,
        endedAt,
        duration,
        source: "manual",
      });

      
      setTaskName("");
      setProjectId(null);
      setIsOpen(false);
    } catch (err) {
      console.error("Invalid date or time", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : !isControlled ? (
        <DialogTrigger render={
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-surface-hover text-xs font-medium text-foreground transition-all duration-300 ease-out active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Adicionar tempo
          </button>
        } />
      ) : null}
      <DialogContent 
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-[425px] bg-card border-border text-foreground rounded-2xl shadow-elevated"
      >
        <DialogHeader>
          <DialogTitle>Adicionar Foco Manual</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="manual-task-name" className="text-xs text-muted-foreground font-medium">O que você fez?</label>
            <div className="flex items-center gap-2 relative">
              <div className="relative flex-1">
                <input
                  id="manual-task-name"
                  name="manualTaskName"
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
            <label htmlFor="manual-date" className="text-xs text-muted-foreground font-medium">Data</label>
            <input
              id="manual-date"
              name="manualDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full h-10 rounded-xl bg-transparent border border-border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus:border-cyan-glow/50 transition-all duration-200 text-foreground [color-scheme:dark]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="manual-start-time" className="text-xs text-muted-foreground font-medium">Hora de início</label>
              <input
                id="manual-start-time"
                name="manualStartTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full h-10 rounded-xl bg-transparent border border-border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus:border-cyan-glow/50 transition-all duration-200 text-foreground [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="manual-end-time" className="text-xs text-muted-foreground font-medium">Hora de término</label>
              <input
                id="manual-end-time"
                name="manualEndTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full h-10 rounded-xl bg-transparent border border-border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus:border-cyan-glow/50 transition-all duration-200 text-foreground [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
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
              Adicionar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
