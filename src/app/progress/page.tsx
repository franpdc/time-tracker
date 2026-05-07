"use client";

import { useState, useEffect } from "react";
import { Plus, Target, FolderOpen, X } from "lucide-react";
import { useAppStore, GoalPeriod } from "@/store/useTimerStore";
import { ProgressCard } from "@/components/progress/progress-card";
import { ProgressModal } from "@/components/progress/progress-modal";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProgressPage() {
  const { progressItems, addProgressItem, projects } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const [isAdding, setIsAdding] = useState(false);
  const [newItemProjectId, setNewItemProjectId] = useState<string | null>(null);
  const [newItemSessionTarget, setNewItemSessionTarget] = useState(1);
  const [newItemDurationTarget, setNewItemDurationTarget] = useState<number | null>(null);
  const [newItemPeriod, setNewItemPeriod] = useState<GoalPeriod>("daily");

  const handleCreate = () => {
    if (newItemProjectId && newItemSessionTarget > 0) {
      addProgressItem({
        projectId: newItemProjectId,
        period: newItemPeriod,
        sessionTarget: newItemSessionTarget,
        durationTargetMinutes: newItemDurationTarget,
      });
      setNewItemProjectId(null);
      setNewItemSessionTarget(1);
      setNewItemDurationTarget(null);
      setIsAdding(false);
      toast.success("Meta de projeto definida!");
    }
  };

  const selectedItem = (progressItems || []).find(i => i.id === selectedItemId);
  const selectedProject = (projects || []).find(p => p.id === newItemProjectId);

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-[-0.02em]">Progresso</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Defina e acompanhe metas para seus projetos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-glow px-4 py-2 text-sm font-bold text-[#0D0D0D] hover:brightness-110 transition-all duration-200 active:scale-[0.98] shadow-[0_0_16px_rgba(0,245,255,0.2)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Nova meta de projeto
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {!mounted ? (
          <div className="max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-32 rounded-2xl skeleton" />
            <div className="h-32 rounded-2xl skeleton" />
            <div className="h-32 rounded-2xl skeleton" />
          </div>
        ) : (
          <div className="max-w-6xl">
            
            {/* Create Inline Form */}
            {isAdding && (
              <div className="mb-10 p-8 rounded-[2rem] bg-card border border-cyan-glow/20 shadow-glow-cyan/5 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                     <Plus className="h-5 w-5 text-cyan-glow" /> Definir Meta para Projeto
                   </h2>
                   <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-surface-hover rounded-xl text-muted-foreground transition-colors">
                     <X className="h-5 w-5" />
                   </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1">Projeto (Obrigatório)</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <div className={cn(
                            "flex items-center gap-3 w-full h-12 rounded-2xl bg-surface-hover/50 border px-4 text-sm font-semibold hover:border-cyan-glow/30 transition-all cursor-pointer",
                            !newItemProjectId ? "border-border" : "border-cyan-glow/30"
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
                              <DropdownMenuItem key={p.id} onClick={() => setNewItemProjectId(p.id)} className="flex items-center gap-2 focus:bg-accent cursor-pointer">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                {p.name}
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1">Meta de Sessões</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          value={newItemSessionTarget}
                          onChange={e => setNewItemSessionTarget(parseInt(e.target.value) || 0)}
                          className="w-full h-12 rounded-2xl bg-surface-hover/50 border border-border px-4 text-sm font-bold tabular-nums focus:border-cyan-glow/50 outline-none transition-all"
                        />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">sessões</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1">Duração por Sessão (Opcional)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          placeholder="Sem duração mínima"
                          value={newItemDurationTarget || ""}
                          onChange={e => setNewItemDurationTarget(e.target.value ? parseInt(e.target.value) : null)}
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
                            onClick={() => setNewItemPeriod(p)}
                            className={cn(
                              "flex-1 h-12 rounded-2xl border text-xs font-bold uppercase tracking-[0.08em] transition-all duration-300 active:scale-[0.96]",
                              newItemPeriod === p 
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
                    onClick={() => setIsAdding(false)}
                    className="px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreate}
                    disabled={newItemSessionTarget <= 0 || !newItemProjectId}
                    className="px-10 py-2.5 rounded-2xl bg-cyan-glow text-black text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-glow-cyan active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:brightness-100"
                  >
                    Salvar Meta
                  </button>
                </div>
              </div>
            )}

            {/* List of Progress Items */}
            {(progressItems || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(progressItems || []).map(item => (
                  <ProgressCard 
                    key={item.id} 
                    item={item} 
                    onClick={() => setSelectedItemId(item.id)}
                  />
                ))}
              </div>
            ) : !isAdding && (
              <div className="text-center py-24 border-2 border-dashed border-border/60 rounded-[3rem] bg-card/20 group hover:bg-card/30 hover:border-cyan-glow/20 transition-all duration-500">
                <div className="flex justify-center mb-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-surface-hover shadow-sm group-hover:scale-110 transition-transform duration-500">
                    <Target className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground">Defina metas de projeto</h3>
                <p className="text-sm text-muted-foreground/60 mt-3 max-w-sm mx-auto leading-relaxed">
                  Crie metas para monitorar quanto tempo você dedica a cada projeto. O progresso é atualizado automaticamente.
                </p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="mt-10 inline-flex items-center gap-3 rounded-[1.25rem] bg-cyan-glow text-black px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98] shadow-glow-cyan"
                >
                  <Plus className="h-4 w-4" strokeWidth={3} />
                  Criar Primeira Meta
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <ProgressModal 
          item={selectedItem}
          isOpen={!!selectedItemId}
          onOpenChange={(open) => !open && setSelectedItemId(null)}
        />
      )}
    </div>
  );
}
