"use client";

import { useState } from "react";
import { format, parse } from "date-fns";
import { FolderOpen, Plus } from "lucide-react";
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

export function AddManualEntryModal() {
  const { projects, addEntry } = useAppStore();
  const [open, setOpen] = useState(false);
  
  const [taskName, setTaskName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const selectedProject = projects.find((p) => p.id === projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse the date and times
    try {
      const startDateTime = parse(`${date} ${startTime}`, "yyyy-MM-dd HH:mm", new Date());
      const endDateTime = parse(`${date} ${endTime}`, "yyyy-MM-dd HH:mm", new Date());

      let startedAt = startDateTime.getTime();
      let endedAt = endDateTime.getTime();

      // Handle cases where end time is the next day (e.g. 23:00 to 01:00)
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
      });

      // Reset and close
      toast.success(`Sessão de ${formatDuration(duration)} adicionada`, {
        description: taskName.trim() || "Foco manual",
      });
      setTaskName("");
      setProjectId(null);
      setOpen(false);
    } catch (err) {
      console.error("Invalid date or time", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] text-xs font-medium text-white transition-colors cursor-pointer" />
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar tempo
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1A1A1A] border-[#2A2A2A] text-white">
        <DialogHeader>
          <DialogTitle>Adicionar Foco Manual</DialogTitle>
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
                className="flex-1 h-10 rounded-xl bg-transparent border border-[#2A2A2A] px-3 text-sm focus:outline-none focus:border-[#555555] transition-colors"
              />
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div
                    className="flex shrink-0 items-center justify-center h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] hover:bg-[#242424] transition-colors cursor-pointer px-3 gap-2"
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
                <DropdownMenuContent align="end" className="w-48 bg-[#1A1A1A] border-[#2A2A2A] z-[60]">
                  <DropdownMenuItem onClick={() => setProjectId(null)} className="focus:bg-[#242424] cursor-pointer text-white">
                    Nenhum projeto
                  </DropdownMenuItem>
                  {projects.length > 0 && <DropdownMenuSeparator className="bg-[#2A2A2A]" />}
                  {projects.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => setProjectId(p.id)}
                      className="flex items-center gap-2 focus:bg-[#242424] cursor-pointer text-white"
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
              className="w-full h-10 rounded-xl bg-transparent border border-[#2A2A2A] px-3 text-sm focus:outline-none focus:border-[#555555] transition-colors text-white [color-scheme:dark]"
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
                className="w-full h-10 rounded-xl bg-transparent border border-[#2A2A2A] px-3 text-sm focus:outline-none focus:border-[#555555] transition-colors text-white [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Hora de término</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full h-10 rounded-xl bg-transparent border border-[#2A2A2A] px-3 text-sm focus:outline-none focus:border-[#555555] transition-colors text-white [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <DialogClose
              render={
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors"
                />
              }
            >
              Cancelar
            </DialogClose>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-glow text-black text-sm font-bold hover:bg-cyan-glow/90 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
