"use client";

import { useState, useEffect } from "react";
import { Plus, Target, FolderOpen, X } from "lucide-react";
import { useAppStore, GoalPeriod } from "@/store/useTimerStore";
import { ProgressCard } from "@/components/progress/progress-card";
import { ProgressModal } from "@/components/progress/progress-modal";
import { GoalForm } from "@/components/progress/goal-form";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProgressPage() {
  const { progressItems, projects } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const [isAdding, setIsAdding] = useState(false);

  const selectedItem = (progressItems || []).find(i => i.id === selectedItemId);

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between px-4 lg:px-8 py-5 border-b border-border gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-[-0.02em]">Progresso</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Defina e acompanhe metas para seus projetos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdding(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-xl bg-cyan-glow px-4 py-2 text-sm font-bold text-[#0D0D0D] hover:brightness-110 transition-all duration-200 active:scale-[0.98] shadow-[0_0_16px_rgba(0,245,255,0.2)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span className="whitespace-nowrap">Nova meta de projeto</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 lg:py-8">
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
              <div className="mb-10">
                <GoalForm onClose={() => setIsAdding(false)} />
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
