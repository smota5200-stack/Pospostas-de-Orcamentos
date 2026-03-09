import { Link, useLocation } from "wouter";
import {
    Building2, LayoutDashboard, FileText, Users, Plus,
    DollarSign, Calendar, Megaphone, StickyNote, Type, Trash2
} from "lucide-react";
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Orçamentos", href: "/orcamentos", icon: FileText },
    { label: "Clientes", href: "/clientes", icon: Users },
    { label: "Finanças", href: "/financas", icon: DollarSign },
    { label: "Reuniões", href: "/reunioes", icon: Calendar },
    { label: "Marketing", href: "/marketing", icon: Megaphone },
    { label: "Anotações", href: "/anotacoes", icon: StickyNote },
    { label: "Textos", href: "/textos", icon: Type },
    { label: "Lixeira", href: "/orcamentos", icon: Trash2 }, // Redireciona para orçamentos onde a aba lixeira está
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [location] = useLocation();

    return (
        <SidebarProvider>
            <Sidebar variant="sidebar" collapsible="icon">
                <SidebarHeader className="p-4">
                    <Link href="/" className="flex items-center gap-2 text-primary">
                        <Building2 className="w-6 h-6 shrink-0" />
                        <span className="font-heading font-semibold text-lg tracking-tight group-data-[collapsible=icon]:hidden">
                            Proposify
                        </span>
                    </Link>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Menu</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {navItems.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={location === item.href}
                                            tooltip={item.label}
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="w-4 h-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarGroup>
                        <SidebarGroupLabel>Ações Rápidas</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Novo Orçamento">
                                        <Link href="/orcamento/novo">
                                            <Plus className="w-4 h-4" />
                                            <span>Novo Orçamento</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter className="group-data-[collapsible=icon]:hidden">
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                        © 2025 Proposify
                    </div>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b px-6" style={{ backgroundColor: 'rgb(8, 21, 52)' }}>
                    <SidebarTrigger className="text-white hover:text-white hover:bg-white/10" />
                    <Separator orientation="vertical" className="h-6 bg-white/30" />
                    <div className="flex-1" />
                </header>
                <div className="flex-1 overflow-auto" style={{ backgroundColor: 'rgb(221, 221, 221)' }}>
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
