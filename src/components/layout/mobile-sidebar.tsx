"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, BarChart3, FolderOpen, Play, Sun, Moon, 
  Clock, Target, Calendar, Menu, X, LogOut, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
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

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { activeTimer } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

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
    setIsOpen(false);
    router.push("/login");
    router.refresh();
  };

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-glow shadow-[0_0_12px_rgba(0,245,255,0.25)]">
            <Zap className="h-4 w-4 text-[#0D0D0D]" fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-[-0.02em] text-foreground">
            FocusTrack
          </span>
        </div>
        
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-xl bg-accent/50 text-foreground active:scale-95 transition-all"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[50] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[280px] bg-card border-r border-border z-[60] lg:hidden transform transition-transform duration-300 ease-out flex flex-col p-6 shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-glow shadow-[0_0_12px_rgba(0,245,255,0.25)]">
              <Zap className="h-4 w-4 text-[#0D0D0D]" fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-[-0.02em]">FocusTrack</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navigation.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium transition-all active:scale-[0.98]",
                  isActive 
                    ? "bg-accent text-foreground shadow-sm ring-1 ring-border/50" 
                    : "text-muted-foreground hover:bg-accent/40"
                )}
              >
                <item.icon 
                  className={cn("h-5 w-5", isActive ? "text-cyan-glow" : "text-muted-foreground/60")} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-base">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3.5 w-full px-4 py-3 rounded-2xl text-muted-foreground hover:bg-accent/40 transition-all active:scale-[0.98]"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="text-base">{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
          </button>

          {/* Active Timer Indicator (Mobile) */}
          {activeTimer && pathname !== "/" && (
            <Link
              href="/"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-cyan-glow/10 border border-cyan-glow/20"
            >
              <div className="relative h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-background border border-cyan-glow/30">
                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-green-live rounded-full border-2 border-background animate-pulse" />
                <Play className="h-4 w-4 text-cyan-glow ml-0.5" fill="currentColor" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground truncate">{activeTimer.taskName || "Foco ativo"}</span>
                <span className="text-[10px] uppercase tracking-wider text-cyan-glow font-bold">Em andamento</span>
              </div>
            </Link>
          )}

          {/* User Section */}
          <div className="pt-6 border-t border-border flex flex-col gap-4">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-cyan-glow/20 flex items-center justify-center text-cyan-glow font-bold border border-cyan-glow/30">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold truncate max-w-[120px]">{user.email?.split("@")[0]}</span>
                    <span className="text-[10px] uppercase text-muted-foreground font-medium">Online</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all active:scale-90"
                  aria-label="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-cyan-glow text-[#0D0D0D] font-bold shadow-[0_0_15px_rgba(0,245,255,0.2)]"
              >
                <Clock className="h-5 w-5" />
                <span>Fazer Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
