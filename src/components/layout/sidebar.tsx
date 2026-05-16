"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, BarChart3, FolderOpen, PanelLeftClose, PanelLeftOpen, Play, Sun, Moon, Clock, Target, Calendar, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useTimerStore";
import { useTheme } from "@teispace/next-themes";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Overview", href: "/overview", icon: BarChart3 },
  { name: "Projetos", href: "/projetos", icon: FolderOpen },
  { name: "Time Audit", href: "/time-audit", icon: Clock },
  { name: "Progress", href: "/progress", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { activeTimer } = useAppStore();
  const { theme, setTheme } = useTheme();

  // Load state on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
    setMounted(true);
  }, []);

  // Save state on change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebar-collapsed", isCollapsed.toString());
    }
  }, [isCollapsed, mounted]);

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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden">
          <img src="/logo.png" alt="moment logo" className="h-8 w-8 object-contain" />
        </div>
        {!isCollapsed && (
          <span className="text-lg font-bold tracking-[-0.02em] text-foreground line-clamp-1">
            moment
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
          <UserSession isCollapsed={isCollapsed} />
        )}
      </div>
    </aside>
  );
}

const supabase = createClient();

function UserSession({ isCollapsed }: { isCollapsed: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          "group flex items-center rounded-xl py-2.5 font-medium transition-all duration-300 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50",
          isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : "gap-3 px-3 w-full",
          "bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20"
        )}
      >
        <Clock className="h-4 w-4 shrink-0" />
        {!isCollapsed && <span className="text-sm">Fazer Login</span>}
      </Link>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", isCollapsed ? "items-center" : "px-2")}>
      <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-glow/30 to-cyan-glow/5 text-sm font-semibold text-cyan-glow border border-cyan-glow/20">
          {user.email?.[0].toUpperCase()}
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-foreground truncate">
              {user.email?.split("@")[0]}
            </span>
            <span className="text-2xs text-muted-foreground truncate">Online</span>
          </div>
        )}
      </div>
      {!isCollapsed && (
        <div className="mt-1 flex items-center justify-between px-1">
          <SyncIndicator />
          <button
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
          >
            Sair da conta
          </button>
        </div>
      )}
      {isCollapsed && (
        <div className="mt-2 flex justify-center">
          <SyncIndicator isCollapsed />
        </div>
      )}
    </div>
  );
}

function SyncIndicator({ isCollapsed }: { isCollapsed?: boolean }) {
  const syncStatus = useAppStore((state) => state.syncStatus);

  if (syncStatus === "idle") return null;

  const labels = {
    syncing: "Sync",
    synced: "Live",
    error: "Erro"
  };

  return (
    <div 
      className={cn(
        "flex items-center transition-all duration-300",
        isCollapsed ? "justify-center" : "gap-2"
      )}
      title={labels[syncStatus as keyof typeof labels] || ""}
    >
      <div className={cn(
        "h-1.5 w-1.5 rounded-full",
        syncStatus === "syncing" && "bg-cyan-glow animate-pulse",
        syncStatus === "synced" && "bg-green-500/60",
        syncStatus === "error" && "bg-red-500 animate-bounce"
      )} />
      {!isCollapsed && (
        <span className={cn(
          "text-[11px] font-medium transition-colors",
          syncStatus === "syncing" && "text-cyan-glow/80",
          syncStatus === "synced" && "text-muted-foreground/60",
          syncStatus === "error" && "text-red-500/80"
        )}>
          {syncStatus === "syncing" ? "Sincronizando" : "Online"}
        </span>
      )}
    </div>
  );
}
