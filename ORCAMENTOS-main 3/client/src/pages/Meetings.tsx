import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Calendar, Plus, Trash2, MoreHorizontal, Pencil,
    Clock, MapPin, Users, Video, CheckCircle2, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Meeting, InsertMeeting } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    agendada: { label: "Agendada", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <Clock className="w-3 h-3" /> },
    concluida: { label: "Concluída", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
    cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="w-3 h-3" /> },
};

const emptyMeeting: InsertMeeting = {
    title: "", description: "", date: new Date().toISOString().split("T")[0], time: "10:00",
    duration: "60 min", participants: "", location: "", status: "agendada", notes: "",
};

export default function Meetings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<InsertMeeting>(emptyMeeting);

    const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
        queryKey: ["/api/meetings"],
        queryFn: () => fetch("/api/meetings").then(r => r.json()),
    });

    const createMutation = useMutation({
        mutationFn: (data: InsertMeeting) =>
            fetch("/api/meetings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/meetings"] }); toast({ title: "Reunião criada!" }); closeDialog(); },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<InsertMeeting> }) =>
            fetch(`/api/meetings/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/meetings"] }); toast({ title: "Reunião atualizada!" }); closeDialog(); },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => fetch(`/api/meetings/${id}`, { method: "DELETE" }).then(r => r.json()),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/meetings"] }); toast({ title: "Reunião excluída" }); },
    });

    function closeDialog() { setDialogOpen(false); setEditingId(null); setForm(emptyMeeting); }
    function openCreate() { setEditingId(null); setForm(emptyMeeting); setDialogOpen(true); }
    function openEdit(m: Meeting) {
        setEditingId(m.id);
        setForm({ title: m.title, description: m.description || "", date: m.date, time: m.time, duration: m.duration || "60 min", participants: m.participants || "", location: m.location || "", status: m.status, notes: m.notes || "" });
        setDialogOpen(true);
    }
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim()) { toast({ title: "Erro", description: "Título é obrigatório.", variant: "destructive" }); return; }
        if (editingId) updateMutation.mutate({ id: editingId, data: form });
        else createMutation.mutate(form);
    }

    const filtered = meetings.filter(m => statusFilter === "all" || m.status === statusFilter);
    const upcoming = meetings.filter(m => m.status === "agendada" && new Date(m.date) >= new Date(new Date().toDateString()));

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-bold">Reuniões</h1>
                    <p className="text-muted-foreground text-sm mt-1">Gerencie suas reuniões e compromissos</p>
                </div>
                <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Nova Reunião</Button>
            </div>

            {/* Status KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">Agendadas</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">{meetings.filter(m => m.status === "agendada").length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Clock className="w-5 h-5" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">Concluídas</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{meetings.filter(m => m.status === "concluida").length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">Próximas</p>
                                <p className="text-2xl font-bold text-violet-600 mt-1">{upcoming.length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-violet-50 text-violet-600"><Calendar className="w-5 h-5" /></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2">
                <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>Todas ({meetings.length})</Button>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                    <Button key={key} variant={statusFilter === key ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(key)} className="gap-1">
                        {cfg.icon} {cfg.label}
                    </Button>
                ))}
            </div>

            {/* Meeting cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(m => {
                    const sc = statusConfig[m.status] || statusConfig.agendada;
                    return (
                        <Card key={m.id} className="relative group">
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm truncate">{m.title}</h3>
                                        {m.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEdit(m)} className="gap-2"><Pencil className="w-4 h-4" /> Editar</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Alterar Status</DropdownMenuLabel>
                                            {Object.entries(statusConfig).map(([key, cfg]) => (
                                                <DropdownMenuItem key={key} onClick={() => updateMutation.mutate({ id: m.id, data: { status: key } })} className="gap-2" disabled={m.status === key}>
                                                    {cfg.icon} {cfg.label}
                                                </DropdownMenuItem>
                                            ))}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => deleteMutation.mutate(m.id)} className="text-destructive gap-2"><Trash2 className="w-4 h-4" /> Excluir</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(m.date).toLocaleDateString("pt-BR")}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {m.time}</span>
                                    {m.duration && <span>({m.duration})</span>}
                                </div>

                                {m.location && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="w-3 h-3" /> {m.location}
                                    </div>
                                )}
                                {m.participants && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Users className="w-3 h-3" /> {m.participants}
                                    </div>
                                )}

                                <Badge variant="outline" className={`gap-1 ${sc.color}`}>{sc.icon} {sc.label}</Badge>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filtered.length === 0 && !isLoading && (
                <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>Nenhuma reunião encontrada</p>
                    </CardContent>
                </Card>
            )}

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Editar Reunião" : "Nova Reunião"}</DialogTitle>
                        <DialogDescription>Agende uma nova reunião ou compromisso.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Título *</Label>
                            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Horário</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Duração</Label><Input value={form.duration || ""} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="60 min" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Local</Label><Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Zoom, Meet..." /></div>
                            <div className="space-y-2"><Label>Participantes</Label><Input value={form.participants || ""} onChange={(e) => setForm({ ...form, participants: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notas</Label>
                            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={closeDialog}>Cancelar</Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? "Salvar" : "Agendar"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
