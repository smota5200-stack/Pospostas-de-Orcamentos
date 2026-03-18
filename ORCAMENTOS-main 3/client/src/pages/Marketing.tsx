import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Megaphone, Plus, Trash2, MoreHorizontal, Pencil,
    Mail, Share2, MonitorPlay, Mic, FileEdit,
    Play, Pause, CheckCircle2, Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Marketing, InsertMarketing } from "@shared/schema";

const statusCfg: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    planejada: { label: "Planejada", color: "bg-slate-100 text-slate-700 border-slate-200", icon: <Clock className="w-3 h-3" /> },
    ativa: { label: "Ativa", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <Play className="w-3 h-3" /> },
    pausada: { label: "Pausada", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <Pause className="w-3 h-3" /> },
    concluida: { label: "Concluída", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <CheckCircle2 className="w-3 h-3" /> },
};
const typeCfg: Record<string, { label: string; icon: React.ReactNode }> = {
    email: { label: "Email", icon: <Mail className="w-3.5 h-3.5" /> },
    social: { label: "Social", icon: <Share2 className="w-3.5 h-3.5" /> },
    ads: { label: "Ads", icon: <MonitorPlay className="w-3.5 h-3.5" /> },
    evento: { label: "Evento", icon: <Mic className="w-3.5 h-3.5" /> },
    conteudo: { label: "Conteúdo", icon: <FileEdit className="w-3.5 h-3.5" /> },
};
const fmt = (c: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100);
const empty: InsertMarketing = { name: "", type: "email", status: "planejada", budget: 0, spent: 0, startDate: "", endDate: "", description: "", notes: "" };

