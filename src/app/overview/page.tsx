"use client";

import { useState } from "react";
import { format, subDays, addDays, startOfWeek, endOfWeek, isSameDay, isSameMonth, isWithinInterval, startOfMonth, endOfMonth, startOfDay, subMonths, addMonths, startOfYear, endOfYear, addYears, subYears, eachDayOfInterval, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MoreHorizontal, Trash2, Download, Pencil, Play } from "lucide-react";
import { useAppStore } from "@/store/useTimerStore";
import { formatDuration } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";
import { AddManualEntryModal } from "@/components/timer/add-manual-entry-modal";
import { EditEntryModal } from "@/components/timer/edit-entry-modal";
import { toast } from "sonner";


type ViewMode = "hoje" | "esta-semana" | "este-mes" | "este-ano";

function MiniCalendar({ currentDate, setCurrentDate, setOpen, viewMode }: { currentDate: Date, setCurrentDate: (d: Date) => void, setOpen: (open: boolean) => void, viewMode: ViewMode }) {
  const [calDate, setCalDate] = useState(currentDate);

  if (viewMode === "este-ano") {
    const currentYearNum = currentDate.getFullYear();
    const startYearNum = calDate.getFullYear() - 10;
    const years = Array.from({length: 21}, (_, i) => startYearNum + i);
    
    return (
      <div className="w-[260px] p-2 text-foreground">
        <div className="flex items-center justify-between mb-4 px-2 pt-2">
          <button onClick={() => setCalDate(subYears(calDate, 20))} className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50" aria-label="Anterior"><ChevronLeft className="w-4 h-4"/></button>
          <span className="text-sm font-medium capitalize">{startYearNum} - {startYearNum + 20}</span>
          <button onClick={() => setCalDate(addYears(calDate, 20))} className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50" aria-label="Próximo"><ChevronRight className="w-4 h-4"/></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map(y => {
            const isSelected = y === currentYearNum;
            const isActual = y === new Date().getFullYear();
            return (
               <button
                  key={y}
                  onClick={() => { setCurrentDate(new Date(y, 0, 1)); setOpen(false); }}
                  className={`h-10 rounded-lg flex flex-col items-center justify-center text-sm transition-all duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50
                    ${isSelected ? "bg-cyan-glow text-background font-bold" : "hover:bg-accent text-foreground"}
                  `}
               >
                 <span>{y}</span>
                 {isActual && <span className="text-2xs opacity-70">(atual)</span>}
               </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (viewMode === "este-mes") {
    const yearStart = startOfYear(calDate);
    const months = eachMonthOfInterval({ start: yearStart, end: endOfYear(calDate) });
    const realCurrentMonth = startOfMonth(new Date());

    return (
      <div className="w-[260px] p-2 text-foreground">
        <div className="flex items-center justify-between mb-4 px-2 pt-2">
          <button onClick={() => setCalDate(subYears(calDate, 1))} className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50" aria-label="Ano anterior"><ChevronLeft className="w-4 h-4"/></button>
          <span className="text-sm font-medium capitalize">{format(calDate, "yyyy")}</span>
          <button onClick={() => setCalDate(addYears(calDate, 1))} className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50" aria-label="Próximo ano"><ChevronRight className="w-4 h-4"/></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map(m => {
            const isSelected = isSameMonth(m, currentDate);
            const isActual = isSameMonth(m, realCurrentMonth);
            return (
               <button
                  key={m.toISOString()}
                  onClick={() => { setCurrentDate(m); setOpen(false); }}
                  className={`h-12 rounded-lg flex flex-col items-center justify-center text-xs transition-all duration-200 capitalize active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50
                    ${isSelected ? "bg-cyan-glow text-background font-bold" : "hover:bg-accent text-foreground"}
                  `}
               >
                 <span className="font-medium text-sm">{format(m, "MMM", { locale: ptBR })}</span>
                 {isActual && <span className="text-2xs opacity-70 mt-0.5">(atual)</span>}
               </button>
            )
          })}
        </div>
      </div>
    )
  }

  // "hoje" ou "esta-semana"
  const monthStart = startOfMonth(calDate);
  const monthEnd = endOfMonth(calDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const selectedWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const selectedWeekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  return (
    <div className="w-[260px] p-3 text-foreground">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCalDate(subMonths(calDate, 1))} className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50" aria-label="Mês anterior"><ChevronLeft className="w-4 h-4"/></button>
        <span className="text-sm font-medium capitalize">{format(calDate, "MMMM yyyy", { locale: ptBR })}</span>
        <button onClick={() => setCalDate(addMonths(calDate, 1))} className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50" aria-label="Próximo mês"><ChevronRight className="w-4 h-4"/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S','T','Q','Q','S','S','D'].map((d,i) => <div key={i} className="text-center text-2xs text-muted-foreground/60 font-medium tracking-wider">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(d => {
          const isSelected = viewMode === "esta-semana" 
            ? isWithinInterval(d, { start: selectedWeekStart, end: selectedWeekEnd })
            : isSameDay(d, currentDate);
          const isCurrMonth = isSameMonth(d, monthStart);
          return (
             <button
                key={d.toISOString()}
                onClick={() => { setCurrentDate(d); setOpen(false); }}
                className={`h-8 rounded-lg flex items-center justify-center text-xs transition-all duration-200 tabular-nums active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50
                  ${isSelected ? "bg-cyan-glow text-background font-bold" : "hover:bg-accent text-foreground"}
                  ${!isCurrMonth && !isSelected ? "text-muted-foreground opacity-30" : ""}
                `}
             >
               {format(d, "d")}
             </button>
          )
        })}
      </div>
    </div>
  )
}

