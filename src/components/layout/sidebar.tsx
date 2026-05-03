"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, BarChart3, FolderOpen, PanelLeftClose, PanelLeftOpen, Play, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store/useTimerStore";
import { useTheme } from "next-themes";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Overview", href: "/overview", icon: BarChart3 },
  { name: "Projetos", href: "/projetos", icon: FolderOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { activeTimer } = useAppStore();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-sidebar py-6 transition-all duration-300 ease-out",
        isCollapsed ? "w-[80px] items-center" : "w-[220px] px-4"
      )}
    >
      {/* Collapse button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-4 right-[-14px] flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-cyan-glow/40 transition-all duration-300 ease-out active:scale-[0.96] z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
        aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
        ) : (
          <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
      </button>

      {/* Logo */}
      <div className={cn("mb-10 flex items-center gap-2.5", isCollapsed ? "justify-center" : "px-2")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-accent shadow-[0_0_16px_rgba(255,107,0,0.25)]">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 2L12 8L4 14V2Z" fill="#0D0D0D" />
          </svg>
        </div>
        {!isCollapsed && (
          <span className="text-lg font-bold tracking-[-0.02em] text-foreground line-clamp-1">
            FocusTrack
          </span>
        )}
      </div>

      {/* Navigation label */}
      {!isCollapsed && (
        <p className="mb-3 px-2 text-2xs font-medium uppercase tracking-[0.18em] text-muted-foreground/50">
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
                "group flex items-center rounded-xl py-2.5 font-medium transition-all duration-300 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50",
                isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : "gap-3 px-3 w-full",
                isActive
                  ? "bg-accent/80 text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  "shrink-0 transition-all duration-300 ease-out",
                  isCollapsed ? "h-5 w-5" : "h-4 w-4",
                  isActive ? "text-cyan-glow" : "text-muted-foreground/60 group-hover:text-foreground group-hover:scale-105"
                )}
                strokeWidth={isActive ? 2 : 1.5}
              />
              {!isCollapsed && <span className="text-sm">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className={cn("mb-3 w-full", isCollapsed ? "flex justify-center" : "px-1")}>
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center rounded-xl transition-all duration-300 ease-out text-muted-foreground hover:text-foreground hover:bg-accent/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50",
            isCollapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2 w-full"
          )}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
        >
          {theme === "dark" ? (
            <Sun className="shrink-0 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" strokeWidth={1.5} />
          ) : (
            <Moon className="shrink-0 h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" strokeWidth={1.5} />
          )}
          {!isCollapsed && <span className="text-sm">{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>}
        </button>
      </div>

      {/* User Profile / Mini Timer */}
      <div className={cn("mt-auto border-t border-border pt-4 w-full", isCollapsed ? "flex justify-center" : "")}>
        {(activeTimer && pathname !== "/") ? (
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 rounded-xl bg-cyan-glow/10 border border-cyan-glow/20 transition-all duration-200 hover:bg-cyan-glow/15 hover:border-cyan-glow/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50",
              isCollapsed ? "p-2 justify-center" : "px-3 py-2.5"
            )}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border border-cyan-glow/50">
              <span className="absolute flex h-2 w-2 top-0 right-0">
                <span className="animate-live absolute inline-flex h-full w-full rounded-full bg-green-live opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-live"></span>
              </span>
              <Play className="h-3.5 w-3.5 text-cyan-glow ml-0.5" fill="currentColor" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-foreground truncate">{activeTimer.taskName || "Foco ativo"}</span>
                <span className="text-2xs text-cyan-glow font-semibold tabular-nums tracking-wide">Em andamento</span>
              </div>
            )}
          </Link>
        ) : (
          <div className={cn("flex items-center gap-3 rounded-xl", isCollapsed ? "p-0" : "px-2 py-2")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-glow/30 to-cyan-glow/5 text-sm font-semibold text-cyan-glow">
              F
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-foreground truncate">Francisco</span>
                <span className="text-2xs text-muted-foreground truncate">Logado</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
