"use client";

import React from "react";
import { ActiveTimer } from "@/components/timer/active-timer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  const today = new Date();
  const dateFormatted = format(today, "dd 'de' MMMM, yyyy", { locale: ptBR });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#1A1A1A]">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide h-4">
            {mounted ? dateFormatted : ""}
          </p>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12">
        <ActiveTimer />
      </div>
    </div>
  );
}
