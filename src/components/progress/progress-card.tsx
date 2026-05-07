"use client";

import { ProgressItem, useAppStore, ProgressStats } from "@/store/useTimerStore";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface ProgressCardProps {
  item: ProgressItem;
  onClick: () => void;
}

export function ProgressCard({ item, onClick }: ProgressCardProps) {
  const calculateProgress = useAppStore((state) => state.calculateProgress);
  const projects = useAppStore((state) => state.projects);
  const [stats, setStats] = useState<ProgressStats>({
    sessionsCompleted: 0,
    totalTrackedDuration: 0,
    remainingDurationForCurrentGoal: 0,
    isCompleted: false
  });

  const project = (projects || []).find(p => p.id === item.projectId);

  useEffect(() => {
    // Initial calculation
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(calculateProgress(item.id));
    
    // Refresh periodically for active timers
    const interval = setInterval(() => {
      setStats(calculateProgress(item.id));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [calculateProgress, item.id]);

  const periodLabel = {
    daily: "Diária",
    weekly: "Semanal",
    monthly: "Mensal"
  }[item.period];

  const progressPercentage = Math.min((stats.sessionsCompleted / item.sessionTarget) * 100, 100);

  const formatRemaining = (seconds: number) => {
    if (seconds <= 0) return null;
    const mins = Math.ceil(seconds / 60);
    if (mins < 60) return `${mins}min restantes`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}min restantes` : `${hours}h restantes`;
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all duration-300 hover:border-cyan-glow/30 hover:shadow-[0_0_20px_rgba(0,245,255,0.05)] active:scale-[0.98] rounded-2xl border-border/60",
        stats.isCompleted && "bg-card/60"
      )}
    >
      <CardContent className="pt-5 pb-5 flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            {project && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />}
            <h3
              className={cn(
                "text-sm font-semibold tracking-tight transition-all duration-300 line-clamp-1",
                stats.isCompleted ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"
              )}
            >
              {project?.name || "Projeto Excluído"}
            </h3>
          </div>
          {stats.isCompleted && (
             <div className="h-1.5 w-1.5 rounded-full bg-green-live animate-live shadow-[0_0_8px_rgba(0,230,118,0.5)]" />
          )}
        </div>
        
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-bold tabular-nums tracking-tight",
              stats.isCompleted ? "text-muted-foreground" : "text-foreground"
            )}>
              {Math.floor(stats.sessionsCompleted)}
            </span>
            <span className="text-sm text-muted-foreground/60 font-medium">
              de {item.sessionTarget} {item.sessionTarget === 1 ? 'sessão' : 'sessões'}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider leading-none">
            <span>Meta {periodLabel}</span>
            {item.durationTargetMinutes && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/20" />
                <span>{item.durationTargetMinutes}min cada</span>
              </>
            )}
            {stats.remainingDurationForCurrentGoal > 0 && !stats.isCompleted && (
               <>
                 <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/20" />
                 <span className="text-cyan-glow/60">{formatRemaining(stats.remainingDurationForCurrentGoal)}</span>
               </>
            )}
          </div>
        </div>
        
        {/* Progress Bar Container */}
        <div className="h-1 w-full bg-accent/30 rounded-full overflow-hidden mt-1">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              stats.isCompleted ? "bg-green-live" : "bg-cyan-glow"
            )}
            style={{
              width: `${progressPercentage}%`,
              boxShadow: stats.isCompleted 
                ? "0 0 10px rgba(0, 230, 118, 0.4)" 
                : "0 0 10px rgba(0, 245, 255, 0.3)"
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
