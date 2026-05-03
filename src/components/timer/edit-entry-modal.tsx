"use client";

import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { FolderOpen } from "lucide-react";
import { useAppStore, TimeEntry } from "@/store/useTimerStore";
import { toast } from "sonner";

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
  entry: TimeEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEntryModal({ entry, open, onOpenChange }: EditEntryModalProps) {
  const { projects, updateEntry } = useAppStore();
  
  const [taskName, setTaskName] = useState(entry.taskName);
  const [projectId, setProjectId] = useState<string | null>(entry.projectId);
  const [date, setDate] = useState(format(new Date(entry.startedAt), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(format(new Date(entry.startedAt), "HH:mm"));
  const [endTime, setEndTime] = useState(format(new Date(entry.endedAt), "HH:mm"));

  // Reset state when entry changes or modal opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTaskName(entry.taskName);
       
      setProjectId(entry.projectId);
       
      setDate(format(new Date(entry.startedAt), "yyyy-MM-dd"));
       
      setStartTime(format(new Date(entry.startedAt), "HH:mm"));
       
      setEndTime(format(new Date(entry.endedAt), "HH:mm"));
    }
  }, [open, entry]);

  const selectedProject = projects.find((p) => p.id === projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const startDateTime = parse(`${date} ${startTime}`, "yyyy-MM-dd HH:mm", new Date());
      const endDateTime = parse(`${date} ${endTime}`, "yyyy-MM-dd HH:mm", new Date());

      const startedAt = startDateTime.getTime();
      let endedAt = endDateTime.getTime();

      // Handle cases where end time is the next day (e.g. 23:00 to 01:00)
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

      toast.success("Sessão atualizada", {
        description: taskName.trim() || "Foco manual",
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Invalid date or time", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground rounded-2xl shadow-elevated">
        <DialogHeader>
          <DialogTitle>Editar Sessão de Foco</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">O que você fez?</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ex: Leitura, Estudo..."
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                required
                className="flex-1 h-10 rounded-xl bg-transparent border border-border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus:border-cyan-glow/50 transition-all duration-200"
              />
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
              Salvar Alterações
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
