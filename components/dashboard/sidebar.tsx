"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useDashboardStore } from "@/store/dashboard-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  WhatsappIcon,
  Calendar01Icon,
  Wallet01Icon,
  UserGroupIcon,
  Settings01Icon,
  ArrowDown01Icon,
  Tick01Icon,
  Add01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

const navItems = [
  { id: "painel", title: "Painel Geral", icon: DashboardSquare01Icon, iconColor: "text-primary", disabled: false },
  { id: "whats", title: "Whats", icon: WhatsappIcon, iconColor: "text-emerald-500", disabled: false },
  { id: "calendario", title: "Calendário", icon: Calendar01Icon, iconColor: "text-orange-500", disabled: false },
  { id: "financeiro", title: "Financeiro", icon: Wallet01Icon, iconColor: "text-slate-400", disabled: true },
  { id: "crm", title: "CRM", icon: UserGroupIcon, iconColor: "text-slate-400", disabled: true },
  { id: "config", title: "Configuração", icon: Settings01Icon, iconColor: "text-muted-foreground", disabled: false },
];

export function DashboardSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const { activeTab, setActiveTab } = useDashboardStore();
  return (
    <Sidebar collapsible="offExamples" className="lg:border-r-0!" {...props}>
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center justify-between w-full">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 outline-none w-full justify-start">
                  <div className="size-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                    <span className="text-sm font-bold">T+</span>
                  </div>
                  <span className="font-semibold text-sidebar-foreground truncate">
                    Taskplus
                  </span>
                  <HugeiconsIcon icon={ArrowDown01Icon} className="size-3 text-muted-foreground shrink-0" />
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuGroup>
                <p className="text-muted-foreground text-xs font-medium px-2 py-1.5">
                  Espaços de Trabalho
                </p>
                <DropdownMenuItem>
                  <div className="size-5 rounded bg-primary/20 mr-2 flex items-center justify-center text-xs font-bold text-primary">
                    T+
                  </div>
                  Taskplus
                  <HugeiconsIcon icon={Tick01Icon} className="size-4 ml-auto" />
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="size-5 rounded bg-blue-500/20 mr-2 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                    M
                  </div>
                  Equipe de Marketing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="size-5 rounded bg-emerald-500/20 mr-2 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    D
                  </div>
                  Estúdio de Design
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HugeiconsIcon icon={Add01Icon} className="size-4 mr-2" />
                Criar Espaço de Trabalho
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HugeiconsIcon icon={UserIcon} className="size-4 mr-2" />
                Perfil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Avatar className="size-8 border-2 border-sidebar shrink-0">
            <AvatarImage src="/ln.png" />
            <AvatarFallback>LN</AvatarFallback>
          </Avatar>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={active}
                      className={cn(
                        "h-9",
                        item.disabled && "cursor-not-allowed"
                      )}
                      onClick={() => {
                        if (item.disabled) return;
                        setActiveTab(item.id);
                      }}
                      aria-disabled={item.disabled}
                      tabIndex={item.disabled ? -1 : undefined}
                    >
                      <HugeiconsIcon icon={item.icon} className={cn("size-4 shrink-0", item.iconColor)} />
                      <span className={cn("text-sm", item.disabled && "text-slate-400")}>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
