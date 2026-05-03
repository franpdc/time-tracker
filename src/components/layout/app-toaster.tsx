"use client";

import { useTheme } from "next-themes";
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
        style: {
          background: isDark ? '#1A1A1A' : '#FFFFFF',
          border: `1px solid ${isDark ? '#2A2A2A' : '#E4E4E7'}`,
          color: isDark ? '#fff' : '#1A1A1A',
        },
      }}
    />
  );
}
