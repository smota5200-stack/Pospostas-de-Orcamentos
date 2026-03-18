import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    DollarSign, Plus, Trash2, Search, MoreHorizontal, Pencil,
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import type { Finance, InsertFinance } from "@shared/schema";

const categories = ["geral", "licenças", "serviços", "operacional", "pessoal", "marketing", "equipamentos"];

const emptyFinance: InsertFinance = {
    description: "", type: "receita", category: "geral", amount: 0, date: new Date().toISOString().split("T")[0], notes: "",
};

function formatCurrency(cents: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default function Finances() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<InsertFinance>(emptyFinance);

    const { data: finances = [], isLoading } = useQuery<Finance[]>({
        queryKey: ["/api/finances"],
        queryFn: () => fetch("/api/finances").then(r => r.json()),
    });

    const createMutation = useMutation({
        mutationFn: (data: InsertFinance) =>
            fetch("/api/finances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/finances"] }); toast({ title: "Lançamento criado!" }); closeDialog(); },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<InsertFinance> }) =>
            fetch(`/api/finances/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/finances"] }); toast({ title: "Lançamento atualizado!" }); closeDialog(); },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => fetch(`/api/finances/${id}`, { method: "DELETE" }).then(r => r.json()),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/finances"] }); toast({ title: "Lançamento excluído" }); },
    });

    function closeDialog() { setDialogOpen(false); setEditingId(null); setForm(emptyFinance); }
    function openCreate() { setEditingId(null); setForm(emptyFinance); setDialogOpen(true); }
    function openEdit(f: Finance) {
        setEditingId(f.id);
        setForm({ description: f.description, type: f.type, category: f.category, amount: f.amount, date: f.date, notes: f.notes || "" });
        setDialogOpen(true);
    }
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.description.trim()) { toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" }); return; }
        if (editingId) updateMutation.mutate({ id: editingId, data: form });
        else createMutation.mutate(form);
    }

    const totalReceita = finances.filter(f => f.type === "receita").reduce((s, f) => s + f.amount, 0);
    const totalDespesa = finances.filter(f => f.type === "despesa").reduce((s, f) => s + f.amount, 0);
    const saldo = totalReceita - totalDespesa;

    const filtered = finances.filter(f => {
        const matchSearch = f.description.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "all" || f.type === typeFilter;
        return matchSearch && matchType;
    });

    // Category chart
    const catData = (() => {
        const cats: Record<string, { receita: number; despesa: number }> = {};
        finances.forEach(f => {
            if (!cats[f.category]) cats[f.category] = { receita: 0, despesa: 0 };
            cats[f.category][f.type as "receita" | "despesa"] += f.amount;
        });
        return Object.entries(cats).map(([cat, vals]) => ({ category: cat, ...vals }));
    })();

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-bold">Finanças</h1>
                    <p className="text-muted-foreground text-sm mt-1">Controle de receitas e despesas</p>
                </div>
                <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Novo Lançamento</Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receitas</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalReceita)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><ArrowUpRight className="w-5 h-5" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Despesas</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalDespesa)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-red-50 text-red-600"><ArrowDownRight className="w-5 h-5" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo</p>
                                <p className={`text-2xl font-bold mt-1 ${saldo >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(saldo)}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${saldo >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            {catData.length > 0 && (
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base font-medium">Por Categoria</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={catData} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `R$${(v / 100000).toFixed(0)}k`} />
                                <Tooltip formatter={(value: number) => [formatCurrency(value as number), ""]} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                                <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} name="Receita" />
                                <Bar dataKey="despesa" fill="#ef4444" radius={[4, 4, 0, 0]} name="Despesa" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Filters & Table */}
            <div className="flex flex-wrap gap-2">
                <Button variant={typeFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("all")}>Todos</Button>
                <Button variant={typeFilter === "receita" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("receita")} className="gap-1">
                    <ArrowUpRight className="w-3 h-3" /> Receitas
                </Button>
                <Button variant={typeFilter === "despesa" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("despesa")} className="gap-1">
                    <ArrowDownRight className="w-3 h-3" /> Despesas
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar lançamentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(f => (
                                <TableRow key={f.id}>
                                    <TableCell className="font-medium">{f.description}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={f.type === "receita" ? "bg-emerald-50 text-emerald-700 border-emerald-200 gap-1" : "bg-red-50 text-red-700 border-red-200 gap-1"}>
                                            {f.type === "receita" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {f.type === "receita" ? "Receita" : "Despesa"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground capitalize">{f.category}</TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(f.date).toLocaleDateString("pt-BR")}</TableCell>
                                    <TableCell className={`text-right font-semibold ${f.type === "receita" ? "text-emerald-600" : "text-red-600"}`}>
                                        {f.type === "despesa" ? "- " : ""}{formatCurrency(f.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEdit(f)} className="gap-2"><Pencil className="w-4 h-4" /> Editar</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => deleteMutation.mutate(f.id)} className="text-destructive gap-2"><Trash2 className="w-4 h-4" /> Excluir</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && !isLoading && (
                                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Nenhum lançamento encontrado</p></TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
                        <DialogDescription>Registre uma receita ou despesa.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Descrição *</Label>
                            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                    <option value="receita">Receita</option>
                                    <option value="despesa">Despesa</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Valor (centavos)</Label>
                                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notas</Label>
                            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={closeDialog}>Cancelar</Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? "Salvar" : "Criar"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
