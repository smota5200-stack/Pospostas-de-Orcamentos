import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Users, Plus, Trash2, Search, MoreHorizontal, Pencil, Building, Phone, Mail, Cake, PartyPopper,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import type { Client, InsertClient } from "@shared/schema";

const emptyClient: InsertClient = { name: "", email: "", phone: "", company: "", birthday: "", notes: "" };

function isBirthdayToday(birthday: string | null | undefined): boolean {
    if (!birthday) return false;
    const today = new Date();
    const bd = new Date(birthday + "T00:00:00");
    return bd.getDate() === today.getDate() && bd.getMonth() === today.getMonth();
}

export default function Clients() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<InsertClient>(emptyClient);

    const { data: clients = [], isLoading } = useQuery<Client[]>({
        queryKey: ["/api/clients"],
        queryFn: () => fetch("/api/clients").then(r => r.json()),
    });

    const createMutation = useMutation({
        mutationFn: (data: InsertClient) =>
            fetch("/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }).then(r => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
            toast({ title: "Cliente criado!", description: "O cliente foi cadastrado com sucesso." });
            closeDialog();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<InsertClient> }) =>
            fetch(`/api/clients/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }).then(r => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
            toast({ title: "Cliente atualizado!" });
            closeDialog();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => fetch(`/api/clients/${id}`, { method: "DELETE" }).then(r => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
            toast({ title: "Cliente excluído" });
        },
    });

    function closeDialog() {
        setDialogOpen(false);
        setEditingId(null);
        setForm(emptyClient);
    }

    function openCreate() {
        setEditingId(null);
        setForm(emptyClient);
        setDialogOpen(true);
    }

    function openEdit(client: Client) {
        setEditingId(client.id);
        setForm({
            name: client.name,
            email: client.email || "",
            phone: client.phone || "",
            company: client.company || "",
            birthday: client.birthday || "",
            notes: client.notes || "",
        });
        setDialogOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) {
            toast({ title: "Erro", description: "O nome é obrigatório.", variant: "destructive" });
            return;
        }
        if (editingId) {
            updateMutation.mutate({ id: editingId, data: form });
        } else {
            createMutation.mutate(form);
        }
    }

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.company || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(search.toLowerCase())
    );

    const birthdayClients = clients.filter(c => isBirthdayToday(c.birthday));

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-bold">Clientes</h1>
                    <p className="text-muted-foreground text-sm mt-1">Gerencie sua base de clientes</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Novo Cliente
                </Button>
            </div>

            {birthdayClients.length > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800 shrink-0">
                        <PartyPopper className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                    </div>
                    <div>
                        <p className="font-semibold text-amber-900 dark:text-amber-200">
                            🎂 Aniversariante{birthdayClients.length > 1 ? "s" : ""} do dia!
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            {birthdayClients.map(c => c.name).join(", ")}
                        </p>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome, empresa ou email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa/Pessoa</TableHead>
                                <TableHead>Contato</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Aniversário</TableHead>
                                <TableHead>Cadastro</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(c => {
                                const isBday = isBirthdayToday(c.birthday);
                                return (
                                    <TableRow key={c.id} className={isBday ? "bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/30" : ""}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isBday ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400 ring-offset-1' : 'bg-primary/10 text-primary'}`}>
                                                    {isBday ? "🎂" : c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {c.name}
                                                    {isBday && <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300 text-[10px] px-1.5 py-0">Aniversário!</Badge>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {c.company ? (
                                                <span className="flex items-center gap-1">
                                                    <Building className="w-3 h-3" /> {c.company}
                                                </span>
                                            ) : "—"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {c.email ? (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {c.email}
                                                </span>
                                            ) : "—"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {c.phone ? (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {c.phone}
                                                </span>
                                            ) : "—"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {c.birthday ? (
                                                <span className="flex items-center gap-1">
                                                    <Cake className="w-3 h-3" /> {new Date(c.birthday + "T00:00:00").toLocaleDateString("pt-BR")}
                                                </span>
                                            ) : "—"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openEdit(c)} className="gap-2">
                                                        <Pencil className="w-4 h-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => deleteMutation.mutate(c.id)}
                                                        className="text-destructive gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filtered.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p>Nenhum cliente encontrado</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
                        <DialogDescription>
                            {editingId ? "Atualize as informações do cliente." : "Preencha os dados para cadastrar um novo cliente."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Empresa/Pessoa *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Nome completo"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={form.email || ""}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="email@empresa.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <Input
                                    value={form.phone || ""}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Contato</Label>
                                <Input
                                    value={form.company || ""}
                                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                                    placeholder="Nome da empresa"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data de Aniversário</Label>
                                <Input
                                    type="date"
                                    value={form.birthday || ""}
                                    onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notas</Label>
                            <Textarea
                                value={form.notes || ""}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="Observações sobre o cliente..."
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={closeDialog}>Cancelar</Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingId ? "Salvar" : "Cadastrar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
