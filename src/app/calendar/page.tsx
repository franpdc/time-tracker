"use client";

import { useState, useEffect } from "react";
import { CalendarView } from "@/components/timer/calendar-view";
import { cn } from "@/lib/utils";
import { AddManualEntryModal } from "@/components/timer/add-manual-entry-modal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("weekly");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-[-0.02em]">Calendário</h1>
          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-[0.1em]">
            {format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddManualEntryModal />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-[1400px] mx-auto h-full">
          <CalendarView 
            onViewModeChange={setViewMode}
            className="h-[calc(100vh-180px)]"
          />
        </div>
      </div>
    </div>
  );
}
