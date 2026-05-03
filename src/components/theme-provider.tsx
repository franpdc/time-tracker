"use client";

import * as React from "react";
import { ThemeProvider as TeispaceThemeProvider } from "@teispace/next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof TeispaceThemeProvider>) {
  return <TeispaceThemeProvider {...props}>{children}</TeispaceThemeProvider>;
}
