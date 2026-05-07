"use client";

import { History } from "lucide-react";
import { DailyLogCard } from "./daily-log-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DailyLogPopover() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border hover:border-cyan-glow/30 hover:bg-surface-hover transition-all duration-300 ease-out active:scale-[0.96] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
            title="Ver log diário"
          >
            <History className="w-3.5 h-3.5 text-muted-foreground group-hover:text-cyan-glow transition-colors duration-300" strokeWidth={1.5} />
            <span className="text-2xs text-muted-foreground group-hover:text-foreground transition-colors duration-300">
              Log Diário
            </span>
          </button>
        }
      />
      <PopoverContent align="start" className="w-[400px] p-0 border-none bg-transparent shadow-2xl">
        <DailyLogCard />
      </PopoverContent>
    </Popover>
  );
}
