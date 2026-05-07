"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAppStore, AuditEntry } from "@/store/useTimerStore";
import { Trash2, Edit2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function TimeAuditPage() {
  const { auditEntries, addAuditEntry, updateAuditEntry, deleteAuditEntry } = useAppStore();
  
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  const totalUsed = useMemo(() => {
    return auditEntries.reduce((acc, entry) => acc + (entry.hoursPerDay * entry.daysPerWeek), 0);
  }, [auditEntries]);

  const remaining = 168 - totalUsed;
  const progress = Math.min((totalUsed / 168) * 100, 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Por favor, insira um nome para a atividade");
      return;
    }

    const hpd = parseFloat(hoursPerDay);
    const dpw = parseInt(daysPerWeek);

    if (isNaN(hpd) || hpd <= 0 || hpd > 24) {
      toast.error("Horas por dia inválidas (1-24)");
      return;
    }

    if (isNaN(dpw) || dpw <= 0 || dpw > 7) {
      toast.error("Dias por semana inválidos (1-7)");
      return;
    }

    if (editingId) {
      updateAuditEntry(editingId, { name, hoursPerDay: hpd, daysPerWeek: dpw });
      toast.success("Atividade atualizada");
      setEditingId(null);
    } else {
      addAuditEntry(name, hpd, dpw);
      toast.success("Atividade adicionada");
    }

    setName("");
    setHoursPerDay("");
    setDaysPerWeek("");
  };

  const handleEdit = (entry: AuditEntry) => {
    setEditingId(entry.id);
    setName(entry.name);
    setHoursPerDay(entry.hoursPerDay.toString());
    setDaysPerWeek(entry.daysPerWeek.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!mounted) {
    return (
      <div className="flex min-h-full flex-col">
        <header className="flex items-center justify-between px-8 py-5 border-b border-border">
          <div className="h-8 w-48 rounded-xl skeleton" />
        </header>
        <div className="flex-1 px-8 py-6 space-y-6">
          <div className="h-40 rounded-2xl skeleton" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 rounded-2xl skeleton" />
            <div className="h-32 rounded-2xl skeleton" />
            <div className="h-32 rounded-2xl skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 lg:px-8 py-5 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-[-0.02em]">Time Audit</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Calcule sua ocupação semanal baseada em 168 horas
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
        <div className="max-w-[1400px] mx-auto">
          
          {/* Summary Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 p-6 bg-card rounded-2xl border border-border shadow-card relative overflow-hidden group">
              <div className="flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-cyan-glow" strokeWidth={2} />
                    <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Balanço Semanal</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Horas Utilizadas</p>
                      <p className="text-3xl lg:text-4xl font-bold text-foreground tabular-nums tracking-[-0.02em]">{totalUsed}h <span className="text-sm font-normal text-muted-foreground/40">/ 168h</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Horas Disponíveis</p>
                      <p className="text-3xl lg:text-4xl font-bold text-cyan-glow tabular-nums tracking-[-0.02em]">{remaining}h</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Ocupação da semana</span>
                    <span className="text-xs font-medium text-foreground tabular-nums">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 bg-background rounded-full overflow-hidden border border-border/50 shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${progress}%`,
                        background: progress > 100 
                          ? "linear-gradient(90deg, #FF4444, #EF4444)" 
                          : "linear-gradient(90deg, #00F5FF, #00B8D4)",
                        boxShadow: progress > 100 
                          ? "0 0 12px rgba(255, 68, 68, 0.3)" 
                          : "0 0 12px rgba(0, 245, 255, 0.3)",
                      }}
                    />
                  </div>
                  {progress > 100 && (
                    <div className="flex items-center gap-1.5 mt-2.5 text-red-500/90 animate-live">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <p className="text-xs font-medium tracking-tight">Você ultrapassou as 168 horas semanais!</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Decorative background glow */}
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-glow/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-cyan-glow/8 transition-colors duration-500" />
            </div>

            {/* Add Entry Form */}
            <div className="p-6 bg-card rounded-2xl border border-border shadow-card">
              <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-6">
                {editingId ? "Editar Atividade" : "Nova Atividade"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-2xs font-bold text-muted-foreground/60 uppercase tracking-[0.12em] ml-1">Nome</label>
                  <input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Sono, Trabalho, Academia"
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-cyan-glow/40 focus:ring-2 focus:ring-cyan-glow/10 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-2xs font-bold text-muted-foreground/60 uppercase tracking-[0.12em] ml-1">Horas/Dia</label>
                    <input 
                      type="number"
                      step="0.5"
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(e.target.value)}
                      placeholder="8"
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-cyan-glow/40 focus:ring-2 focus:ring-cyan-glow/10 transition-all tabular-nums"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-2xs font-bold text-muted-foreground/60 uppercase tracking-[0.12em] ml-1">Dias/Semana</label>
                    <input 
                      type="number"
                      value={daysPerWeek}
                      onChange={(e) => setDaysPerWeek(e.target.value)}
                      placeholder="7"
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-cyan-glow/40 focus:ring-2 focus:ring-cyan-glow/10 transition-all tabular-nums"
                    />
                  </div>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <button 
                    type="submit" 
                    className="w-full h-11 flex items-center justify-center rounded-xl bg-orange-accent text-foreground font-bold shadow-glow-orange hover:brightness-110 transition-all active:scale-[0.98] text-sm tracking-wide"
                  >
                    {editingId ? "Salvar alterações" : "Adicionar atividade"}
                  </button>
                  {editingId && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingId(null);
                        setName("");
                        setHoursPerDay("");
                        setDaysPerWeek("");
                      }}
                      className="w-full h-10 flex items-center justify-center rounded-xl bg-surface-hover border border-border text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Activity List */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground ml-1">
              Atividades Recorrentes
            </h2>
            
            {auditEntries.length === 0 ? (
              <div className="p-16 border-2 border-dashed border-border/40 rounded-2xl bg-card/20 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center mb-5">
                  <Clock className="w-7 h-7 text-muted-foreground/30" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-foreground">Nenhuma atividade ainda</p>
                <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-[240px]">Adicione suas rotinas semanais para ver o balanço de tempo disponível.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {auditEntries.map((entry) => (
                  <div key={entry.id} className="p-5 bg-card rounded-2xl border border-border shadow-card hover:border-cyan-glow/30 transition-all group cursor-default">
                    <div className="flex justify-between items-start mb-5">
                      <h3 className="font-bold text-foreground group-hover:text-cyan-glow transition-colors tracking-tight">{entry.name}</h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button 
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            deleteAuditEntry(entry.id);
                            toast.success("Atividade removida");
                          }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Rotina</p>
                        <p className="text-sm text-foreground font-semibold mt-1 tabular-nums">
                          {entry.hoursPerDay}h <span className="text-muted-foreground/50 font-normal">×</span> {entry.daysPerWeek}d
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Semanal</p>
                        <p className="text-lg font-bold text-foreground mt-0.5 tabular-nums">
                          {entry.hoursPerDay * entry.daysPerWeek}h
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
