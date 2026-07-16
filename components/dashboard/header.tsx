"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder01Icon } from "@hugeicons/core-free-icons";

export function DashboardHeader({ title = "Painel Geral" }: { title?: string }) {
  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b bg-card sticky top-0 z-10 w-full shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-2" />
        <div className="flex items-center gap-3 text-foreground">
          <HugeiconsIcon icon={Folder01Icon} className="size-5" />
          <span className="text-lg font-semibold tracking-tight">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
