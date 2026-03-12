import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TextItem = {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
};

export default function Texts() {
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingText, setEditingText] = useState<TextItem | null>(null);

    const { data: texts, isLoading } = useQuery<TextItem[]>({
        queryKey: ["/api/texts"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: { title: string; content: string }) => {
            const res = await fetch("/api/texts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Erro ao criar texto");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/texts"] });
            toast({ title: "Texto criado com sucesso!" });
            setIsModalOpen(false);
        },
        onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
    });

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; title: string; content: string }) => {
            const res = await fetch(`/api/texts/${data.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Erro ao atualizar texto");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/texts"] });
            toast({ title: "Texto atualizado com sucesso!" });
            setIsModalOpen(false);
        },
        onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/texts/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Erro ao excluir texto");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/texts"] });
            toast({ title: "Texto excluído com sucesso!" });
        },
        onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
    });

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;

        if (editingText) {
            updateMutation.mutate({ id: editingText.id, title, content });
        } else {
            createMutation.mutate({ title, content });
        }
    };

    const openEdit = (t: TextItem) => {
        setEditingText(t);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditingText(null);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando textos...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 h-[calc(100vh-3.5rem)]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-semibold text-foreground">Textos Principais</h1>
                    <p className="text-muted-foreground mt-1">Gerencie textos e blocos de conteúdo.</p>
                </div>
                <Button onClick={openNew} className="gap-2">
                    <Plus className="w-4 h-4" /> Novo Texto
                </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {texts?.map((t) => (
                    <div key={t.id} className="relative group bg-card border rounded-lg p-6 hover:shadow-md transition-all flex flex-col h-full">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(t)}>
                                <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(t.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <h3 className="text-xl font-semibold mb-2 pr-16">{t.title}</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap flex-1 text-sm">{t.content}</p>
                        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex justify-between">
                            <span>Criado: {new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}

                {texts?.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-card border rounded-lg border-dashed">
                        <h3 className="text-lg font-medium text-foreground mb-1">Nenhum texto encontrado</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Crie seu primeiro texto para armazená-lo no Supabase.
                        </p>
                        <Button onClick={openNew} variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" /> Adicionar
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingText ? "Editar Texto" : "Novo Texto"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={editingText?.title}
                                required
                                placeholder="Ex: Termos e Condições"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Conteúdo</Label>
                            <Textarea
                                id="content"
                                name="content"
                                defaultValue={editingText?.content}
                                required
                                placeholder="Insira o texto completo aqui..."
                                className="min-h-[200px]"
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                Salvar Texto
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
