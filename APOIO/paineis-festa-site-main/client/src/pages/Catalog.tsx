import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, Search, Filter, Ruler, Weight, Circle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const CATEGORIES = [
  { id: "infantil", label: "Infantil" },
  { id: "corporativo", label: "Corporativo" },
  { id: "casamento", label: "Casamento" },
  { id: "aniversario", label: "Aniversário" },
  { id: "festa", label: "Festa" },
];

const SIZES = [
  { id: "1.5m", label: "1.5m (Redondo)" },
  { id: "3x2m", label: "3x2m (Retangular)" },
  { id: "P", label: "P (Cilindro)" },
  { id: "M", label: "M (Cilindro)" },
  { id: "G", label: "G (Cilindro)" },
];

// Especificações de cilindros
const CYLINDER_SPECS: Record<string, { altura: string; diametro: string; peso: string; area: string }> = {
  "P": {
    altura: "30 cm",
    diametro: "15 cm",
    peso: "0,5 kg",
    area: "1.413 cm²"
  },
  "M": {
    altura: "45 cm",
    diametro: "20 cm",
    peso: "0,8 kg",
    area: "2.827 cm²"
  },
  "G": {
    altura: "60 cm",
    diametro: "25 cm",
    peso: "1,2 kg",
    area: "4.712 cm²"
  }
};

export default function Catalog() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 500]);

  const productsQuery = trpc.shop.products.list.useQuery();
  const addToCartMutation = trpc.shop.cart.addItem.useMutation({
    onSuccess: () => {
      toast.success("Produto adicionado ao carrinho!");
    },
    onError: () => {
      toast.error("Erro ao adicionar ao carrinho. Faça login primeiro.");
    },
  });

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    if (!productsQuery.data) return [];

    return productsQuery.data.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesCategory = selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);

      const matchesSize = selectedSizes.length === 0 ||
        selectedSizes.includes(product.size);

      const priceInReais = product.price / 100;
      const matchesPrice = priceInReais >= priceRange[0] && priceInReais <= priceRange[1];

      return matchesSearch && matchesCategory && matchesSize && matchesPrice;
    });
  }, [productsQuery.data, searchQuery, selectedCategories, selectedSizes, priceRange]);

  const handleAddToCart = (productId: number) => {
    if (!isAuthenticated) {
      toast.error("Por favor, faça login para adicionar ao carrinho");
      return;
    }
    addToCartMutation.mutate({
      productId,
      quantity: 1,
    });
  };

  const getCylinderSpecs = (size: string) => {
    return CYLINDER_SPECS[size] || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Catálogo de Produtos</h1>
          <p className="text-xl text-gray-600">Explore nossa seleção completa de painéis de festa</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filtros */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300"
                />
              </div>

              {/* Categorias */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Categorias
                </h3>
                {CATEGORIES.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, cat.id]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== cat.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-gray-700">{cat.label}</span>
                  </label>
                ))}
              </div>

              {/* Tamanhos */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900">Tamanhos</h3>
                {SIZES.map((size) => (
                  <label key={size.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSizes.includes(size.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSizes([...selectedSizes, size.id]);
                        } else {
                          setSelectedSizes(selectedSizes.filter(s => s !== size.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-gray-700">{size.label}</span>
                  </label>
                ))}
              </div>

              {/* Faixa de Preço */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900">Preço</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      placeholder="Mín"
                      className="border-gray-300"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 500])}
                      placeholder="Máx"
                      className="border-gray-300"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    R$ {priceRange[0].toFixed(2)} - R$ {priceRange[1].toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Info Cilindros */}
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Medidas dos Cilindros</h3>
                <div className="space-y-3">
                  {Object.entries(CYLINDER_SPECS).map(([size, specs]) => (
                    <div key={size} className="text-xs">
                      <div className="font-semibold text-gray-900 mb-1">Tamanho {size}</div>
                      <div className="space-y-1 text-gray-700">
                        <div className="flex items-center gap-2">
                          <Ruler className="w-3 h-3 text-pink-500" />
                          <span>Altura: {specs.altura}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Circle className="w-3 h-3 text-purple-500" />
                          <span>Diâmetro: {specs.diametro}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Weight className="w-3 h-3 text-pink-500" />
                          <span>Peso: {specs.peso}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Produtos */}
          <div className="lg:col-span-3">
            {productsQuery.isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Carregando produtos...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">Nenhum produto encontrado</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const cylinderSpecs = getCylinderSpecs(product.size);
                  
                  return (
                    <Card key={product.id} className="border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col">
                      {/* Imagem */}
                      <div className="relative overflow-hidden h-64 bg-gray-100">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        {product.badge && (
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                            {product.badge}
                          </div>
                        )}
                      </div>

                      {/* Conteúdo */}
                      <CardHeader>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {product.category} • {product.size}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4 flex-1 flex flex-col">
                        <p className="text-gray-600 text-sm">{product.description}</p>

                        {/* Especificações de Cilindro */}
                        {cylinderSpecs && (
                          <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-xs">
                            <div className="font-semibold text-gray-900 mb-2">Especificações:</div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Ruler className="w-3 h-3 text-pink-500" />
                              <span>Altura: {cylinderSpecs.altura}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Circle className="w-3 h-3 text-purple-500" />
                              <span>Diâmetro: {cylinderSpecs.diametro}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Weight className="w-3 h-3 text-pink-500" />
                              <span>Peso: {cylinderSpecs.peso}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-auto">
                          <span className="text-2xl font-bold text-gray-900">
                            R$ {(product.price / 100).toFixed(2)}
                          </span>
                        </div>
                        <Button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={addToCartMutation.isPending}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Adicionar ao Carrinho
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
