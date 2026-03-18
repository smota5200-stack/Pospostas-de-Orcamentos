import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Zap, Heart, MessageCircle, ShoppingCart, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import LeadForm from "@/components/LeadForm";

/**
 * Design Philosophy: Modern Festive Elegance
 * - Color Palette: Rosa Vibrante (#E91E8C) + Roxo Profundo (#7B2CBF) + Dourado (#FFD700)
 * - Typography: Poppins (headings), Inter (body)
 * - Layout: Assimétrico com hero section destacada, grid de produtos, carrossel de depoimentos
 * - Animations: Fade-in suave, hover effects, scroll reveal
 */

const products = [
  {
    id: 1,
    name: "Painel Redondo 1.5m",
    description: "Sistema Veste Fácil com elástico",
    price: 79.90,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031897963/rnimjhBQPWRpyeSl.png",
    badge: "Mais Popular",
  },
  {
    id: 2,
    name: "Trio de Capas Cilindro",
    description: "Tamanhos P, M, G com acabamento premium",
    price: 99.90,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031897963/HHCKRMjllsvPfsPk.png",
  },
  {
    id: 3,
    name: "Kit Painel + Trio",
    description: "Economize 12% comprando o kit completo",
    price: 149.90,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031897963/MSItPkUPAuRdlZQJ.png",
    badge: "SAVE 15%",
  },
];

const testimonials = [
  {
    name: "Marina Silva",
    role: "Decoradora Profissional",
    text: "A qualidade de impressão é excepcional! Meus clientes adoram. Entrega rápida e atendimento impecável.",
    rating: 5,
  },
  {
    name: "João Santos",
    role: "Produtor de Eventos",
    text: "Painéis de excelente qualidade com cores vibrantes. Recomendo para qualquer tipo de evento.",
    rating: 5,
  },
  {
    name: "Carla Oliveira",
    role: "Mãe de Aniversariante",
    text: "Fácil de montar, ficou lindo na festa! Minha filha adorou. Voltarei a comprar com certeza.",
    rating: 5,
  },
];