export default function MarketingPage() {
    const { toast } = useToast();
    const qc = useQueryClient();
    const [sf, setSf] = useState("all");
    const [open, setOpen] = useState(false);
    const [eid, setEid] = useState<string | null>(null);
    const [form, setForm] = useState<InsertMarketing>(empty);
    const { data: items = [], isLoading } = useQuery<Marketing[]>({ queryKey: ["/api/marketing"], queryFn: () => fetch("/api/marketing").then(r => r.json()) });
    const create = useMutation({ mutationFn: (d: InsertMarketing) => fetch("/api/marketing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then(r => r.json()), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/marketing"] }); toast({ title: "Campanha criada!" }); close(); } });
    const update = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<InsertMarketing> }) => fetch(`/api/marketing/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then(r => r.json()), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/marketing"] }); toast({ title: "Atualizado!" }); close(); } });
    const del = useMutation({ mutationFn: (id: string) => fetch(`/api/marketing/${id}`, { method: "DELETE" }).then(r => r.json()), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/marketing"] }); toast({ title: "Excluído" }); } });
    function close() { setOpen(false); setEid(null); setForm(empty); }
    function edit(c: Marketing) { setEid(c.id); setForm({ name: c.name, type: c.type, status: c.status, budget: c.budget || 0, spent: c.spent || 0, startDate: c.startDate || "", endDate: c.endDate || "", description: c.description || "", notes: c.notes || "" }); setOpen(true); }
    function submit(e: React.FormEvent) { e.preventDefault(); if (!form.name.trim()) return; eid ? update.mutate({ id: eid, d: form }) : create.mutate(form); }
    const filtered = items.filter(c => sf === "all" || c.status === sf);
    const tb = items.reduce((s, c) => s + (c.budget || 0), 0);
    const ts = items.reduce((s, c) => s + (c.spent || 0), 0);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-heading font-bold">Marketing</h1><p className="text-muted-foreground text-sm mt-1">Gerencie suas campanhas</p></div>
                <Button onClick={() => { setEid(null); setForm(empty); setOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Nova Campanha</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card><CardContent className="p-5"><p className="text-xs font-medium text-muted-foreground uppercase">Ativas</p><p className="text-2xl font-bold text-emerald-600 mt-1">{items.filter(c => c.status === "ativa").length}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-xs font-medium text-muted-foreground uppercase">Budget</p><p className="text-2xl font-bold mt-1">{fmt(tb)}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-xs font-medium text-muted-foreground uppercase">Gasto</p><p className="text-2xl font-bold text-orange-600 mt-1">{fmt(ts)}</p><Progress value={tb > 0 ? (ts / tb) * 100 : 0} className="mt-2 h-1.5" /></CardContent></Card>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button variant={sf === "all" ? "default" : "outline"} size="sm" onClick={() => setSf("all")}>Todas</Button>
                {Object.entries(statusCfg).map(([k, v]) => <Button key={k} variant={sf === k ? "default" : "outline"} size="sm" onClick={() => setSf(k)} className="gap-1">{v.icon} {v.label}</Button>)}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(c => {
                    const sc = statusCfg[c.status] || statusCfg.planejada; const tc = typeCfg[c.type] || typeCfg.email; const p = (c.budget || 0) > 0 ? ((c.spent || 0) / (c.budget || 1)) * 100 : 0; return (
                        <Card key={c.id}><CardContent className="p-5 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-md bg-primary/10 text-primary">{tc.icon}</div><Badge variant="outline" className="text-[10px]">{tc.label}</Badge></div><h3 className="font-semibold text-sm">{c.name}</h3>{c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}</div>
                                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => edit(c)} className="gap-2"><Pencil className="w-4 h-4" /> Editar</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Status</DropdownMenuLabel>{Object.entries(statusCfg).map(([k, v]) => <DropdownMenuItem key={k} onClick={() => update.mutate({ id: c.id, d: { status: k } })} className="gap-2" disabled={c.status === k}>{v.icon} {v.label}</DropdownMenuItem>)}<DropdownMenuSeparator /><DropdownMenuItem onClick={() => del.mutate(c.id)} className="text-destructive gap-2"><Trash2 className="w-4 h-4" /> Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                            </div>
                            <div className="space-y-1"><div className="flex justify-between text-xs"><span className="text-muted-foreground">Budget: {fmt(c.budget || 0)}</span><span className="font-medium">{p.toFixed(0)}%</span></div><Progress value={p} className="h-1.5" /></div>
                            {(c.startDate || c.endDate) && <p className="text-xs text-muted-foreground">{c.startDate && new Date(c.startDate).toLocaleDateString("pt-BR")}{c.startDate && c.endDate && " → "}{c.endDate && new Date(c.endDate).toLocaleDateString("pt-BR")}</p>}
                            <Badge variant="outline" className={`gap-1 ${sc.color}`}>{sc.icon} {sc.label}</Badge>
                        </CardContent></Card>);
                })}
            </div>
            {filtered.length === 0 && !isLoading && <Card><CardContent className="p-12 text-center text-muted-foreground"><Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Nenhuma campanha</p></CardContent></Card>}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{eid ? "Editar" : "Nova"} Campanha</DialogTitle><DialogDescription>Configure os detalhes.</DialogDescription></DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Tipo</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{Object.entries(typeCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div><div className="space-y-2"><Label>Status</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{Object.entries(statusCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div></div>
                        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Budget (¢)</Label><Input type="number" value={form.budget || 0} onChange={e => setForm({ ...form, budget: parseInt(e.target.value) || 0 })} /></div><div className="space-y-2"><Label>Gasto (¢)</Label><Input type="number" value={form.spent || 0} onChange={e => setForm({ ...form, spent: parseInt(e.target.value) || 0 })} /></div></div>
                        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Início</Label><Input type="date" value={form.startDate || ""} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div><div className="space-y-2"><Label>Fim</Label><Input type="date" value={form.endDate || ""} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div></div>
                        <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                        <DialogFooter><Button variant="outline" type="button" onClick={close}>Cancelar</Button><Button type="submit">{eid ? "Salvar" : "Criar"}</Button></DialogFooter>
                    </form></DialogContent></Dialog>
        </div>
    );
}
