"use client";

import { useState } from "react";
import { Plus, FolderOpen, X } from "lucide-react";
import { useAppStore, GoalPeriod, ProgressItem } from "@/store/useTimerStore";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GoalFormProps {
  onClose: () => void;
  editItem?: ProgressItem;
}

export function GoalForm({ onClose, editItem }: GoalFormProps) {
  const { addProgressItem, updateProgressItem, projects } = useAppStore();
  
  const [projectId, setProjectId] = useState<string | null>(editItem?.projectId || null);
  const [sessionTarget, setSessionTarget] = useState(editItem?.sessionTarget || 1);
  const [durationTarget, setDurationTarget] = useState<number | null>(editItem?.durationTargetMinutes || null);
  const [period, setPeriod] = useState<GoalPeriod>(editItem?.period || "daily");

  const handleSave = () => {
    if (projectId && sessionTarget > 0) {
      if (editItem) {
        updateProgressItem(editItem.id, {
          projectId,
          period,
          sessionTarget,
          durationTargetMinutes: durationTarget,
        });
      } else {
        addProgressItem({
          projectId,
          period,
          sessionTarget,
          durationTargetMinutes: durationTarget,
        });
      }
      onClose();
    }
  };

  const selectedProject = (projects || []).find(p => p.id === projectId);

  return (
    <div className="p-8 rounded-[2rem] bg-card border border-cyan-glow/20 shadow-glow-cyan/5 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
           {editItem ? <Plus className="h-5 w-5 text-cyan-glow" /> : <Plus className="h-5 w-5 text-cyan-glow" />} 
           {editItem ? "Editar Meta do Projeto" : "Definir Meta para Projeto"}
         </h2>
         <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-xl text-muted-foreground transition-colors">
           <X className="h-5 w-5" />
         </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1">Projeto (Obrigatório)</label>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className={cn(
                  "flex items-center gap-3 w-full h-12 rounded-2xl bg-surface-hover/50 border px-4 text-sm font-semibold hover:border-cyan-glow/30 transition-all cursor-pointer",
                  !projectId ? "border-border" : "border-cyan-glow/30"
                )}>
                  {selectedProject ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                      <span className="text-foreground">{selectedProject.name}</span>
                    </>
                  ) : (
                    <>
                      <FolderOpen className="w-4.5 h-4.5 text-muted-foreground/50" />
                      <span className="text-muted-foreground/50">Selecionar projeto</span>
                    </>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-card border-border shadow-elevated">
                {(projects || []).length === 0 ? (
                  <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                    Crie um projeto primeiro
                  </div>
                ) : (
                  (projects || []).map(p => (
                    <DropdownMenuItem key={p.id} onClick={() => setProjectId(p.id)} className="flex items-center gap-2 focus:bg-accent cursor-pointer">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2.5">
            <label htmlFor="goal-sessions" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1">Meta de Sessões</label>
            <div className="flex items-center gap-3">
              <input 
                id="goal-sessions"
                name="goalSessions"
                type="number"
                value={sessionTarget}
                onChange={e => setSessionTarget(parseInt(e.target.value) || 0)}
                className="w-full h-12 rounded-2xl bg-surface-hover/50 border border-border px-4 text-sm font-bold tabular-nums focus:border-cyan-glow/50 outline-none transition-all"
              />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">sessões</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2.5">
            <label htmlFor="goal-duration" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1">Duração por Sessão (Opcional)</label>
            <div className="flex items-center gap-3">
              <input 
                id="goal-duration"
                name="goalDuration"
                type="number"
                placeholder="Sem duração mínima"
                value={durationTarget || ""}
                onChange={e => setDurationTarget(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full h-12 rounded-2xl bg-surface-hover/50 border border-border px-4 text-sm font-bold tabular-nums focus:border-cyan-glow/50 outline-none transition-all"
              />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">minutos</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1">Período</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as GoalPeriod[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "flex-1 h-12 rounded-2xl border text-xs font-bold uppercase tracking-[0.08em] transition-all duration-300 active:scale-[0.96]",
                    period === p 
                      ? "bg-cyan-glow text-black border-cyan-glow shadow-glow-cyan/20" 
                      : "bg-surface-hover/20 border-border/60 text-muted-foreground hover:border-border hover:bg-surface-hover/40"
                  )}
                >
                  {p === 'daily' ? 'Diário' : p === 'weekly' ? 'Semanal' : 'Mensal'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-10 pt-8 border-t border-border/50 flex justify-end gap-3">
        <button 
          onClick={onClose}
          className="px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          disabled={sessionTarget <= 0 || !projectId}
          className="px-10 py-2.5 rounded-2xl bg-cyan-glow text-black text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-glow-cyan active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:brightness-100"
        >
          {editItem ? "Salvar Alterações" : "Salvar Meta"}
        </button>
      </div>
    </div>
  );
}
