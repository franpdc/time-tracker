"use client";

import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/useTimerStore";

export function DailyLogCard() {
  const { entries, projects } = useAppStore();
  const currentDate = new Date(); // Or whatever the selected date is

  const todayEntries = entries.filter((e) =>
    isSameDay(new Date(e.startedAt), currentDate)
  );

  const totalSeconds = todayEntries.reduce((acc, curr) => acc + curr.duration, 0);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
    return `${m} min`;
  };

  const projectDurations = (() => {
    const pd: Record<string, number> = {};
    todayEntries.forEach((e) => {
      const pid = e.projectId || "Sem Projeto";
      pd[pid] = (pd[pid] || 0) + e.duration;
    });
    return Object.entries(pd)
      .map(([id, duration]) => {
        const project = projects.find((p) => p.id === id);
        const projectTasks = todayEntries.filter(e => (e.projectId || "Sem Projeto") === id);
        
        return {
          id,
          name: id === "Sem Projeto" ? "SEM PROJETO" : project?.name.toUpperCase() || "DESCONHECIDO",
          color: id === "Sem Projeto" ? "var(--muted)" : project?.color || "var(--muted)",
          duration,
          tasks: projectTasks,
        };
      })
      .sort((a, b) => b.duration - a.duration);
  })();

  return (
    <div className="bg-[#111111] rounded-3xl p-5 border border-white/5 shadow-lg w-full max-w-2xl">
      {/* Top row */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white tracking-tight">Log Diário</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white/70 font-medium">
            <button className="hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[15px]">{format(currentDate, "dd/MM")}</span>
            <button className="hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button className="bg-white/5 hover:bg-white/10 text-white/50 text-[13px] font-medium px-4 py-1.5 rounded-full transition-colors">
            Hoje
          </button>
        </div>
      </div>

      {/* Bottom row (Badges) */}
      <div className="flex flex-wrap gap-2">
        {projectDurations.map((p) => {
          return (
            <div
              key={p.id}
              className="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold text-[13px] relative group cursor-default"
              style={{
                borderColor: `${p.color}40`,
                color: p.color,
              }}
            >
              <span>{p.name}:</span>
              <span>{formatDuration(p.duration)}</span>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-[#1A1A1A] border border-white/10 text-white/90 text-xs p-3 rounded-xl shadow-xl w-max max-w-[250px]">
                <div className="font-semibold mb-2 text-white/50 border-b border-white/10 pb-1">Tarefas de {p.name}</div>
                <ul className="space-y-1.5">
                  {p.tasks.map(t => (
                    <li key={t.id} className="flex justify-between gap-4 font-medium">
                      <span className="truncate">{t.taskName}</span>
                      <span className="text-white/50 shrink-0">{formatDuration(t.duration)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
        {totalSeconds > 0 && (
          <div className="px-3 py-1.5 rounded-xl bg-white/5 text-white font-bold text-[13px] flex items-center gap-1.5">
            <span>Total:</span>
            <span>{formatDuration(totalSeconds)}</span>
          </div>
        )}
        {totalSeconds === 0 && (
          <div className="px-3 py-1.5 rounded-xl bg-white/5 text-white/50 font-bold text-[13px]">
            Nenhum foco hoje
          </div>
        )}
      </div>
    </div>
  );
}
