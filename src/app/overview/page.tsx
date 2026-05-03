"use client";

import { useState } from "react";
import { format, subDays, addDays, startOfWeek, endOfWeek, isSameDay, isSameMonth, isWithinInterval, startOfMonth, endOfMonth, startOfDay, subMonths, addMonths, startOfYear, endOfYear, addYears, subYears, eachDayOfInterval, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, MoreHorizontal, Trash2, Download, Pencil } from "lucide-react";
import { useAppStore } from "@/store/useTimerStore";
import { formatDuration } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useEffect } from "react";
import { AddManualEntryModal } from "@/components/timer/add-manual-entry-modal";
import { EditEntryModal } from "@/components/timer/edit-entry-modal";


type ViewMode = "hoje" | "esta-semana" | "este-mes" | "este-ano";

function MiniCalendar({ currentDate, setCurrentDate, setOpen, viewMode }: { currentDate: Date, setCurrentDate: (d: Date) => void, setOpen: (open: boolean) => void, viewMode: ViewMode }) {
  const [calDate, setCalDate] = useState(currentDate);

  if (viewMode === "este-ano") {
    const currentYearNum = currentDate.getFullYear();
    const startYearNum = calDate.getFullYear() - 10;
    const years = Array.from({length: 21}, (_, i) => startYearNum + i);
    
    return (
      <div className="w-[260px] p-2 text-white">
        <div className="flex items-center justify-between mb-4 px-2 pt-2">
          <button onClick={() => setCalDate(subYears(calDate, 20))} className="p-1 hover:bg-[#2A2A2A] rounded"><ChevronLeft className="w-4 h-4"/></button>
          <span className="text-sm font-medium capitalize">{startYearNum} - {startYearNum + 20}</span>
          <button onClick={() => setCalDate(addYears(calDate, 20))} className="p-1 hover:bg-[#2A2A2A] rounded"><ChevronRight className="w-4 h-4"/></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map(y => {
            const isSelected = y === currentYearNum;
            const isActual = y === new Date().getFullYear();
            return (
               <button
                  key={y}
                  onClick={() => { setCurrentDate(new Date(y, 0, 1)); setOpen(false); }}
                  className={`h-10 rounded-md flex flex-col items-center justify-center text-sm transition-colors
                    ${isSelected ? "bg-cyan-glow text-black font-bold" : "hover:bg-[#2A2A2A]"}
                  `}
               >
                 <span>{y}</span>
                 {isActual && <span className="text-[9px] opacity-70">(atual)</span>}
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
      <div className="w-[260px] p-2 text-white">
        <div className="flex items-center justify-between mb-4 px-2 pt-2">
          <button onClick={() => setCalDate(subYears(calDate, 1))} className="p-1 hover:bg-[#2A2A2A] rounded"><ChevronLeft className="w-4 h-4"/></button>
          <span className="text-sm font-medium capitalize">{format(calDate, "yyyy")}</span>
          <button onClick={() => setCalDate(addYears(calDate, 1))} className="p-1 hover:bg-[#2A2A2A] rounded"><ChevronRight className="w-4 h-4"/></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map(m => {
            const isSelected = isSameMonth(m, currentDate);
            const isActual = isSameMonth(m, realCurrentMonth);
            return (
               <button
                  key={m.toISOString()}
                  onClick={() => { setCurrentDate(m); setOpen(false); }}
                  className={`h-12 rounded-md flex flex-col items-center justify-center text-xs transition-colors capitalize
                    ${isSelected ? "bg-cyan-glow text-black font-bold" : "hover:bg-[#2A2A2A]"}
                  `}
               >
                 <span className="font-medium text-sm">{format(m, "MMM", { locale: ptBR })}</span>
                 {isActual && <span className="text-[9px] opacity-70 mt-0.5">(atual)</span>}
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
    <div className="w-[260px] p-3 text-white">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCalDate(subMonths(calDate, 1))} className="p-1 hover:bg-[#2A2A2A] rounded"><ChevronLeft className="w-4 h-4"/></button>
        <span className="text-sm font-medium capitalize">{format(calDate, "MMMM yyyy", { locale: ptBR })}</span>
        <button onClick={() => setCalDate(addMonths(calDate, 1))} className="p-1 hover:bg-[#2A2A2A] rounded"><ChevronRight className="w-4 h-4"/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S','T','Q','Q','S','S','D'].map((d,i) => <div key={i} className="text-center text-[10px] text-muted-foreground">{d}</div>)}
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
                className={`h-8 rounded-md flex items-center justify-center text-xs transition-colors
                  ${isSelected ? "bg-cyan-glow text-black font-bold" : "hover:bg-[#2A2A2A]"}
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

const formatLogDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m} min`;
};

export default function OverviewPage() {
  const { entries, projects, deleteEntry } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("hoje");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<typeof entries[0] | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
  const totalSeconds = filteredEntries.reduce((acc, curr) => acc + curr.duration, 0);
  const formatTotal = () => formatDuration(totalSeconds);

  const sessionsCount = filteredEntries.length;

  // Project distribution
  const projectDurations: Record<string, number> = {};
  filteredEntries.forEach((e) => {
    const pid = e.projectId || "Sem Projeto";
    projectDurations[pid] = (projectDurations[pid] || 0) + e.duration;
  });

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
  const getBreakdown = (dayEntries: typeof entries) => {
    const breakdown: Record<string, number> = {};
    dayEntries.forEach(e => {
      const pid = e.projectId || "Sem Projeto";
      breakdown[pid] = (breakdown[pid] || 0) + e.duration;
    });
    return Object.entries(breakdown).map(([id, val]) => ({
      name: getProjectName(id === "Sem Projeto" ? null : id),
      color: getProjectColor(id === "Sem Projeto" ? null : id),
      value: val
    })).sort((a,b) => b.value - a.value);
  };

  let chartData: { label: string; value: number; breakdown: BreakdownItem[] }[] = [];
  if (viewMode === "hoje") {
    chartData = [{ label: "Hoje", value: totalSeconds, breakdown: getBreakdown(filteredEntries) }];
  } else if (viewMode === "esta-semana") {
    const days = eachDayOfInterval({
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: endOfWeek(currentDate, { weekStartsOn: 1 })
    });
    chartData = days.map(day => {
      const dayEntries = filteredEntries.filter(e => isSameDay(new Date(e.startedAt), day));
      const value = dayEntries.reduce((acc, curr) => acc + curr.duration, 0);
      return { label: format(day, "EEEE", { locale: ptBR }).slice(0, 3), value, breakdown: getBreakdown(dayEntries) };
    });
  } else if (viewMode === "este-mes") {
    const days = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });
    chartData = days.map(day => {
      const dayEntries = filteredEntries.filter(e => isSameDay(new Date(e.startedAt), day));
      const value = dayEntries.reduce((acc, curr) => acc + curr.duration, 0);
      return { label: format(day, "dd"), value, breakdown: getBreakdown(dayEntries) };
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
      const value = monthEntries.reduce((acc, curr) => acc + curr.duration, 0);
      return { label: format(month, "MMM", { locale: ptBR }), value, breakdown: getBreakdown(monthEntries) };
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
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#1A1A1A]">
        <div>
          <h1 className="text-xl font-bold text-white">Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acompanhe seu foco ao longo do tempo
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground min-h-[40px]">
          {mounted && (
            <>
              <span>{format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
              <AddManualEntryModal />
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {!mounted ? (
          <div className="flex items-center justify-center h-64">
             <div className="animate-spin h-8 w-8 border-4 border-cyan-glow border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* View mode tabs */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-1 bg-[#1A1A1A] rounded-xl p-1">
            {views.map((v) => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  viewMode === v.key
                    ? "bg-[#242424] text-white"
                    : "text-[#666666] hover:text-[#999999]"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={goBack}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A1A1A] text-muted-foreground hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger>
                <div className="text-sm text-muted-foreground min-w-[150px] text-center font-medium capitalize flex items-center justify-center gap-2 hover:text-white transition-colors cursor-pointer">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {dateLabel}
                </div>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-auto p-0 bg-[#1A1A1A] border-[#2A2A2A]">
                <MiniCalendar currentDate={currentDate} setCurrentDate={setCurrentDate} setOpen={setIsCalendarOpen} viewMode={viewMode} />
              </PopoverContent>
            </Popover>
            <button
              onClick={goForward}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A1A1A] text-muted-foreground hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats and Log row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-8">
          {/* Stats cards grid */}
          <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#2A2A2A]">
              <p className="text-xs text-muted-foreground mb-1">Total de foco</p>
              <p className="text-3xl font-bold text-cyan-glow tracking-tight">
                {formatTotal()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">tempo {viewMode === "hoje" ? "hoje" : "no período"}</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#2A2A2A]">
              <p className="text-xs text-muted-foreground mb-1">Sessões</p>
              <p className="text-3xl font-bold text-white tracking-tight">{sessionsCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">sessões de foco</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#2A2A2A]">
              <p className="text-xs text-muted-foreground mb-1">Área principal</p>
              <p className="text-3xl font-bold text-white tracking-tight truncate">{topProjectName}</p>
              <p className="text-[11px] text-muted-foreground mt-1">mais focado</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#2A2A2A]">
              <p className="text-xs text-muted-foreground mb-1">Sequência</p>
              <p className="text-3xl font-bold text-white tracking-tight">{streak}</p>
              <p className="text-[11px] text-green-live mt-1 flex items-center gap-1">
                <span>↑ dias seguidos</span>
              </p>
            </div>
          </div>

          {/* Log Card */}
          <div className="xl:col-span-2 bg-[#1A1A1A] rounded-2xl p-5 border border-[#2A2A2A] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {viewMode === "hoje" ? "Log Diário" : 
                 viewMode === "esta-semana" ? "Log da Semana" :
                 viewMode === "este-mes" ? "Log do Mês" : "Log do Ano"}
              </h3>
              
              <span className="text-sm font-medium text-muted-foreground">
                {viewMode === "hoje" ? format(currentDate, "dd/MM") : dateLabel}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {projectDataForDonut.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 italic">Nenhuma atividade registrada hoje.</p>
              ) : (
                <>
                  {projectDataForDonut.map((p, i) => (
                    <div 
                      key={i} 
                      className="px-3 py-1.5 rounded-xl border flex items-center gap-2"
                      style={{ 
                        backgroundColor: `${p.color}10`, 
                        borderColor: `${p.color}25` 
                      }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: p.color }}>
                        {p.name}: {formatLogDuration(p.duration)}
                      </span>
                    </div>
                  ))}
                  <div className="px-3 py-1.5 rounded-xl bg-[#242424] border border-[#333333] flex items-center">
                    <span className="text-[10px] font-bold text-[#999999] uppercase tracking-wider">
                      Total: <span className="text-white">{formatLogDuration(totalSeconds)}</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Dynamic Bar Chart */}
          <div className="col-span-2 bg-[#1A1A1A] rounded-2xl p-6 border border-[#2A2A2A] overflow-x-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {viewMode === "hoje" ? "Foco do dia" : "Foco ao longo do tempo"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Distribuição de tempo focado
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-glow"></span>
                <span className="text-[11px] text-muted-foreground">Foco</span>
              </div>
            </div>

            {/* Bar chart area */}
            <div className="flex items-end gap-2" style={{ height: 180 }}>
              {viewMode === "hoje" ? (
                // Special layout for today (one big column + text next to it)
                <div className="flex w-full h-full items-center justify-center gap-12">
                  <div className="flex flex-col items-center justify-end h-full w-32 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col z-10 bg-[#2A2A2A] border border-[#333333] text-white text-[10px] p-2 rounded shadow-xl w-max min-w-[120px]">
                      <div className="font-semibold text-xs border-b border-[#333333] pb-1 mb-1 text-center">
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
                                <span className="text-[#999999] truncate max-w-[80px]">{b.name}</span>
                              </div>
                              <span className="tabular-nums">
                                {Math.floor(b.value / 3600)}h {Math.floor((b.value % 3600) / 60)}m
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[#666666] text-center mt-1">Sem foco</div>
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
                    <span className="text-sm font-medium text-white mt-3 shrink-0">Hoje</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total acumulado</span>
                    <span className="text-5xl font-bold text-cyan-glow tabular-nums">{formatTotal()}</span>
                    <span className="text-sm text-[#555555] mt-1">horas focadas</span>
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
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col z-10 bg-[#2A2A2A] border border-[#333333] text-white text-[10px] p-2 rounded shadow-xl w-max min-w-[120px]">
                          <div className="font-semibold text-xs border-b border-[#333333] pb-1 mb-1 text-center">
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
                                    <span className="text-[#999999] truncate max-w-[80px]">{b.name}</span>
                                  </div>
                                  <span className="tabular-nums">
                                    {Math.floor(b.value / 3600)}h {Math.floor((b.value % 3600) / 60)}m
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[#666666] text-center mt-1">Sem foco</div>
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
                      <span className="text-[10px] text-[#555555] shrink-0 truncate max-w-full capitalize">{d.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Donut chart - Distribution by project */}
          <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#2A2A2A]">
            <h3 className="text-sm font-semibold text-white mb-1">
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
                      stroke="#2A2A2A"
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
                  <span className="text-2xl font-bold text-white">
                    {formatTotal()}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Total</span>
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
                    <span className="text-xs font-medium text-white shrink-0">
                      {pFormat}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Focus log table */}
        <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#2A2A2A]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Onde você focou
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Detalhamento de sessões de foco do período
              </p>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-medium text-cyan-glow hover:text-cyan-glow/80 transition-colors">
              <Download className="h-3.5 w-3.5" />
              Exportar
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[#555555] pb-3">
                  Data/Hora
                </th>
                <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[#555555] pb-3">
                  Projeto
                </th>
                <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[#555555] pb-3">
                  Tarefa
                </th>
                <th className="text-right text-[11px] font-medium uppercase tracking-wider text-[#555555] pb-3">
                  Duração
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]/50">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma sessão de foco neste período.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const dFormat = formatDuration(entry.duration);

                  return (
                    <tr key={entry.id} className="group hover:bg-[#1E1E1E] transition-colors">
                      <td className="py-3 text-xs text-muted-foreground pl-2">
                        {format(new Date(entry.startedAt), "dd/MM HH:mm")}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getProjectColor(entry.projectId) }} />
                          <span className="text-sm text-white">{getProjectName(entry.projectId)}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {entry.taskName}
                      </td>
                      <td className="py-3 text-sm text-white text-right font-medium pr-2 tabular-nums">
                        <div className="flex items-center justify-end gap-3">
                          <span>{dFormat}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-[#2A2A2A] hover:text-white transition-all cursor-pointer" />
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32 bg-[#1A1A1A] border-[#2A2A2A]">
                              <DropdownMenuItem
                                onClick={() => setEditingEntry(entry)}
                                className="focus:bg-[#242424] cursor-pointer flex items-center gap-2"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm("Excluir esta sessão de foco?")) deleteEntry(entry.id);
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
                <tr className="border-t border-[#2A2A2A]">
                  <td colSpan={3} className="pt-3 pl-2 text-sm font-semibold text-white">Total do Período</td>
                  <td className="pt-3 pr-2 text-sm font-bold text-cyan-glow text-right tabular-nums">
                    {formatTotal()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
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
