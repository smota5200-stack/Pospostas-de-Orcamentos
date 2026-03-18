import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StickyNote, Plus, Trash2, Pencil, Pin, PinOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Note, InsertNote } from "@shared/schema";

const colorMap: Record<string, string> = {
    default: "bg-white border-border",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-emerald-50 border-emerald-200",
    yellow: "bg-amber-50 border-amber-200",
    red: "bg-red-50 border-red-200",
    purple: "bg-violet-50 border-violet-200",
};

const categories = ["geral", "planejamento", "processos", "pesquisa", "clientes"];
const colors = ["default", "blue", "green", "yellow", "red", "purple"];
const colorDots: Record<string, string> = { default: "bg-gray-400", blue: "bg-blue-500", green: "bg-emerald-500", yellow: "bg-amber-500", red: "bg-red-500", purple: "bg-violet-500" };

const emptyNote: InsertNote = { title: "", content: "", category: "geral", pinned: "false", color: "default" };

export default function Notes() {
    const { toast } = useToast();
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<InsertNote>(emptyNote);

    const { data: notes = [], isLoading } = useQuery<Note[]>({
        queryKey: ["/api/notes"], queryFn: () => fetch("/api/notes").then(r => r.json()),
    });

    const createM = useMutation({
        mutationFn: (d: InsertNote) => fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then(r => r.json()),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/notes"] }); toast({ title: "Nota criada!" }); close(); },
    });
    const updateM = useMutation({
        mutationFn: ({ id, d }: { id: string; d: Partial<InsertNote> }) => fetch(`/api/notes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then(r => r.json()),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/notes"] }); toast({ title: "Nota atualizada!" }); close(); },
    });
    const deleteM = useMutation({
        mutationFn: (id: string) => fetch(`/api/notes/${id}`, { method: "DELETE" }).then(r => r.json()),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/notes"] }); toast({ title: "Nota excluída" }); },
    });

    function close() { setDialogOpen(false); setEditingId(null); setForm(emptyNote); }
    function openEdit(n: Note) {
        setEditingId(n.id);
        setForm({ title: n.title, content: n.content || "", category: n.category || "geral", pinned: n.pinned || "false", color: n.color || "default" });
        setDialogOpen(true);
    }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim()) return;
        editingId ? updateM.mutate({ id: editingId, d: form }) : createM.mutate(form);
    }
    function togglePin(n: Note) {
        updateM.mutate({ id: n.id, d: { pinned: n.pinned === "true" ? "false" : "true" } });
    }

    const filtered = notes.filter(n => {
        const ms = n.title.toLowerCase().includes(search.toLowerCase()) || (n.content || "").toLowerCase().includes(search.toLowerCase());
        const mc = catFilter === "all" || n.category === catFilter;
        return ms && mc;
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-heading font-bold">Anotações</h1><p className="text-muted-foreground text-sm mt-1">Suas notas e lembretes</p></div>
                <Button onClick={() => { setEditingId(null); setForm(emptyNote); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Nova Nota</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative max-w-sm flex-1">
                    <Input placeholder="Buscar notas..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-1">
                    <Button variant={catFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setCatFilter("all")}>Todas</Button>
                    {categories.map(c => <Button key={c} variant={catFilter === c ? "default" : "outline"} size="sm" onClick={() => setCatFilter(c)} className="capitalize">{c}</Button>)}
                </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(n => (
                    <Card key={n.id} className={`relative group transition-shadow hover:shadow-md ${colorMap[n.color || "default"]}`}>
                        <CardContent className="p-5 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-sm flex-1">{n.title}</h3>
                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(n)}>
                                        {n.pinned === "true" ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(n)}><Pencil className="w-3.5 h-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteM.mutate(n.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                            </div>
                            {n.pinned === "true" && <Pin className="w-3 h-3 text-primary absolute top-3 right-3" />}
                            {n.content && <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-6">{n.content}</p>}
                            <div className="flex items-center justify-between pt-1">
                                <Badge variant="outline" className="text-[10px] capitalize">{n.category}</Badge>
                                <span className="text-[10px] text-muted-foreground">{new Date(n.updatedAt).toLocaleDateString("pt-BR")}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {filtered.length === 0 && !isLoading && (
                <Card><CardContent className="p-12 text-center text-muted-foreground"><StickyNote className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Nenhuma nota encontrada</p></CardContent></Card>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editingId ? "Editar" : "Nova"} Nota</DialogTitle><DialogDescription>Crie ou edite uma anotação.</DialogDescription></DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Conteúdo</Label><Textarea value={form.content || ""} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Categoria</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category || "geral"} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            <div className="space-y-2"><Label>Cor</Label><div className="flex gap-2 pt-2">{colors.map(c => <button key={c} type="button" className={`w-6 h-6 rounded-full border-2 ${colorDots[c]} ${form.color === c ? "ring-2 ring-primary ring-offset-2" : ""}`} onClick={() => setForm({ ...form, color: c })} />)}</div></div>
                        </div>
                        <DialogFooter><Button variant="outline" type="button" onClick={close}>Cancelar</Button><Button type="submit">{editingId ? "Salvar" : "Criar"}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
