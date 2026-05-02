"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, BarChart3, FolderOpen, PanelLeftClose, PanelLeftOpen, Play } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store/useTimerStore";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Overview", href: "/overview", icon: BarChart3 },
  { name: "Projetos", href: "/projetos", icon: FolderOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { activeTimer } = useAppStore();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-[#1A1A1A] bg-[#111111] py-6 transition-all duration-300",
        isCollapsed ? "w-[80px] items-center" : "w-[220px] px-4"
      )}
    >
      {/* Collapse button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-4 right-[-14px] flex h-7 w-7 items-center justify-center rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-muted-foreground hover:text-white transition-colors z-50"
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-3.5 w-3.5" />
        ) : (
          <PanelLeftClose className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Logo */}
      <div className={cn("mb-10 flex items-center gap-2.5", isCollapsed ? "justify-center" : "px-2")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-accent">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 2L12 8L4 14V2Z" fill="#0D0D0D" />
          </svg>
        </div>
        {!isCollapsed && (
          <span className="text-lg font-bold tracking-tight text-white line-clamp-1">
            FocusTrack
          </span>
        )}
      </div>

      {/* Navigation label */}
      {!isCollapsed && (
        <p className="mb-3 px-2 text-[11px] font-medium uppercase tracking-widest text-[#555555]">
          Menu
        </p>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 w-full">
        {navigation.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-xl py-2.5 font-medium transition-all duration-200",
                isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : "gap-3 px-3 w-full",
                isActive
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#666666] hover:bg-[#1A1A1A]/50 hover:text-[#999999]"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  "shrink-0 transition-colors",
                  isCollapsed ? "h-[22px] w-[22px]" : "h-[18px] w-[18px]",
                  isActive ? "text-cyan-glow" : "text-[#555555] group-hover:text-[#777777]"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {!isCollapsed && <span className="text-sm">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile / Mini Timer */}
      <div className={cn("mt-auto border-t border-[#1A1A1A] pt-4 w-full", isCollapsed ? "flex justify-center" : "")}>
        {(activeTimer && pathname !== "/") ? (
          <Link href="/" className={cn("flex items-center gap-3 rounded-xl bg-cyan-glow/10 border border-cyan-glow/20 transition-all hover:bg-cyan-glow/20", isCollapsed ? "p-2 justify-center" : "px-3 py-2.5")}>
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D0D0D] border border-cyan-glow/50">
              <span className="absolute flex h-2 w-2 top-0 right-0">
                <span className="animate-live absolute inline-flex h-full w-full rounded-full bg-green-live opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-live"></span>
              </span>
              <Play className="h-3.5 w-3.5 text-cyan-glow ml-0.5" fill="currentColor" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white truncate">{activeTimer.taskName || "Foco ativo"}</span>
                <span className="text-[11px] text-cyan-glow font-bold tabular-nums">Em andamento...</span>
              </div>
            )}
          </Link>
        ) : (
          <div className={cn("flex items-center gap-3 rounded-xl", isCollapsed ? "p-0" : "px-2 py-2")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-glow/30 to-cyan-glow/10 text-sm font-bold text-cyan-glow">
              F
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white truncate">Francisco</span>
                <span className="text-[11px] text-[#555555] truncate">Logado</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
