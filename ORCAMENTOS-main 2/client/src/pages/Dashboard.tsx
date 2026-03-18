import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
    FileText, Users, DollarSign, TrendingUp, Clock, AlertTriangle,
    CheckCircle2, Send, XCircle, FileX, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { Budget, Client } from "@shared/schema";

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

function isNearExpiry(dateStr: string | null) {
    if (!dateStr) return false;
    const diff = new Date(dateStr).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // 7 days
}

export default function Dashboard() {
    const { data: budgets = [], isLoading: loadingBudgets } = useQuery<Budget[]>({
        queryKey: ["/api/budgets"],
        queryFn: () => fetch("/api/budgets").then(r => r.json()),
    });

    const { data: clients = [] } = useQuery<Client[]>({
        queryKey: ["/api/clients"],
        queryFn: () => fetch("/api/clients").then(r => r.json()),
    });

    const totalValue = budgets.reduce((s, b) => s + ((b.totalValue || 0) / 100), 0);
    const approved = budgets.filter(b => b.status === "aprovado");
    const approvedValue = approved.reduce((s, b) => s + ((b.totalValue || 0) / 100), 0);
    const pending = budgets.filter(b => b.status === "enviado" || b.status === "rascunho");
    const nearExpiry = budgets.filter(b => isNearExpiry(b.validityDate));

    // Monthly chart data
    const monthlyData = (() => {
        const months: Record<string, number> = {};
        budgets.forEach(b => {
            const d = new Date(b.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            months[key] = (months[key] || 0) + ((b.totalValue || 0) / 100);
        });
        return Object.entries(months)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, value]) => ({
                month: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short" }),
                value,
            }));
    })();

    const kpis = [
        {
            title: "Total Orçamentos",
            value: budgets.length,
            icon: <FileText className="w-5 h-5" />,
            color: "text-blue-600 bg-blue-50",
        },
        {
            title: "Valor Total",
            value: formatCurrency(totalValue),
            icon: <DollarSign className="w-5 h-5" />,
            color: "text-emerald-600 bg-emerald-50",
        },
        {
            title: "Aprovados",
            value: `${approved.length} (${formatCurrency(approvedValue)})`,
            icon: <TrendingUp className="w-5 h-5" />,
            color: "text-violet-600 bg-violet-50",
        },
        {
            title: "Clientes",
            value: clients.length,
            icon: <Users className="w-5 h-5" />,
            color: "text-orange-600 bg-orange-50",
        },
    ];

    const barColors = ["#3b82f6", "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#60a5fa"];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">Visão geral dos seus orçamentos e clientes</p>
                </div>
                <Button asChild>
                    <Link href="/orcamento/novo">
                        <FileText className="w-4 h-4 mr-2" /> Novo Orçamento
                    </Link>
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <Card key={kpi.title} className="relative overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.title}</p>
                                    <p className="text-2xl font-bold mt-1">{loadingBudgets ? "..." : kpi.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${kpi.color}`}>
                                    {kpi.icon}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* Chart */}
                <Card className="lg:col-span-3">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Orçamentos por Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={monthlyData} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value: number) => [formatCurrency(value), "Valor"]}
                                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {monthlyData.map((_, i) => (
                                            <Cell key={i} fill={barColors[i % barColors.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
                                Nenhum dado disponível
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Near expiry alert */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Próximos ao Vencimento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {nearExpiry.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-400" />
                                <p className="text-sm">Tudo em dia!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {nearExpiry.map(b => (
                                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                                        <div>
                                            <p className="font-medium text-sm">{b.title}</p>
                                            <p className="text-xs text-muted-foreground">{b.clientName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {b.validityDate && new Date(b.validityDate).toLocaleDateString("pt-BR")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Budgets Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium">Orçamentos Recentes</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/orcamentos">
                            Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </Button>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {budgets.slice(0, 5).map(b => {
                                const sc = statusConfig[b.status] || statusConfig.rascunho;
                                return (
                                    <TableRow key={b.id}>
                                        <TableCell className="font-medium">
                                            {b.title}
                                            <div className="text-xs text-muted-foreground font-normal mt-1">
                                                {new Date(b.createdAt || new Date()).getFullYear()}-PROP-{b.id.substring(0, 5).toUpperCase()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{b.clientName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`gap-1 ${sc.color}`}>
                                                {sc.icon} {sc.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={isNearExpiry(b.validityDate) ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                                                {b.validityDate ? new Date(b.validityDate).toLocaleDateString("pt-BR") : "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatCurrency((b.totalValue || 0) / 100, b.currency)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {budgets.length === 0 && !loadingBudgets && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Nenhum orçamento encontrado
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