const features = [
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Entrega Rápida",
    description: "3-5 dias úteis para sua porta",
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Veste Fácil",
    description: "Montagem prática com elástico",
  },
  {
    icon: <Star className="w-8 h-8" />,
    title: "Qualidade Premium",
    description: "Cores vibrantes e duráveis",
  },
  {
    icon: <MessageCircle className="w-8 h-8" />,
    title: "Atendimento Personalizado",
    description: "Consultoria via WhatsApp",
  },
];

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToCart = (product: typeof products[0]) => {
    if (!user) {
      toast.error("Por favor, faça login para adicionar ao carrinho");
      return;
    }
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Painéis Express
            </h1>
          </div>
          <nav className="hidden md:flex gap-8 items-center">
            <a href="/catalogo" className="text-gray-700 hover:text-pink-500 transition">Catálogo</a>
            <a href="/pedidos-personalizados" className="text-gray-700 hover:text-pink-500 transition">Personalizados</a>
            <a href="#depoimentos" className="text-gray-700 hover:text-pink-500 transition">Depoimentos</a>
            <a href="/carrinho">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white gap-2">
                <ShoppingCart className="w-4 h-4" />
                Carrinho
              </Button>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section - Assimétrico */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-20 md:py-32">
        {/* Confete Animado Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300 rounded-full opacity-20 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Copy */}
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                  Painéis de Festa que <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Transformam</span> Sua Celebração
                </h2>
                <p className="text-xl text-gray-600">
                  Impressão de alta qualidade, entrega rápida e fácil montagem. Tudo que você precisa para decorar com estilo.
                </p>
              </div>

              <div className="flex gap-4 pt-4 flex-wrap">
                <a href="/catalogo">
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-6 text-lg">
                    Explorar Catálogo
                  </Button>
                </a>
                <Button variant="outline" className="px-8 py-6 text-lg border-gray-300 hover:bg-gray-50">
                  Falar com Especialista
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex gap-6 pt-8 flex-wrap">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-gray-700">Entrega em 3-5 dias</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-gray-700">Qualidade Premium</span>
                </div>
              </div>
            </div>

            {/* Right Side - Image */}
            <div className="relative h-96 md:h-full flex items-center justify-center">
              <img
                src="/images/hero-painel-redondo.png"
                alt="Painel Redondo Festa"
                className="w-full h-full object-cover rounded-lg shadow-2xl"
                style={{
                  transform: `translateY(${scrollY * 0.1}px)`,
                  transition: "transform 0.3s ease-out",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Produtos Destacados */}
      <section id="produtos" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Nossos Produtos</h2>
            <p className="text-xl text-gray-600">Escolha entre nossa seleção de painéis premium</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product, idx) => (
              <div
                key={product.id}
                className="group animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-gray-200">
                  <div className="relative overflow-hidden h-64">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.badge && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                        {product.badge}
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold text-gray-900">
                      R$ {product.price.toFixed(2)}
                    </div>
                    <Button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    >
                      Adicionar ao Carrinho
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kits Promocionais */}
      <section id="kits" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Kits Especiais com Desconto</h2>
            <p className="text-xl text-gray-600">Economize comprando em conjunto</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 border-yellow-300 hover:shadow-xl transition-all">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="/images/kit-promocional.png"
                  alt="Kit Completo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-bold text-lg">
                  -15%
                </div>
              </div>
              <CardHeader>
                <CardTitle>Kit Painel + Trio Cilindros</CardTitle>
                <CardDescription>Solução completa para sua festa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-gray-900">
                  R$ 149,90
                  <span className="text-lg text-gray-500 line-through ml-2">R$ 179,80</span>
                </div>
                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                  Comprar Kit
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-300 hover:shadow-xl transition-all">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="/images/backdrop-retangular.png"
                  alt="Backdrop Retangular"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                  -10%
                </div>
              </div>
              <CardHeader>
                <CardTitle>Backdrop Retangular 3x2m</CardTitle>
                <CardDescription>Perfeito para fotos e decoração</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-gray-900">
                  R$ 189,90
                  <span className="text-lg text-gray-500 line-through ml-2">R$ 210,00</span>
                </div>
                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                  Comprar Agora
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="text-center space-y-4 animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-pink-500">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">O Que Nossos Clientes Dizem</h2>
            <p className="text-xl text-gray-600">Veja por que confiam em nós</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-gray-200 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
                    <div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <CardDescription>{testimonial.role}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-pink-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">Pronto para Decorar?</h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Entre em contato e receba uma consultoria gratuita sobre qual painel é perfeito para sua festa.
          </p>
          <Button className="bg-white text-pink-500 hover:bg-gray-100 px-8 py-6 text-lg font-bold gap-2">
            <MessageCircle className="w-5 h-5" />
            Falar com Especialista via WhatsApp
          </Button>
        </div>
      </section>

      {/* Lead Form Section */}
      <section className="bg-gradient-to-r from-pink-50 to-purple-50 py-20 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              Fale com Nossos Especialistas
            </h2>
            <p className="text-lg text-gray-600 text-center mb-8">
              Tem dúvidas sobre qual tamanho escolher? Quer um orçamento personalizado? Entre em contato conosco!
            </p>
            <LeadForm source="home" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">Painéis Express</h3>
              <p className="text-sm">Qualidade, rapidez e confiança para sua festa.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Produtos</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Painéis Redondos</a></li>
                <li><a href="#" className="hover:text-white transition">Cilindros</a></li>
                <li><a href="#" className="hover:text-white transition">Backdrops</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition">Contato</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm">
                <li>📧 contato@painelexpress.com.br</li>
                <li>📱 (11) 99999-9999</li>
                <li>💬 WhatsApp</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Painéis Express. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Floating CTA Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all hover:scale-110 gap-0 p-0 flex items-center justify-center">
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
