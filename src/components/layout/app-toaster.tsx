"use client";

import { useTheme } from "@teispace/next-themes";
import { Toaster } from "sonner";

export function AppToaster() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Toaster
      theme={isDark ? "dark" : "light"}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border-border bg-card text-foreground shadow-elevated backdrop-blur-xl",
          title: "text-sm font-medium tracking-[-0.01em]",
          description: "text-xs text-muted-foreground",
          actionButton: "rounded-lg bg-cyan-glow text-black",
          cancelButton: "rounded-lg",
          success: "border-cyan-glow/30",
          error: "border-destructive/40",
        },
        style: {
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        },
      }}
    />
  );
}
