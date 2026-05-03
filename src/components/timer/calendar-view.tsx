"use client";

import { useState, useEffect, useRef } from "react";
import { format, startOfWeek, addDays, isSameDay, getHours, getMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppStore, TimeEntry } from "@/store/useTimerStore";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { EditEntryModal } from "./edit-entry-modal";

export function CalendarView() {
  const { entries, projects } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("weekly");
  
  // Zoom levels: pixels per minute
  // 1px/min = 60px/hour. 1.5px/min = 90px/hour. 2px/min = 120px/hour.
  const zoomLevels = [0.8, 1.2, 1.8];
  const [zoomIndex, setZoomIndex] = useState(1);
  const pixelsPerMinute = zoomLevels[zoomIndex];
  const hourHeight = pixelsPerMinute * 60;

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekDays = viewMode === "weekly"
    ? Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))
    : [currentDate];

  const goBack = () => setCurrentDate(prev => addDays(prev, -7));
  const goForward = () => setCurrentDate(prev => addDays(prev, 7));

  // Get current time line
  const now = new Date();
  const showCurrentTimeLine = weekDays.some(d => isSameDay(d, now));
  const currentTimeTop = showCurrentTimeLine 
    ? (getHours(now) * 60 + getMinutes(now)) * pixelsPerMinute
    : 0;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && currentTimeTop > 0) {
      // Scroll to current time minus 100px so it's vertically centered-ish
      scrollRef.current.scrollTop = Math.max(0, currentTimeTop - 100);
    }
  }, [currentTimeTop]);

  const getProjectColor = (id?: string | null) => {
    if (!id) return "var(--muted)";
    return projects.find((p) => p.id === id)?.color || "var(--muted)";
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-premium overflow-hidden flex flex-col h-[70vh] min-h-[600px]">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-border bg-surface-hover/50 gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold text-foreground min-w-[140px] text-center capitalize">
            {viewMode === "weekly" 
              ? `${format(weekStart, "dd MMM", { locale: ptBR })} - ${format(addDays(weekStart, 6), "dd MMM", { locale: ptBR })}`
              : format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
          </div>
          <button
            onClick={goForward}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-background p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === "daily" 
                  ? "bg-card text-foreground shadow-premium border border-border" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Diário
            </button>
            <button
              onClick={() => setViewMode("weekly")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === "weekly" 
                  ? "bg-card text-foreground shadow-premium border border-border" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semanal
            </button>
          </div>

          <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-border">
            <button
              onClick={() => setZoomIndex(Math.max(0, zoomIndex - 1))}
              disabled={zoomIndex === 0}
              className="p-1.5 rounded-md hover:bg-accent disabled:opacity-50 text-muted-foreground transition-colors"
              title="Diminuir Zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="w-px h-4 bg-border"></div>
            <button
              onClick={() => setZoomIndex(Math.min(zoomLevels.length - 1, zoomIndex + 1))}
              disabled={zoomIndex === zoomLevels.length - 1}
              className="p-1.5 rounded-md hover:bg-accent disabled:opacity-50 text-muted-foreground transition-colors"
              title="Aumentar Zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-auto bg-background/50 relative scroll-smooth">
        <div className={`flex ${viewMode === "weekly" ? "min-w-[800px]" : "w-full"}`}>
          
          {/* Time axis (Y) */}
          <div className="w-16 flex-shrink-0 border-r border-border bg-card sticky left-0 z-20">
            <div className="h-12 border-b border-border sticky top-0 bg-card z-30"></div> {/* Header spacer */}
            <div className="relative" style={{ height: 24 * hourHeight }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-full flex justify-end pr-2 text-2xs text-muted-foreground font-medium -mt-2.5"
                  style={{ top: i * hourHeight }}
                >
                  {i.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Days axis (X) and Grid */}
          <div className="flex-1 flex flex-col">
            
            {/* Header: Days */}
            <div className="flex border-b border-border sticky top-0 bg-card z-10">
              {weekDays.map(day => {
                const isToday = isSameDay(day, now);
                // Calculate day total
                const dayEntries = entries.filter(e => isSameDay(new Date(e.startedAt), day));
                const dayTotal = dayEntries.reduce((acc, curr) => acc + curr.duration, 0);

                return (
                  <div key={day.toISOString()} className="flex-1 h-12 border-r border-border/50 flex flex-col justify-center items-center px-2">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'text-cyan-glow' : 'text-muted-foreground'}`}>
                        {format(day, "eee", { locale: ptBR })}
                      </span>
                      <span className={`text-lg font-bold ${isToday ? 'text-foreground' : 'text-foreground/80'}`}>
                        {format(day, "dd")}
                      </span>
                    </div>
                    {dayTotal > 0 && (
                      <span className="text-[10px] text-muted-foreground font-medium">{formatDuration(dayTotal)}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grid Area */}
            <div className="flex relative" style={{ height: 24 * hourHeight }}>
              
              {/* Horizontal grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-full border-t border-border/40 absolute"
                    style={{ top: i * hourHeight }}
                  ></div>
                ))}
              </div>

              {/* Current time line */}
              {showCurrentTimeLine && (
                <div 
                  className="absolute left-0 right-0 border-t-2 border-red-500/80 z-10 pointer-events-none"
                  style={{ top: currentTimeTop }}
                >
                  <div className="absolute -left-[5px] -top-[5px] w-[8px] h-[8px] rounded-full bg-red-500/80"></div>
                </div>
              )}

              {/* Day Columns */}
              {weekDays.map(day => {
                const dayEntries = entries.filter(e => isSameDay(new Date(e.startedAt), day));

                return (
                  <div key={day.toISOString()} className="flex-1 border-r border-border/50 relative">
                    {/* Blocks */}
                    {dayEntries.map(entry => {
                      const startDate = new Date(entry.startedAt);
                      const top = (getHours(startDate) * 60 + getMinutes(startDate)) * pixelsPerMinute;
                      const height = Math.max((entry.duration / 60) * pixelsPerMinute, 15); // min 15px height
                      const color = getProjectColor(entry.projectId);

                      return (
                        <div
                          key={entry.id}
                          onClick={() => setEditingEntry(entry)}
                          className="absolute left-[2px] right-[2px] rounded-md border overflow-hidden group cursor-pointer hover:brightness-125 hover:z-20 transition-all"
                          style={{
                            top,
                            height,
                            backgroundColor: `${color}15`,
                            borderColor: `${color}40`,
                            borderLeftWidth: '3px',
                            borderLeftColor: color,
                            zIndex: 5
                          }}
                          title={`${entry.taskName}\n${formatDuration(entry.duration)}`}
                        >
                          <div className="px-1.5 py-1 flex flex-col h-full overflow-hidden">
                            <span className="text-[10px] font-semibold text-foreground truncate leading-tight group-hover:text-cyan-glow transition-colors">
                              {entry.taskName}
                            </span>
                            {height >= 40 && (
                              <span className="text-[9px] text-foreground/60 font-medium mt-0.5 tabular-nums">
                                {format(startDate, "HH:mm")} • {formatDuration(entry.duration)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          open={!!editingEntry}
          onOpenChange={(open) => {
            if (!open) setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
}
