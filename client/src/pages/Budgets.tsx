import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
    FileText, Plus, Send, CheckCircle2, XCircle, FileX, Trash2,
    Search, MoreHorizontal, Pencil, RotateCcw, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Budget } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    rascunho: { label: "Rascunho", color: "bg-slate-100 text-slate-700 border-slate-200", icon: <FileText className="w-3 h-3" /> },
    enviado: { label: "Enviado", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <Send className="w-3 h-3" /> },
    aprovado: { label: "Aprovado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
    rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="w-3 h-3" /> },
    vencido: { label: "Vencido", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <FileX className="w-3 h-3" /> },
};

function formatCurrency(value: number, currency = "BRL") {
    try {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
    } catch {
        return `${currency} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    }
}

function daysUntilExpiry(deletedAt: Date | null | undefined): number {
    if (!deletedAt) return 30;
    const expiresAt = new Date(deletedAt);
    expiresAt.setDate(expiresAt.getDate() + 30);
    const diff = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}

export default function Budgets() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [trashSearch, setTrashSearch] = useState("");

    const { data: budgets = [], isLoading } = useQuery<Budget[]>({
        queryKey: ["/api/budgets"],
        queryFn: () => fetch("/api/budgets").then(r => r.json()),
    });

    const { data: trashedBudgets = [], isLoading: loadingTrash } = useQuery<Budget[]>({
        queryKey: ["/api/budgets/trash"],
        queryFn: () => fetch("/api/budgets/trash").then(r => r.json()),
    });

    // Soft delete → manda para lixeira
    const deleteMutation = useMutation({
        mutationFn: (id: string) => fetch(`/api/budgets/${id}`, { method: "DELETE" }).then(r => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
            queryClient.invalidateQueries({ queryKey: ["/api/budgets/trash"] });
            toast({ title: "Movido para a lixeira", description: "O orçamento ficará na lixeira por 30 dias." });
        },
    });

    // Restaurar da lixeira
    const restoreMutation = useMutation({
        mutationFn: (id: string) => fetch(`/api/budgets/${id}/restore`, { method: "PUT" }).then(r => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
            queryClient.invalidateQueries({ queryKey: ["/api/budgets/trash"] });
            toast({ title: "✓ Orçamento restaurado", description: "O orçamento foi movido de volta para a lista." });
        },
    });

    // Exclusão permanente
    const permanentDeleteMutation = useMutation({
        mutationFn: (id: string) => fetch(`/api/budgets/${id}/permanent`, { method: "DELETE" }).then(r => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/budgets/trash"] });
            toast({ title: "Excluído permanentemente", description: "O orçamento foi removido definitivamente." });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            fetch(`/api/budgets/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            }).then(r => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
            toast({ title: "Status atualizado" });
        },
    });

    const budgetsWithDynamicStatus = budgets.map(b => {
        let displayStatus = b.status;
        let daysToExpiry = null;
        if (b.validityDate && b.status !== "aprovado" && b.status !== "rejeitado") {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const validity = new Date(b.validityDate); validity.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((validity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            daysToExpiry = diffDays;
            if (diffDays < 0) displayStatus = "vencido";
        }
        return { ...b, displayStatus, daysToExpiry };
    });

    const filtered = budgetsWithDynamicStatus.filter(b => {
        const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
            b.clientName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || b.displayStatus === statusFilter;
        return matchSearch && matchStatus;
    });

    const statusCounts = budgetsWithDynamicStatus.reduce((acc, b) => {
        acc[b.displayStatus] = (acc[b.displayStatus] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const filteredTrash = trashedBudgets.filter(b =>
        b.title.toLowerCase().includes(trashSearch.toLowerCase()) ||
        b.clientName.toLowerCase().includes(trashSearch.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-bold">Orçamentos</h1>
                    <p className="text-muted-foreground text-sm mt-1">Gerencie todos os seus orçamentos</p>
                </div>
                <Button asChild>
                    <Link href="/orcamento/novo">
                        <Plus className="w-4 h-4 mr-2" /> Novo Orçamento
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="ativos">
                <TabsList>
                    <TabsTrigger value="ativos">Ativos ({budgets.length})</TabsTrigger>
                    <TabsTrigger value="lixeira" className="gap-2">
                        <Trash2 className="w-3.5 h-3.5" />
                        Lixeira ({trashedBudgets.length})
                    </TabsTrigger>
                </TabsList>

                {/* ===== ABA: ATIVOS ===== */}
                <TabsContent value="ativos" className="space-y-4 mt-4">
                    {/* Status filter chips */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={statusFilter === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("all")}
                        >
                            Todos ({budgets.length})
                        </Button>
                        {Object.entries(statusConfig).map(([key, cfg]) => (
                            <Button
                                key={key}
                                variant={statusFilter === key ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter(key)}
                                className="gap-1"
                            >
                                {cfg.icon} {cfg.label} ({statusCounts[key] || 0})
                            </Button>
                        ))}
                    </div>

                    <Card>
                        <CardHeader className="pb-4">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por título ou cliente..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(b => {
                                        const sc = statusConfig[b.displayStatus] || statusConfig.rascunho;
                                        return (
                                            <TableRow
                                                key={b.id}
                                                className="cursor-pointer hover:bg-slate-50 transition-colors"
                                                onClick={() => setLocation(`/orcamento/${b.id}`)}
                                            >
                                                <TableCell className="font-medium">
                                                    {b.title}
                                                    <div className="text-xs text-muted-foreground font-normal mt-1">
                                                        {new Date(b.createdAt || new Date()).getFullYear()}-PROP-{b.proposalId ? String(b.proposalId).padStart(5, '0') : b.id.substring(0, 5).toUpperCase()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{b.clientName}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`gap-1 ${sc.color}`}>
                                                        {sc.icon} {sc.label}
                                                        {b.daysToExpiry !== null && b.daysToExpiry >= 0 && b.daysToExpiry <= 7 && b.displayStatus !== "vencido" && b.displayStatus !== "aprovado" && (
                                                            <span className="ml-1 text-[10px] opacity-80 font-normal">
                                                                ({b.daysToExpiry === 0 ? "Vence hoje" : `${b.daysToExpiry} dia${b.daysToExpiry > 1 ? 's' : ''} p/ vencer`})
                                                            </span>
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {b.validityDate ? new Date(b.validityDate).toLocaleDateString("pt-BR") : "—"}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatCurrency((b.totalValue || 0) / 100, b.currency)}
                                                </TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/orcamento/${b.id}`} className="gap-2 cursor-pointer flex items-center w-full">
                                                                    <Pencil className="w-4 h-4" /> Editar
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Alterar Status</DropdownMenuLabel>
                                                            {Object.entries(statusConfig).map(([key, cfg]) => (
                                                                <DropdownMenuItem
                                                                    key={key}
                                                                    onClick={() => updateStatusMutation.mutate({ id: b.id, status: key })}
                                                                    className="gap-2"
                                                                    disabled={b.status === key}
                                                                >
                                                                    {cfg.icon} {cfg.label}
                                                                </DropdownMenuItem>
                                                            ))}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => deleteMutation.mutate(b.id)}
                                                                className="text-destructive gap-2"
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Mover para Lixeira
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filtered.length === 0 && !isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                                <p>Nenhum orçamento encontrado</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ===== ABA: LIXEIRA ===== */}
                <TabsContent value="lixeira" className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Os orçamentos na lixeira são excluídos permanentemente após <strong>30 dias</strong>. Você pode restaurá-los a qualquer momento antes disso.
                    </div>

                    <Card>
                        <CardHeader className="pb-4">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar na lixeira..."
                                    value={trashSearch}
                                    onChange={(e) => setTrashSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Dias restantes</TableHead>
                                        <TableHead className="w-28"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTrash.map(b => {
                                        const days = daysUntilExpiry((b as any).deletedAt);
                                        return (
                                            <TableRow key={b.id}>
                                                <TableCell className="font-medium">
                                                    {b.title}
                                                    <div className="text-xs text-muted-foreground font-normal mt-1">
                                                        {new Date(b.createdAt || new Date()).getFullYear()}-PROP-{b.proposalId ? String(b.proposalId).padStart(5, '0') : b.id.substring(0, 5).toUpperCase()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{b.clientName}</TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency((b.totalValue || 0) / 100, b.currency)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={days <= 5 ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}
                                                    >
                                                        {days === 0 ? "Expira hoje" : `${days} dia${days !== 1 ? 's' : ''}`}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => restoreMutation.mutate(b.id)}
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => permanentDeleteMutation.mutate(b.id)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredTrash.length === 0 && !loadingTrash && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                <Trash2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                                <p>Lixeira vazia</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
