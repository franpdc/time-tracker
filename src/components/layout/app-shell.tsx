"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SyncManager } from "@/components/layout/sync-manager";
import { AppToaster } from "@/components/layout/app-toaster";
import { TitleManager } from "@/components/layout/title-manager";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <TooltipProvider>
        <main className="h-screen w-full overflow-y-auto bg-background">
          {children}
        </main>
        <AppToaster />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <SyncManager />
      <div className="flex h-screen overflow-hidden">
        <div className="relative h-full z-20">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
      <AppToaster />
      <TitleManager />
    </TooltipProvider>
  );
}
