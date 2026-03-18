import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Cart() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const cartQuery = trpc.shop.cart.getItems.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const removeItemMutation = trpc.shop.cart.removeItem.useMutation({
    onSuccess: () => {
      cartQuery.refetch();
      toast.success("Item removido do carrinho");
    },
    onError: () => {
      toast.error("Erro ao remover item");
    },
  });

  const checkoutMutation = trpc.shop.orders.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.sessionUrl) {
        window.open(data.sessionUrl, "_blank");
        toast.success("Redirecionando para o pagamento...");
      }
    },
    onError: (error) => {
      toast.error("Erro ao criar sessão de checkout: " + error.message);
      setIsCheckingOut(false);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300" />
            <h1 className="text-4xl font-bold text-gray-900">Carrinho Vazio</h1>
            <p className="text-xl text-gray-600">Faça login para visualizar seu carrinho</p>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-6 text-lg">
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const cartItems = cartQuery.data || [];
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalInReais = (totalAmount / 100).toFixed(2);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }

    if (!customerEmail) {
      toast.error("Por favor, insira seu email");
      return;
    }

    setIsCheckingOut(true);

    checkoutMutation.mutate({
      cartItems: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        customizationNotes: item.customizationNotes || undefined,
      })),
      customerEmail,
      customerPhone: customerPhone || undefined,
      shippingAddress: shippingAddress || undefined,
    });
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
          <h1 className="text-4xl font-bold text-gray-900">Seu Carrinho</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Itens do Carrinho */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="pt-12 pb-12 text-center">
                  <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 text-lg">Seu carrinho está vazio</p>
                  <Button
                    onClick={() => setLocation("/")}
                    className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                  >
                    Continuar Comprando
                  </Button>
                </CardContent>
              </Card>
            ) : (
              cartItems.map((item) => (
                <Card key={item.id} className="border-gray-200 hover:shadow-lg transition-all">
                  <CardContent className="pt-6">
                    <div className="flex gap-6">
                      {/* Imagem */}
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {item.product.image && (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Detalhes */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{item.product.description}</p>
                        {item.customizationNotes && (
                          <p className="text-sm text-purple-600 italic">Notas: {item.customizationNotes}</p>
                        )}
                        <div className="flex items-center gap-4 mt-4">
                          <span className="text-lg font-bold text-gray-900">
                            R$ {(item.product.price / 100).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-600">Qtd: {item.quantity}</span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemMutation.mutate({ cartItemId: item.id })}
                          disabled={removeItemMutation.isPending}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <span className="text-lg font-bold text-gray-900">
                          R$ {((item.product.price * item.quantity) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Resumo e Checkout */}
          <div className="space-y-6">
            {/* Resumo do Pedido */}
            <Card className="border-gray-200 sticky top-20">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>R$ {totalInReais}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frete:</span>
                  <span>A calcular</span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>R$ {totalInReais}</span>
                </div>
              </CardContent>
            </Card>

            {/* Informações de Entrega */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Informações de Entrega</CardTitle>
                <CardDescription>Preencha seus dados para o pedido</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Email</label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="border-gray-300"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Telefone</label>
                  <Input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="border-gray-300"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Endereço de Entrega</label>
                  <Textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Rua, número, complemento, cidade, estado, CEP"
                    className="border-gray-300 resize-none"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0 || isCheckingOut || checkoutMutation.isPending}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-6 text-lg font-bold"
                >
                  {isCheckingOut || checkoutMutation.isPending ? "Processando..." : "Ir para Pagamento"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
