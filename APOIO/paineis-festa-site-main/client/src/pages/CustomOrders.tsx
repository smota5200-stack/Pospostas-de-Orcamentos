import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ImageUpload";
import { trpc } from "@/lib/trpc";
import { Plus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function CustomOrders() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
  });

  const customOrdersQuery = trpc.shop.customOrders.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createOrderMutation = trpc.shop.customOrders.create.useMutation({
    onSuccess: () => {
      toast.success("Pedido personalizado criado com sucesso!");
      setFormData({ title: "", description: "", imageUrl: "" });
      setShowForm(false);
      customOrdersQuery.refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar pedido: " + error.message);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-gray-900">Pedidos Personalizados</h1>
            <p className="text-xl text-gray-600">Faça login para criar pedidos personalizados</p>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-6 text-lg">
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const customOrders = customOrdersQuery.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Por favor, insira um título");
      return;
    }
    createOrderMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Rascunho",
      submitted: "Enviado",
      approved: "Aprovado",
      rejected: "Rejeitado",
      completed: "Concluído",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold text-gray-900">Pedidos Personalizados</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lista de Pedidos */}
          <div className="lg:col-span-2 space-y-4">
            {customOrdersQuery.isLoading ? (
              <Card className="border-gray-200">
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-gray-600">Carregando pedidos...</p>
                </CardContent>
              </Card>
            ) : customOrders.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-gray-600 text-lg mb-4">Você ainda não tem pedidos personalizados</p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Pedido Personalizado
                  </Button>
                </CardContent>
              </Card>
            ) : (
              customOrders.map((order) => (
                <Card key={order.id} className="border-gray-200 hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{order.title}</CardTitle>
                        <CardDescription>{order.description}</CardDescription>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.imageUrl && (
                      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={order.imageUrl}
                          alt={order.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Data de Criação</p>
                        <p className="font-medium text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      {order.estimatedPrice && (
                        <div>
                          <p className="text-gray-600">Preço Estimado</p>
                          <p className="font-medium text-gray-900">
                            R$ {(order.estimatedPrice / 100).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                    {order.adminNotes && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Notas do Administrador</p>
                        <p className="text-sm text-gray-900">{order.adminNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Formulário de Criação */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              {!showForm ? (
                <Button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-6 text-lg gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Novo Pedido Personalizado
                </Button>
              ) : (
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle>Criar Pedido Personalizado</CardTitle>
                    <CardDescription>Descreva seu painel ideal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                          Título do Painel *
                        </label>
                        <Input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Ex: Painel Festa Unicórnio"
                          className="border-gray-300"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                          Descrição
                        </label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Descreva os detalhes, cores, tema, etc."
                          className="border-gray-300 resize-none"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                          Imagem de Referência
                        </label>
                        <ImageUpload
                          onImageUpload={(url) => setFormData({ ...formData, imageUrl: url })}
                          maxSize={5}
                        />
                      </div>

                      <div className="space-y-2">
                        <Button
                          type="submit"
                          disabled={createOrderMutation.isPending}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                        >
                          {createOrderMutation.isPending ? "Criando..." : "Criar Pedido"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowForm(false)}
                          className="w-full"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
