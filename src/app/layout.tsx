import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getTheme } from "@teispace/next-themes/server";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { AppToaster } from "@/components/layout/app-toaster";
import { TitleManager } from "@/components/layout/title-manager";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FocusTrack",
  description: "Rastreie seu tempo de foco e produtividade",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialTheme = await getTheme();

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-hidden bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          initialTheme={initialTheme ?? undefined}
        >
          <TooltipProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
