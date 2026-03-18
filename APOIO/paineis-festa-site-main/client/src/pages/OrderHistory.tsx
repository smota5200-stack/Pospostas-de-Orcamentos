import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Package, Calendar, DollarSign, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Processando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  paid: <CheckCircle className="w-4 h-4" />,
  processing: <Package className="w-4 h-4" />,
  shipped: <Truck className="w-4 h-4" />,
  delivered: <CheckCircle className="w-4 h-4" />,
  cancelled: <AlertCircle className="w-4 h-4" />,
};

export default function OrderHistory() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  const ordersQuery = trpc.shop.orders.list.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
          <p className="text-gray-600 mb-8">Você precisa estar autenticado para visualizar seu histórico de pedidos.</p>
          <Button onClick={() => setLocation("/")} className="bg-pink-500 hover:bg-pink-600">
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  const orders = ordersQuery.data || [];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Meus Pedidos</h1>
          <p className="text-gray-600">Visualize o histórico e status de todos os seus pedidos</p>
        </div>

        {/* Resumo de Pedidos */}
        {orders.length > 0 && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total de Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{orders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Entregues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {orders.filter((o: any) => o.status === "delivered").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600">Em Processamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {orders.filter((o: any) => ["pending", "paid", "processing", "shipped"].includes(o.status)).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-600">Valor Total Gasto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  R$ {(orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0) / 100).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Pedidos */}
        {ordersQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-600 mb-6">Você ainda não realizou nenhuma compra.</p>
              <Button onClick={() => setLocation("/catalogo")} className="bg-pink-500 hover:bg-pink-600">
                Explorar Catálogo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                      <CardDescription>
                        {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardDescription>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                        STATUS_COLORS[order.status]
                      }`}
                    >
                      {STATUS_ICONS[order.status]}
                      {STATUS_LABELS[order.status]}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                      <p className="text-2xl font-bold text-gray-900">R$ {(order.totalAmount / 100).toFixed(2)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="text-gray-900">{order.customerEmail || "-"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Telefone</p>
                      <p className="text-gray-900">{order.customerPhone || "-"}</p>
                    </div>
                  </div>

                  {order.shippingAddress && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <p className="text-sm text-gray-600 mb-2">Endereço de Entrega</p>
                      <p className="text-gray-900">{order.shippingAddress}</p>
                    </div>
                  )}

                  {order.notes && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Notas</p>
                      <p className="text-gray-900">{order.notes}</p>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <Button variant="outline" className="flex-1">
                      Ver Detalhes
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Rastrear Entrega
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