interface BreakdownItem {
  name: string;
  color: string;
  value: number;
}



export default function OverviewPage() {
  const { entries, projects, deleteEntry, startTimer, activeTimer, serverOffset } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("hoje");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<typeof entries[0] | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [activeElapsed, setActiveElapsed] = useState(0);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Live timer for active session
  React.useEffect(() => {
    if (activeTimer) {
      const update = () => {
        const now = Date.now() + serverOffset;
        const endedAt = activeTimer.pausedAt || now;
        setActiveElapsed(Math.max(0, Math.floor((endedAt - activeTimer.startedAt) / 1000)));
      };
      update();
      let interval: NodeJS.Timeout | undefined;
      if (!activeTimer.pausedAt) {
        interval = setInterval(update, 1000);
      }
      return () => { if (interval) clearInterval(interval); };
    } else {
      // Use setTimeout to avoid synchronous setState in effect warning if needed, 
      // though here it's cleaner to just not call it if we don't need it.
      // But we DO need to reset it when activeTimer becomes null.
      const timeout = setTimeout(() => setActiveElapsed(0), 0);
      return () => clearTimeout(timeout);
    }
  }, [activeTimer]);

  const getProjectColor = (id: string | null) => projects.find(p => p.id === id)?.color || "#555555";
  const getProjectName = (id: string | null) => projects.find(p => p.id === id)?.name || "Sem Projeto";

  const views: { key: ViewMode; label: string }[] = [
    { key: "hoje", label: "Hoje" },
    { key: "esta-semana", label: "Esta semana" },
    { key: "este-mes", label: "Este mês" },
    { key: "este-ano", label: "Este ano" },
  ];

  const goBack = () => {
    if (viewMode === "hoje") setCurrentDate((d) => subDays(d, 1));
    else if (viewMode === "esta-semana") setCurrentDate((d) => subDays(d, 7));
    else if (viewMode === "este-mes") setCurrentDate((d) => subMonths(d, 1));
    else if (viewMode === "este-ano") setCurrentDate((d) => subYears(d, 1));
  };
  const goForward = () => {
    if (viewMode === "hoje") setCurrentDate((d) => addDays(d, 1));
    else if (viewMode === "esta-semana") setCurrentDate((d) => addDays(d, 7));
    else if (viewMode === "este-mes") setCurrentDate((d) => addMonths(d, 1));
    else if (viewMode === "este-ano") setCurrentDate((d) => addYears(d, 1));
  };

  const dateLabel =
    viewMode === "hoje"
      ? format(currentDate, "dd/MM/yyyy")
      : viewMode === "esta-semana"
        ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM")} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM")}`
        : viewMode === "este-mes"
          ? format(currentDate, "MMMM yyyy", { locale: ptBR })
          : format(currentDate, "yyyy");

  // Filtering entries based on viewMode
  const filteredEntries = entries
    .filter((entry) => {
      const entryDate = new Date(entry.startedAt);
      if (viewMode === "hoje") {
        return isSameDay(entryDate, currentDate);
      } else if (viewMode === "esta-semana") {
        return isWithinInterval(entryDate, {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        });
      } else if (viewMode === "este-mes") {
        return isWithinInterval(entryDate, {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        });
      } else if (viewMode === "este-ano") {
        return isWithinInterval(entryDate, {
          start: startOfYear(currentDate),
          end: endOfYear(currentDate),
        });
      }
      return true;
    })
    .sort((a, b) => b.startedAt - a.startedAt);

  // Derived stats
  const totalSeconds = filteredEntries.reduce((acc, curr) => acc + curr.duration, 0) + 
    (activeTimer && (
      (viewMode === "hoje" && isSameDay(new Date(activeTimer.startedAt), currentDate)) ||
      (viewMode === "esta-semana" && isWithinInterval(new Date(activeTimer.startedAt), { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) })) ||
      (viewMode === "este-mes" && isWithinInterval(new Date(activeTimer.startedAt), { start: startOfMonth(currentDate), end: endOfMonth(currentDate) })) ||
      (viewMode === "este-ano" && isWithinInterval(new Date(activeTimer.startedAt), { start: startOfYear(currentDate), end: endOfYear(currentDate) }))
    ) ? activeElapsed : 0);

  const formatTotal = () => formatDuration(totalSeconds);

  const groupedEntries = Array.from(
    filteredEntries.reduce((acc, entry) => {
      const key = `${entry.taskName.trim().toLowerCase()}-${entry.projectId || 'null'}`;
      if (!acc.has(key)) {
        acc.set(key, { ...entry, sessionsCount: 1 });
      } else {
        const existing = acc.get(key)!;
        existing.duration += entry.duration;
        existing.sessionsCount += 1;
        if (entry.startedAt > existing.startedAt) {
          existing.startedAt = entry.startedAt;
          existing.endedAt = entry.endedAt;
          existing.id = entry.id;
        }
      }
      return acc;
    }, new Map<string, typeof entries[0] & { sessionsCount: number }>())
    .values()
  ).sort((a, b) => b.duration - a.duration);

  const uniqueTasksCount = groupedEntries.length;

  // Project distribution
  const projectDurations: Record<string, number> = {};
  filteredEntries.forEach((e) => {
    const pid = e.projectId || "Sem Projeto";
    projectDurations[pid] = (projectDurations[pid] || 0) + e.duration;
  });

  // Add active timer to project distribution if applicable
  if (activeTimer) {
    const timerDate = new Date(activeTimer.startedAt);
    const isVisible = 
      (viewMode === "hoje" && isSameDay(timerDate, currentDate)) ||
      (viewMode === "esta-semana" && isWithinInterval(timerDate, { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) })) ||
      (viewMode === "este-mes" && isWithinInterval(timerDate, { start: startOfMonth(currentDate), end: endOfMonth(currentDate) })) ||
      (viewMode === "este-ano" && isWithinInterval(timerDate, { start: startOfYear(currentDate), end: endOfYear(currentDate) }));
    
    if (isVisible) {
      const pid = activeTimer.projectId || "Sem Projeto";
      projectDurations[pid] = (projectDurations[pid] || 0) + activeElapsed;
    }
  }

  const topProjectEntry = Object.entries(projectDurations).sort((a, b) => b[1] - a[1])[0];
  const topProjectName = topProjectEntry 
    ? (topProjectEntry[0] === "Sem Projeto" ? "Sem Projeto" : projects.find(p => p.id === topProjectEntry[0])?.name || "Desconhecido")
    : "Nenhum";

  const projectDataForDonut = Object.entries(projectDurations).map(([id, duration]) => ({
    name: getProjectName(id === "Sem Projeto" ? null : id),
    color: getProjectColor(id === "Sem Projeto" ? null : id),
    duration,
  })).sort((a, b) => b.duration - a.duration);

  // Dynamic Bar Chart Data based on viewMode
  const getBreakdown = (dayEntries: typeof entries, activeDuration: number = 0) => {
    const breakdown: Record<string, number> = {};
    dayEntries.forEach(e => {
      const pid = e.projectId || "Sem Projeto";
      breakdown[pid] = (breakdown[pid] || 0) + e.duration;
    });
    
    if (activeDuration > 0 && activeTimer) {
      const pid = activeTimer.projectId || "Sem Projeto";
      breakdown[pid] = (breakdown[pid] || 0) + activeDuration;
    }

    return Object.entries(breakdown).map(([id, val]) => ({
      name: getProjectName(id === "Sem Projeto" ? null : id),
      color: getProjectColor(id === "Sem Projeto" ? null : id),
      value: val
    })).sort((a,b) => b.value - a.value);
  };

  let chartData: { label: string; value: number; breakdown: BreakdownItem[] }[] = [];
  if (viewMode === "hoje") {
    const activeForToday = (activeTimer && isSameDay(new Date(activeTimer.startedAt), currentDate)) ? activeElapsed : 0;
    chartData = [{ label: "Hoje", value: totalSeconds, breakdown: getBreakdown(filteredEntries, activeForToday) }];
  } else if (viewMode === "esta-semana") {
    const days = eachDayOfInterval({
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: endOfWeek(currentDate, { weekStartsOn: 1 })
    });
    chartData = days.map(day => {
      const dayEntries = filteredEntries.filter(e => isSameDay(new Date(e.startedAt), day));
      const activeForDay = (activeTimer && isSameDay(new Date(activeTimer.startedAt), day)) ? activeElapsed : 0;
      const value = dayEntries.reduce((acc, curr) => acc + curr.duration, 0) + activeForDay;
      return { label: format(day, "EEEE", { locale: ptBR }).slice(0, 3), value, breakdown: getBreakdown(dayEntries, activeForDay) };
    });
  } else if (viewMode === "este-mes") {
    const days = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });
    chartData = days.map(day => {
      const dayEntries = filteredEntries.filter(e => isSameDay(new Date(e.startedAt), day));
      const activeForDay = (activeTimer && isSameDay(new Date(activeTimer.startedAt), day)) ? activeElapsed : 0;
      const value = dayEntries.reduce((acc, curr) => acc + curr.duration, 0) + activeForDay;
      return { label: format(day, "dd"), value, breakdown: getBreakdown(dayEntries, activeForDay) };
    });
  } else if (viewMode === "este-ano") {
    const months = eachMonthOfInterval({
      start: startOfYear(currentDate),
      end: endOfYear(currentDate)
    });
    chartData = months.map(month => {
      const monthEntries = filteredEntries.filter(e => isWithinInterval(new Date(e.startedAt), {
          start: startOfMonth(month),
          end: endOfMonth(month)
        }));
      const activeForMonth = (activeTimer && isWithinInterval(new Date(activeTimer.startedAt), {
          start: startOfMonth(month),
          end: endOfMonth(month)
        })) ? activeElapsed : 0;
      const value = monthEntries.reduce((acc, curr) => acc + curr.duration, 0) + activeForMonth;
      return { label: format(month, "MMM", { locale: ptBR }), value, breakdown: getBreakdown(monthEntries, activeForMonth) };
    });
  }

  const maxBarValue = Math.max(...chartData.map((d) => d.value), 1); // Avoid div by 0
  const donutTotal = projectDataForDonut.reduce((acc, p) => acc + p.duration, 0) || 1;

  // Streak calculation (consecutive days with >0 focus time leading up to today)
  const today = startOfDay(new Date());
  let currentStreak = 0;
  
  const daysWithFocus = new Set(
    entries.map(e => startOfDay(new Date(e.startedAt)).getTime())
  );

  for (let i = 0; i < 365; i++) {
    const dateToCheck = startOfDay(subDays(today, i)).getTime();
    if (daysWithFocus.has(dateToCheck)) {
      currentStreak++;
    } else if (i > 0) {
      break; // Stop if it's not today and there's a gap
    }
  }
  const streak = currentStreak;


  return (
    <div className="flex min-h-full flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 lg:px-8 py-5 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-[-0.02em]">Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acompanhe seu foco ao longo do tempo
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground min-h-[40px]">
          {mounted && (
            <>
              <span className="tabular-nums hidden sm:inline">{format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
              <AddManualEntryModal />
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
        {!mounted ? (
          <div className="space-y-4">
            <div className="h-10 rounded-xl skeleton" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-28 rounded-2xl skeleton" />
              <div className="h-28 rounded-2xl skeleton" />
              <div className="h-28 rounded-2xl skeleton" />
              <div className="h-28 rounded-2xl skeleton" />
            </div>
            <div className="h-64 rounded-2xl skeleton" />
            <div className="h-64 rounded-2xl skeleton" />
          </div>
        ) : (
          <>
            {/* View mode tabs */}
            {/* View mode tabs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6 mb-6">
          <div className="flex items-center gap-1 bg-card rounded-xl p-1 border border-border w-full sm:w-auto overflow-x-auto no-scrollbar">
            {views.map((v) => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 ${
                  viewMode === v.key
                    ? "bg-accent text-foreground shadow-card"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={goBack}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-cyan-glow/30 transition-all duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
              aria-label="Período anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger>
                <div className="text-sm text-muted-foreground min-w-[120px] sm:min-w-[150px] text-center font-medium capitalize flex items-center justify-center gap-2 hover:text-foreground transition-colors duration-200 cursor-pointer tabular-nums">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {dateLabel}
                </div>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-auto p-0 bg-card border-border shadow-elevated">
                <MiniCalendar currentDate={currentDate} setCurrentDate={setCurrentDate} setOpen={setIsCalendarOpen} viewMode={viewMode} />
              </PopoverContent>
            </Popover>
            <button
              onClick={goForward}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-cyan-glow/30 transition-all duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
              aria-label="Próximo período"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toggl-style Stats Row */}
        <div className="flex flex-col lg:flex-row w-full items-center justify-between bg-card rounded-2xl border border-border shadow-card p-6 mb-8 gap-6 lg:gap-0">
          <div className="flex flex-col gap-1 w-full lg:w-1/4">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Total de Foco</span>
            <span className="text-2xl lg:text-3xl font-bold text-foreground tracking-[-0.02em] tabular-nums">{formatTotal()}</span>
            <span className="text-xs text-muted-foreground mt-1">tempo {viewMode === "hoje" ? "hoje" : "no período"}</span>
          </div>
          <div className="hidden lg:block w-px h-16 bg-border mx-6 shrink-0"></div>
          <div className="flex flex-col gap-1 w-full lg:w-1/4">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Tarefas Focadas</span>
            <span className="text-2xl lg:text-3xl font-bold text-foreground tracking-[-0.02em] tabular-nums">{uniqueTasksCount}</span>
            <span className="text-xs text-muted-foreground mt-1">tarefas únicas no período</span>
          </div>
          <div className="hidden lg:block w-px h-16 bg-border mx-6 shrink-0"></div>
          <div className="flex flex-col gap-1 w-full lg:w-1/4">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Área Principal</span>
            <span className="text-lg lg:text-xl font-bold text-foreground tracking-[-0.02em] truncate">{topProjectName}</span>
            <span className="text-xs text-muted-foreground mt-1">mais focado</span>
          </div>
          <div className="hidden lg:block w-px h-16 bg-border mx-6 shrink-0"></div>
          <div className="flex flex-col gap-1 w-full lg:w-1/4">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Sequência</span>
            <span className="text-2xl lg:text-3xl font-bold text-foreground tracking-[-0.02em] tabular-nums">{streak} <span className="text-sm font-normal text-muted-foreground/50">dias</span></span>
            <p className="text-xs text-green-live/80 mt-1 flex items-center gap-1">
              <span>↑ dias seguidos</span>
            </p>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-4 mb-8">
          {/* Dynamic Bar Chart */}
          <div className="col-span-1 lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-card overflow-x-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {viewMode === "hoje" ? "Foco do dia" : "Foco ao longo do tempo"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Distribuição de tempo focado
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-glow"></span>
                <span className="text-xs text-muted-foreground">Foco</span>
              </div>
            </div>

            {/* Bar chart area */}
            <div className="flex items-end gap-2" style={{ height: 180 }}>
              {viewMode === "hoje" ? (
                // Special layout for today (one big column + text next to it)
                <div className="flex flex-col lg:flex-row w-full h-full items-center justify-center gap-6 lg:gap-12">
                  <div className="flex flex-col items-center justify-end h-full w-32 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col z-10 bg-popover border border-border text-foreground text-2xs p-2.5 rounded-lg shadow-elevated w-max min-w-[140px]">
                      <div className="font-semibold text-xs border-b border-border pb-1 mb-1 text-center">
                        Hoje
                      </div>
                      <div className="font-medium text-cyan-glow mb-1">
                        Total: {Math.floor(totalSeconds / 3600)}h {Math.floor((totalSeconds % 3600) / 60)}m
                      </div>
                      {chartData[0]?.breakdown && chartData[0].breakdown.length > 0 ? (
                        <div className="flex flex-col gap-1 mt-1">
                          {chartData[0].breakdown.map((b: BreakdownItem, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                                <span className="text-muted-foreground truncate max-w-[80px]">{b.name}</span>
                              </div>
                              <span className="tabular-nums">
                                {Math.floor(b.value / 3600)}h {Math.floor((b.value % 3600) / 60)}m
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground/60 text-center mt-1">Sem foco</div>
                      )}
                    </div>
                    <div
                      className="w-full rounded-t-xl transition-all duration-300 group-hover:brightness-125"
                      style={{
                        height: totalSeconds > 0 ? 160 : 2, // Force max height since it's the only column
                        backgroundColor: totalSeconds > 0 ? "rgba(0, 245, 255, 0.8)" : "rgba(42, 42, 42, 0.5)",
                        boxShadow: totalSeconds > 0 ? "0 0 12px rgba(0, 245, 255, 0.3)" : "none",
                      }}
                    />
                    <span className="text-sm font-medium text-foreground mt-3 shrink-0">Hoje</span>
                  </div>
                  <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                    <span className="text-[10px] lg:text-xs text-muted-foreground uppercase tracking-widest mb-1">Total acumulado</span>
                    <span className="text-3xl lg:text-5xl font-bold text-cyan-glow tabular-nums">{formatTotal()}</span>
                    <span className="text-xs lg:text-sm text-muted-foreground/50 mt-1">horas focadas</span>
                  </div>
                </div>
              ) : (
                // Standard Bar Chart for Week/Month/Year
                chartData.map((d, i) => {
                  const barHeight = d.value > 0 ? Math.max((d.value / maxBarValue) * 160, 4) : 2;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-[20px]"
                    >
                      <div className="group relative w-full flex items-end justify-center">
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col z-10 bg-popover border border-border text-foreground text-2xs p-2.5 rounded-lg shadow-elevated w-max min-w-[140px]">
                          <div className="font-semibold text-xs border-b border-border pb-1 mb-1 text-center">
                            {d.label}
                          </div>
                          <div className="font-medium text-cyan-glow mb-1">
                            Total: {Math.floor(d.value / 3600)}h {Math.floor((d.value % 3600) / 60)}m
                          </div>
                          {d.breakdown && d.breakdown.length > 0 ? (
                            <div className="flex flex-col gap-1 mt-1">
                              {d.breakdown.map((b: BreakdownItem, idx: number) => (
                                <div key={idx} className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                                    <span className="text-muted-foreground truncate max-w-[80px]">{b.name}</span>
                                  </div>
                                  <span className="tabular-nums">
                                    {Math.floor(b.value / 3600)}h {Math.floor((b.value % 3600) / 60)}m
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-muted-foreground/60 text-center mt-1">Sem foco</div>
                          )}
                        </div>
                        <div
                          className="w-full max-w-[40px] rounded-t-md transition-all duration-300 group-hover:brightness-125"
                          style={{
                            height: barHeight,
                            backgroundColor: d.value > 0 ? "rgba(0, 245, 255, 0.8)" : "rgba(42, 42, 42, 0.5)",
                            boxShadow: d.value > 0 ? "0 0 8px rgba(0, 245, 255, 0.2)" : "none",
                          }}
                        />
                      </div>
                      <span className="text-2xs text-muted-foreground/50 shrink-0 truncate max-w-full capitalize">{d.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Donut chart - Distribution by project */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Distribuição por projeto
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Tempo por área
            </p>

            {/* Donut SVG */}
            <div className="flex justify-center mb-6">
              <div className="relative w-[160px] h-[160px]">
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                  {projectDataForDonut.length === 0 ? (
                    <circle
                      cx="80"
                      cy="80"
                      r="60"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="16"
                    />
                  ) : (
                    (() => {
                      let offset = 0;
                      const radius = 60;
                      const circ = 2 * Math.PI * radius;
                      return projectDataForDonut.map((p, i) => {
                        const pct = p.duration / donutTotal;
                        const dash = pct * circ;
                        const el = (
                          <circle
                            key={i}
                            cx="80"
                            cy="80"
                            r={radius}
                            fill="none"
                            stroke={p.color}
                            strokeWidth="16"
                            strokeDasharray={`${dash} ${Math.max(circ - dash, 0)}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                          />
                        );
                        offset += dash;
                        return el;
                      });
                    })()
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">
                    {formatTotal()}
                  </span>
                  <span className="text-2xs text-muted-foreground">Total</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2">
              {projectDataForDonut.length === 0 && (
                <div className="text-xs text-center text-muted-foreground">Sem dados no período</div>
              )}
              {projectDataForDonut.map((p, i) => {
                const pTotalHours = Math.floor(p.duration / 3600);
                const pTotalMins = Math.floor((p.duration % 3600) / 60);
                const pFormat = `${String(pTotalHours).padStart(2, "0")}:${String(pTotalMins).padStart(2, "0")}`;

                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-xs text-muted-foreground truncate max-w-[100px]">{p.name}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground shrink-0">
                      {pFormat}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contribution Heatmap for Year View */}
        {viewMode === "este-ano" && (() => {
          const yearStart = startOfYear(currentDate);
          const yearEnd = endOfYear(currentDate);
          const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });
          const dayDurations = new Map<string, number>();
          filteredEntries.forEach(e => {
            const key = format(new Date(e.startedAt), "yyyy-MM-dd");
            dayDurations.set(key, (dayDurations.get(key) || 0) + e.duration);
          });
          const maxDaySeconds = Math.max(...Array.from(dayDurations.values()), 1);
          const getIntensity = (seconds: number) => {
            if (seconds === 0) return "bg-muted border border-border";
            const pct = seconds / maxDaySeconds;
            if (pct < 0.25) return "bg-cyan-glow/20 border border-cyan-glow/10";
            if (pct < 0.5) return "bg-cyan-glow/40 border border-cyan-glow/20";
            if (pct < 0.75) return "bg-cyan-glow/60 border border-cyan-glow/30";
            return "bg-cyan-glow/90 border border-cyan-glow/50";
          };
          // Group by weeks
          const weeks: Date[][] = [];
          let currentWeek: Date[] = [];
          allDays.forEach((d, i) => {
            currentWeek.push(d);
            if (d.getDay() === 0 || i === allDays.length - 1) {
              weeks.push(currentWeek);
              currentWeek = [];
            }
          });

          return (
            <div className="bg-card rounded-2xl p-6 border border-border shadow-card mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Mapa de contribuições</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Consistência ao longo do ano</p>
                </div>
                <div className="flex items-center gap-1.5 text-2xs text-muted-foreground/70 font-medium">
                  <span>Menos</span>
                  <span className="w-[10px] h-[10px] rounded-[2px] bg-muted border border-border" />
                  <span className="w-[10px] h-[10px] rounded-[2px] bg-cyan-glow/20" />
                  <span className="w-[10px] h-[10px] rounded-[2px] bg-cyan-glow/40" />
                  <span className="w-[10px] h-[10px] rounded-[2px] bg-cyan-glow/60" />
                  <span className="w-[10px] h-[10px] rounded-[2px] bg-cyan-glow/90" />
                  <span>Mais</span>
                </div>
              </div>
              <div className="flex gap-[3px] overflow-x-auto pb-2">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map(d => {
                      const key = format(d, "yyyy-MM-dd");
                      const secs = dayDurations.get(key) || 0;
                      const label = `${format(d, "dd/MM")}: ${secs > 0 ? formatDuration(secs) : "Sem foco"}`;
                      return (
                        <div
                          key={key}
                          className={`w-[14px] h-[14px] rounded-[3px] ${getIntensity(secs)} transition-all duration-150 ease-out cursor-default group/cell relative hover:scale-[1.4] hover:z-10 hover:ring-2 hover:ring-cyan-glow/40 hover:ring-offset-1 hover:ring-offset-card`}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:flex bg-popover text-popover-foreground text-2xs px-2.5 py-1.5 rounded-lg shadow-elevated border border-border whitespace-nowrap z-50 font-medium tabular-nums">
                            {label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Focus log table */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Onde você focou
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Detalhamento de sessões de foco do período
              </p>
            </div>
            <button
              onClick={() => {
                if (filteredEntries.length === 0) {
                  toast.error("Nenhuma sessão para exportar");
                  return;
                }
                const header = "Data,Hora Início,Hora Fim,Tarefa,Projeto,Duração (min)\n";
                const rows = filteredEntries.map(e => {
                  const proj = projects.find(p => p.id === e.projectId)?.name || "Sem Projeto";
                  return `${format(new Date(e.startedAt), "dd/MM/yyyy")},${format(new Date(e.startedAt), "HH:mm")},${format(new Date(e.endedAt), "HH:mm")},"${e.taskName}","${proj}",${Math.round(e.duration / 60)}`;
                }).join("\n");
                const blob = new Blob([header + rows], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `focustrack-${format(new Date(), "yyyy-MM-dd")}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success(`${filteredEntries.length} sessões exportadas`);
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-cyan-glow hover:text-cyan-glow/80 transition-colors duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 rounded-md px-2 py-1 -mx-2 -my-1"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[600px] lg:min-w-0">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 pb-3">
                    Último Foco
                  </th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 pb-3">
                    Projeto
                  </th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 pb-3">
                    Tarefa
                  </th>
                  <th className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 pb-3">
                    Duração
                  </th>
                </tr>
              </thead>
            <tbody className="divide-y divide-border/50">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground/50" strokeWidth={1.6} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nenhuma sessão neste período</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">Tente outro intervalo ou comece um foco agora.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                groupedEntries.map((entry) => {
                  const dFormat = formatDuration(entry.duration);

                  return (
                    <tr key={entry.id} className="group hover:bg-surface-hover transition-colors duration-150">
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              startTimer(entry.taskName, entry.projectId);
                              toast("Timer iniciado", { description: entry.taskName });
                            }}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-transparent text-muted-foreground hover:text-orange-accent hover:bg-orange-accent/10 transition-all duration-200 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-accent/40"
                            title="Continuar"
                            aria-label="Continuar"
                          >
                            <Play className="h-3 w-3 ml-0.5" fill="currentColor" />
                          </button>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.startedAt), "dd/MM HH:mm")}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getProjectColor(entry.projectId) }} />
                          <span className="text-sm text-foreground">{getProjectName(entry.projectId)}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                        <div className="flex items-center gap-2">
                          <span>{entry.taskName}</span>
                          {entry.sessionsCount > 1 && (
                            <span className="inline-flex items-center justify-center rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                              {entry.sessionsCount} sessões
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-sm text-foreground text-right font-medium pr-2 tabular-nums">
                        <div className="flex items-center justify-end gap-3">
                          <span>{dFormat}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all duration-300 ease-out cursor-pointer focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/40" aria-label="Mais ações">
                                <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
                              </button>
                            } />
                            <DropdownMenuContent align="end" className="w-32 bg-card border-border">
                              <DropdownMenuItem
                                onClick={() => setEditingEntry(entry)}
                                className="focus:bg-accent cursor-pointer flex items-center gap-2"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm("Excluir esta sessão de foco?")) {
                                    deleteEntry(entry.id);
                                    toast.success("Sessão excluída");
                                  }
                                }}
                                className="text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={3} className="pt-3 pl-2 text-sm font-semibold text-foreground">Total do Período</td>
                  <td className="pt-3 pr-2 text-sm font-bold text-cyan-glow text-right tabular-nums">
                    {formatTotal()}
                  </td>
                </tr>
              </tfoot>
            )}
            </table>
          </div>
        </div>

        {/* Edit Entry Modal — rendered outside the dropdown to avoid nesting conflicts */}
        {editingEntry && (
          <EditEntryModal
            entry={editingEntry}
            open={!!editingEntry}
            onOpenChange={(open) => {
              if (!open) setEditingEntry(null);
            }}
          />
        )}
      </>
    )}
  </div>
</div>
  );
}
