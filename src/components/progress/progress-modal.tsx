"use client";

import { useState, useEffect } from "react";
import { 
  ProgressItem, 
  useAppStore, 
  ProgressStats
} from "@/store/useTimerStore";
import { 
  Plus, 
  X, 
  Target, 
  Lightbulb, 
  Trash2, 
  Edit2,
  FileText,
  MessageSquare,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ProgressModalProps {
  item: ProgressItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProgressModal({ item, isOpen, onOpenChange }: ProgressModalProps) {
  const { 
    projects, 
    entries,
    updateProgressItem, 
    addMotivation, 
    removeMotivation, 
    calculateProgress,
    deleteProgressItem,
    addSessionLog,
    updateSessionLog,
  } = useAppStore();

  const [isEditingBehavior, setIsEditingBehavior] = useState(false);
  const [editedBehavior, setEditedBehavior] = useState(item.behaviorDescription || "");

  const [newMotivation, setNewMotivation] = useState("");
  const [stats, setStats] = useState<ProgressStats>({
    sessionsCompleted: 0,
    totalTrackedDuration: 0,
    remainingDurationForCurrentGoal: 0,
    isCompleted: false
  });

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogContent, setEditingLogContent] = useState("");

  const project = (projects || []).find(p => p.id === item.projectId);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(calculateProgress(item.id));
    const interval = setInterval(() => {
      setStats(calculateProgress(item.id));
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateProgress, item.id]);

  const handleUpdateBehavior = () => {
    updateProgressItem(item.id, { 
      behaviorDescription: editedBehavior.trim() 
    });
    setIsEditingBehavior(false);
    toast.success("Comportamento atualizado");
  };

  const periodLabel = {
    daily: "por dia",
    weekly: "por semana",
    monthly: "por mês"
  }[item.period];

  const displayProgress = item.targetUnit === 'sessions' 
    ? Math.floor(stats.sessionsCompleted) 
    : Math.round(stats.sessionsCompleted * 10) / 10;

  // Get relevant sessions for the current period
  const getPeriodRange = () => {
    const now = new Date();
    if (item.period === "daily") return { start: startOfDay(now), end: endOfDay(now) };
    if (item.period === "weekly") return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    return { start: startOfMonth(now), end: endOfMonth(now) };
  };

  const range = getPeriodRange();
  const projectSessions = entries
    .filter(e => e.projectId === item.projectId && e.startedAt >= range.start.getTime() && e.startedAt <= range.end.getTime())
    .sort((a, b) => b.startedAt - a.startedAt);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 bg-card border-border overflow-hidden rounded-[2.5rem] shadow-elevated">
        <ScrollArea className="h-full max-h-[90vh]">
          <div className="p-10">
            
            {/* Header Section */}
            <div className="mb-12 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  {project && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />}
                  <h2 className={cn(
                    "text-2xl font-bold tracking-tight",
                    stats.isCompleted ? "text-muted-foreground line-through decoration-muted-foreground/40" : "text-foreground"
                  )}>
                    {project?.name || "Projeto"}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/70">
                  <Target className="h-4 w-4 text-cyan-glow/60" />
                  <span>Meta: {item.sessionTarget} {item.sessionTarget === 1 ? 'sessão' : 'sessões'} {item.durationTargetMinutes ? `de ${item.durationTargetMinutes}min ` : ''}{periodLabel}</span>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-4xl font-bold tabular-nums tracking-tighter",
                  stats.isCompleted ? "text-green-live" : "text-cyan-glow"
                )}>
                  {displayProgress}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                  {stats.isCompleted ? "Meta Atingida" : "Sessões Concluídas"}
                </p>
              </div>
            </div>

            <div className="space-y-12">
              
              {/* Section 1: Behavior */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" /> Comportamento
                  </h3>
                  {!isEditingBehavior && (
                    <button 
                      onClick={() => {
                        setEditedBehavior(item.behaviorDescription || "");
                        setIsEditingBehavior(true);
                      }}
                      className="p-1 text-muted-foreground hover:text-cyan-glow transition-all"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {isEditingBehavior ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <textarea 
                      autoFocus
                      value={editedBehavior}
                      onChange={e => setEditedBehavior(e.target.value)}
                      placeholder="Descreva o comportamento ideal para este projeto..."
                      className="w-full min-h-[80px] p-5 rounded-2xl bg-surface-hover/50 border border-border text-sm focus:border-cyan-glow/50 outline-none transition-all resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsEditingBehavior(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-accent transition-all">Cancelar</button>
                      <button onClick={handleUpdateBehavior} className="px-5 py-2 rounded-xl bg-cyan-glow text-black text-xs font-bold hover:brightness-110 transition-all shadow-glow-cyan">Salvar</button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsEditingBehavior(true)}
                    className="group cursor-pointer p-6 rounded-3xl bg-card border border-border hover:border-cyan-glow/20 transition-all min-h-[60px] flex items-center"
                  >
                    {item.behaviorDescription ? (
                      <p className="text-sm text-foreground/80 leading-relaxed italic">
                        &quot;{item.behaviorDescription}&quot;
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/40 italic">
                        Clique para descrever o comportamento ideal...
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* Section 2: Motivation */}
              <section className="space-y-5">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5" /> Por que agir?
                </h3>
                <div className="space-y-3">
                  {(item.motivations || []).map((m) => (
                    <div key={m.id} className="group flex items-center gap-4 px-6 py-4 rounded-3xl bg-surface-hover/30 border border-transparent hover:border-border transition-all duration-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-glow shrink-0 shadow-[0_0_8px_rgba(0,245,255,0.4)]" />
                      <span className="text-sm text-foreground/90 font-medium flex-1">{m.text}</span>
                      <button 
                        onClick={() => removeMotivation(item.id, m.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all rounded-lg hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-3 mt-4">
                    <input 
                      placeholder="Adicionar um motivo inspirador..."
                      value={newMotivation}
                      onChange={e => setNewMotivation(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newMotivation.trim()) {
                          addMotivation(item.id, newMotivation.trim());
                          setNewMotivation("");
                        }
                      }}
                      className="flex-1 h-12 rounded-[1.25rem] bg-transparent border border-dashed border-border px-6 text-sm focus:border-cyan-glow/50 focus:border-solid outline-none transition-all placeholder:text-muted-foreground/30"
                    />
                    <button 
                      onClick={() => {
                        if (newMotivation.trim()) {
                          addMotivation(item.id, newMotivation.trim());
                          setNewMotivation("");
                        }
                      }}
                      className="p-3.5 bg-accent hover:bg-surface-hover rounded-[1.25rem] text-muted-foreground transition-all hover:text-foreground"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Section 3: Progress Log */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" /> Log de Progresso
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                    {projectSessions.length} sessões registradas
                  </span>
                </div>

                <div className="space-y-4">
                  {projectSessions.length > 0 ? (
                    projectSessions.map(session => {
                      const log = (item.sessionLogs || []).find(l => l.linkedSessionId === session.id);
                      const isMeetingDuration = !item.durationTargetMinutes || session.duration >= item.durationTargetMinutes * 60;

                      return (
                        <div key={session.id} className="p-6 rounded-[2rem] bg-card border border-border shadow-sm hover:border-border/80 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                               <p className="text-sm font-bold text-foreground capitalize">
                                 {format(new Date(session.startedAt), "eeee, dd 'de' MMMM", { locale: ptBR })}
                               </p>
                               <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                 <div className="flex items-center gap-1">
                                   <Clock className="h-3 w-3" />
                                   <span>{format(new Date(session.startedAt), "HH:mm")}</span>
                                 </div>
                                 <div className={cn(
                                   "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                   isMeetingDuration ? "bg-green-live/10 text-green-live" : "bg-orange-accent/10 text-orange-accent"
                                 )}>
                                   {formatDuration(session.duration)}
                                 </div>
                               </div>
                            </div>
                            
                            {editingLogId !== session.id && (
                              <button 
                                onClick={() => {
                                  setEditingLogId(session.id);
                                  setEditingLogContent(log?.content || "");
                                }}
                                className="p-2 text-muted-foreground hover:text-cyan-glow hover:bg-cyan-glow/5 rounded-xl transition-all"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {editingLogId === session.id ? (
                             <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                               <textarea 
                                 autoFocus
                                 value={editingLogContent}
                                 onChange={e => setEditingLogContent(e.target.value)}
                                 placeholder="O que funcionou hoje? O que pode melhorar?"
                                 className="w-full min-h-[100px] p-5 rounded-2xl bg-surface-hover/30 border border-border text-sm focus:border-cyan-glow/50 outline-none transition-all resize-none"
                               />
                               <div className="flex justify-end gap-2">
                                 <button 
                                   onClick={() => setEditingLogId(null)} 
                                   className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-accent transition-all"
                                 >
                                   Cancelar
                                 </button>
                                 <button 
                                   onClick={() => {
                                     if (log) {
                                       updateSessionLog(item.id, log.id, editingLogContent);
                                     } else {
                                       addSessionLog(item.id, session.id, editingLogContent);
                                     }
                                     setEditingLogId(null);
                                     toast.success("Reflexão salva");
                                   }} 
                                   className="px-5 py-2 rounded-xl bg-cyan-glow text-black text-xs font-bold hover:brightness-110 transition-all shadow-glow-cyan"
                                 >
                                   Salvar
                                 </button>
                               </div>
                             </div>
                          ) : (
                            <div className="bg-surface-hover/20 rounded-2xl p-4 min-h-[60px] border border-transparent group-hover:border-border/40 transition-all">
                              {log?.content ? (
                                <p className="text-sm text-foreground/70 leading-relaxed">
                                  {log.content}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground/40 italic flex items-center justify-center h-full pt-2">
                                  Nenhuma reflexão adicionada
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 border-2 border-dashed border-border/60 rounded-[2.5rem] flex flex-col items-center justify-center text-center px-8">
                       <MessageSquare className="h-8 w-8 text-muted-foreground/20 mb-4" />
                       <p className="text-sm font-bold text-muted-foreground/60 mb-1">Nenhuma sessão {periodLabel}</p>
                       <p className="text-xs text-muted-foreground/40 max-w-[200px]">Comece a rastrear tempo no projeto para ver suas sessões aqui.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Danger Zone */}
              <section className="pt-10 border-t border-border/50 mt-12 pb-2">
                 <button 
                   onClick={() => {
                     if (confirm("Excluir esta meta de projeto?")) {
                       deleteProgressItem(item.id);
                       onOpenChange(false);
                       toast.error("Meta excluída");
                     }
                   }}
                   className="flex items-center gap-2 text-[10px] font-bold text-destructive/40 hover:text-destructive transition-colors uppercase tracking-widest"
                 >
                   <Trash2 className="h-4 w-4" /> Excluir Meta de Projeto
                 </button>
              </section>

            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
