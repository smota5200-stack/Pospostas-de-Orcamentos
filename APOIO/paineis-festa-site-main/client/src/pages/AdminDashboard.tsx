import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState<"overview" | "pending" | "approved">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Verificar se é admin
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-gray-900">Acesso Negado</h1>
            <p className="text-xl text-gray-600">Você não tem permissão para acessar este painel.</p>
            <Button
              onClick={() => setLocation("/")}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-6 text-lg"
            >
              Voltar para Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Queries
  const summaryQuery = trpc.admin.dashboard.getSummary.useQuery();
  const allOrdersQuery = trpc.admin.customOrders.listAll.useQuery();
  const pendingOrdersQuery = trpc.admin.customOrders.filterByStatus.useQuery({ status: "submitted" });
  const approvedOrdersQuery = trpc.admin.customOrders.filterByStatus.useQuery({ status: "approved" });

  // Mutations
  const updateStatusMutation = trpc.admin.customOrders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Pedido atualizado com sucesso!");
      setSelectedOrder(null);
      setEstimatedPrice("");
      setAdminNotes("");
      summaryQuery.refetch();
      allOrdersQuery.refetch();
      pendingOrdersQuery.refetch();
      approvedOrdersQuery.refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar pedido: " + error.message);
    },
  });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <AlertCircle className="w-4 h-4" />;
      case "submitted":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
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

  const summary = summaryQuery.data;
  const allOrders = allOrdersQuery.data || [];
  const pendingOrders = pendingOrdersQuery.data || [];
  const approvedOrders = approvedOrdersQuery.data || [];

  let displayedOrders = allOrders;
  if (selectedTab === "pending") displayedOrders = pendingOrders;
  if (selectedTab === "approved") displayedOrders = approvedOrders;

  const filteredOrders = displayedOrders.filter(
    (order) =>
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const selectedOrderData = allOrders.find((o) => o.id === selectedOrder);

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
          <h1 className="text-4xl font-bold text-gray-900">Painel de Admin</h1>
        </div>

        {/* Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">Total de Pedidos</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.customOrders.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-blue-600 text-sm mb-2">Pendentes</p>
                  <p className="text-3xl font-bold text-blue-900">{summary.customOrders.pending}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-green-600 text-sm mb-2">Aprovados</p>
                  <p className="text-3xl font-bold text-green-900">{summary.customOrders.approved}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-purple-600 text-sm mb-2">Concluídos</p>
                  <p className="text-3xl font-bold text-purple-900">{summary.customOrders.completed}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lista de Pedidos */}
          <div className="lg:col-span-2 space-y-4">
            {/* Abas */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={selectedTab === "overview" ? "default" : "outline"}
                onClick={() => setSelectedTab("overview")}
                className={selectedTab === "overview" ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : ""}
              >
                Todos
              </Button>
              <Button
                variant={selectedTab === "pending" ? "default" : "outline"}
                onClick={() => setSelectedTab("pending")}
                className={selectedTab === "pending" ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : ""}
              >
                Pendentes
              </Button>
              <Button
                variant={selectedTab === "approved" ? "default" : "outline"}
                onClick={() => setSelectedTab("approved")}
                className={selectedTab === "approved" ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : ""}
              >
                Aprovados
              </Button>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por título ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>

            {/* Lista */}
            <div className="space-y-3">
              {allOrdersQuery.isLoading ? (
                <Card className="border-gray-200">
                  <CardContent className="pt-12 pb-12 text-center">
                    <p className="text-gray-600">Carregando pedidos...</p>
                  </CardContent>
                </Card>
              ) : filteredOrders.length === 0 ? (
                <Card className="border-gray-200">
                  <CardContent className="pt-12 pb-12 text-center">
                    <p className="text-gray-600">Nenhum pedido encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className={`border-gray-200 hover:shadow-lg transition-all cursor-pointer ${
                      selectedOrder === order.id ? "ring-2 ring-purple-500" : ""
                    }`}
                    onClick={() => {
                      setSelectedOrder(order.id);
                      setEstimatedPrice(order.estimatedPrice ? (order.estimatedPrice / 100).toString() : "");
                      setAdminNotes(order.adminNotes || "");
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{order.title}</CardTitle>
                          <CardDescription>{order.description}</CardDescription>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {order.imageUrl && (
                        <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={order.imageUrl}
                            alt={order.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>ID: {order.id}</span>
                        <span>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Painel de Edição */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              {selectedOrderData ? (
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle>Editar Pedido</CardTitle>
                    <CardDescription>ID: {selectedOrderData.id}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Preço Estimado (R$)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={estimatedPrice}
                        onChange={(e) => setEstimatedPrice(e.target.value)}
                        placeholder="0.00"
                        className="border-gray-300"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Notas do Admin
                      </label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Adicione notas sobre o design, feedback, etc."
                        className="border-gray-300 resize-none"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            customOrderId: selectedOrderData.id,
                            status: "approved",
                            estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
                            adminNotes: adminNotes || undefined,
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {updateStatusMutation.isPending ? "Salvando..." : "Aprovar"}
                      </Button>
                      <Button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            customOrderId: selectedOrderData.id,
                            status: "rejected",
                            adminNotes: adminNotes || undefined,
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {updateStatusMutation.isPending ? "Salvando..." : "Rejeitar"}
                      </Button>
                      <Button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            customOrderId: selectedOrderData.id,
                            status: "completed",
                            estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
                            adminNotes: adminNotes || undefined,
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {updateStatusMutation.isPending ? "Salvando..." : "Marcar como Concluído"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-gray-200">
                  <CardContent className="pt-12 pb-12 text-center">
                    <p className="text-gray-600">Selecione um pedido para editar</p>
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
