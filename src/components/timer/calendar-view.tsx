"use client";

import { useState, useEffect, useRef } from "react";
import { format, startOfWeek, addDays, isSameDay, getHours, getMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppStore, TimeEntry } from "@/store/useTimerStore";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditEntryModal } from "./edit-entry-modal";
import { AddManualEntryModal } from "./add-manual-entry-modal";

export function CalendarView({ 
  onViewModeChange,
  className
}: { 
  onViewModeChange?: (mode: "daily" | "weekly") => void;
  className?: string;
}) {
  const { entries, projects, activeTimer } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [isEditingActive, setIsEditingActive] = useState(false);
  const [addEntryData, setAddEntryData] = useState<{ date: string; startTime: string } | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [activeElapsed, setActiveElapsed] = useState(0);

  // Live timer for active session
  useEffect(() => {
    if (activeTimer) {
      const update = () => {
        const endedAt = activeTimer.pausedAt || Date.now();
        setActiveElapsed(Math.max(0, Math.floor((endedAt - activeTimer.startedAt) / 1000)));
      };
      update();
      let interval: NodeJS.Timeout | undefined;
      if (!activeTimer.pausedAt) {
        interval = setInterval(update, 1000);
      }
      return () => { if (interval) clearInterval(interval); };
    } else {
      const timeout = setTimeout(() => setActiveElapsed(0), 0);
      return () => clearTimeout(timeout);
    }
  }, [activeTimer]);
  
  // Zoom levels: pixels per minute
  // 0.4 = 24px/h (24h view), 0.7 = 42px/h, 1.1 = 66px/h, 1.8 = 108px/h, 2.6 = 156px/h, 3.8 = 228px/h (15m detail)
  const zoomLevels = [0.4, 0.7, 1.1, 1.8, 2.6, 3.8];
  const [zoomIndex, setZoomIndex] = useState(1);
  const pixelsPerMinute = zoomLevels[zoomIndex];
  const hourHeight = pixelsPerMinute * 60;

  const handleViewModeChange = (mode: "daily" | "weekly") => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

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
    <div className={cn("bg-card border border-border rounded-2xl shadow-premium overflow-hidden flex flex-col h-[70vh] min-h-[600px] transition-all duration-500 ease-in-out", className)}>
      <div className="flex flex-col lg:flex-row items-center justify-between p-4 border-b border-border bg-surface-hover/50 gap-4">
        <div className="flex items-center justify-between lg:justify-start w-full lg:w-auto gap-2">
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

        <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto gap-4">
          <div className="flex items-center bg-background p-1 rounded-lg border border-border">
            <button
              onClick={() => handleViewModeChange("daily")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === "daily" 
                  ? "bg-card text-foreground shadow-premium border border-border" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Diário
            </button>
            <button
              onClick={() => handleViewModeChange("weekly")}
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
            <div className="flex items-center px-1 min-w-[70px] justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 tabular-nums">
                {zoomIndex === 0 && "24h"}
                {zoomIndex === 1 && "12h"}
                {zoomIndex === 2 && "8h"}
                {zoomIndex === 3 && "4h"}
                {zoomIndex === 4 && "2h"}
                {zoomIndex === 5 && "Focus"}
              </span>
            </div>
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
                const activeForThisDay = (activeTimer && isSameDay(new Date(activeTimer.startedAt), day)) ? activeElapsed : 0;
                const dayTotal = dayEntries.reduce((acc, curr) => acc + curr.duration, 0) + activeForThisDay;

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
                const isActiveDay = activeTimer && isSameDay(new Date(activeTimer.startedAt), day);

                return (
                  <div 
                    key={day.toISOString()} 
                    className="flex-1 border-r border-border/50 relative hover:bg-surface-hover/10 transition-colors group/col"
                    onClick={(e) => {
                      // Only trigger if clicking on the background, not on an existing entry
                      if (e.target === e.currentTarget) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const totalMinutes = y / pixelsPerMinute;
                        const hours = Math.floor(totalMinutes / 60);
                        // Round to nearest 15 minutes
                        const minutes = Math.floor((totalMinutes % 60) / 15) * 15;
                        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        
                        setAddEntryData({
                          date: format(day, "yyyy-MM-dd"),
                          startTime: timeStr
                        });
                      }
                    }}
                  >
                    {/* Visual hint for clicking to add */}
                    <div className="absolute inset-0 opacity-0 group-hover/col:opacity-100 pointer-events-none transition-opacity flex items-center justify-center">
                      <div className="bg-cyan-glow/10 border border-cyan-glow/20 rounded-full p-2">
                        <Plus className="w-5 h-5 text-cyan-glow" strokeWidth={1.5} />
                      </div>
                    </div>

                    {/* Active Timer Block */}
                    {isActiveDay && (
                      <div
                        onClick={() => setIsEditingActive(true)}
                        className="absolute left-[2px] right-[2px] rounded-md border overflow-hidden z-10 transition-all duration-300 cursor-pointer hover:brightness-110 active:scale-[0.99]"
                        style={{
                          top: (getHours(new Date(activeTimer.startedAt)) * 60 + getMinutes(new Date(activeTimer.startedAt))) * pixelsPerMinute,
                          height: Math.max((activeElapsed / 60) * pixelsPerMinute, 15),
                          backgroundColor: `${getProjectColor(activeTimer.projectId)}25`,
                          borderColor: `${getProjectColor(activeTimer.projectId)}50`,
                          borderLeftWidth: '3px',
                          borderLeftColor: getProjectColor(activeTimer.projectId),
                        }}
                      >
                        <div className="px-1.5 py-1 flex flex-col h-full overflow-hidden relative">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-foreground truncate leading-tight">
                              {activeTimer.taskName || "Foco atual"}
                            </span>
                          </div>
                          {activeElapsed >= 120 && (
                            <span className="text-[9px] text-foreground/70 font-medium tabular-nums">
                              {formatDuration(activeElapsed)} • Ao vivo
                            </span>
                          )}
                          {/* Animated background stripes for active state */}
                          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[stripe_2s_linear_infinite]" />
                        </div>
                      </div>
                    )}

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

      {isEditingActive && activeTimer && (
        <EditEntryModal
          activeTimer={activeTimer}
          isLive={true}
          open={isEditingActive}
          onOpenChange={setIsEditingActive}
        />
      )}

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          open={!!editingEntry}
          onOpenChange={(open) => {
            if (!open) setEditingEntry(null);
          }}
        />
      )}

      {addEntryData && (
        <AddManualEntryModal
          key={`${addEntryData.date}-${addEntryData.startTime}`}
          open={!!addEntryData}
          onOpenChange={(open) => {
            if (!open) setAddEntryData(null);
          }}
          initialDate={addEntryData.date}
          initialStartTime={addEntryData.startTime}
        />
      )}
    </div>
  );
}
