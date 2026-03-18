import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ruler, Weight, Circle, Zap, Heart, Star } from "lucide-react";
import { useState } from "react";

const CYLINDER_SPECS = [
  {
    size: "P",
    altura: "30 cm",
    diametro: "15 cm",
    peso: "0,5 kg",
    area: "1.413 cm²",
    recomendacao: "Pequenos espaços, mesas de doces",
    preco: "R$ 79,90",
  },
  {
    size: "M",
    altura: "45 cm",
    diametro: "20 cm",
    peso: "0,8 kg",
    area: "2.827 cm²",
    recomendacao: "Espaços médios, festas padrão",
    preco: "R$ 99,90",
  },
  {
    size: "G",
    altura: "60 cm",
    diametro: "25 cm",
    peso: "1,2 kg",
    area: "4.712 cm²",
    recomendacao: "Grandes espaços, entrada de eventos",
    preco: "R$ 149,90",
  },
];

const COMPARISON_DATA = [
  {
    feature: "Altura",
    p: "30 cm",
    m: "45 cm",
    g: "60 cm",
    retangular: "Variável",
  },
  {
    feature: "Diâmetro",
    p: "15 cm",
    m: "20 cm",
    g: "25 cm",
    retangular: "Variável",
  },
  {
    feature: "Peso",
    p: "0,5 kg",
    m: "0,8 kg",
    g: "1,2 kg",
    retangular: "2-5 kg",
  },
  {
    feature: "Área de Impressão",
    p: "1.413 cm²",
    m: "2.827 cm²",
    g: "4.712 cm²",
    retangular: "6.000+ cm²",
  },
  {
    feature: "Montagem",
    p: "Muito Fácil",
    m: "Fácil",
    g: "Fácil",
    retangular: "Requer Suporte",
  },
  {
    feature: "Portabilidade",
    p: "Excelente",
    m: "Boa",
    g: "Boa",
    retangular: "Difícil",
  },
  {
    feature: "Ideal Para",
    p: "Mesas, Pequenos Espaços",
    m: "Festas Padrão",
    g: "Grandes Eventos",
    retangular: "Backdrop Principal",
  },
];

const USE_CASES = [
  {
    title: "Aniversários Infantis",
    description: "Perfeito para decorar mesas de doces e criar um ambiente festivo",
    icon: "🎂",
    recommended: "P ou M",
  },
  {
    title: "Casamentos",
    description: "Ideal para entrada de convidados e decoração de ambientes",
    icon: "💒",
    recommended: "M ou G",
  },
  {
    title: "Eventos Corporativos",
    description: "Excelente para branding e decoração de espaços profissionais",
    icon: "🏢",
    recommended: "G",
  },
  {
    title: "Festas de Debutante",
    description: "Crie um ambiente elegante e sofisticado com cilindros decorados",
    icon: "👑",
    recommended: "M ou G",
  },
  {
    title: "Confraternizações",
    description: "Múltiplos cilindros para decorar diferentes áreas do evento",
    icon: "🎉",
    recommended: "P, M ou G",
  },
  {
    title: "Formaturas",
    description: "Destaque a formatura com cilindros personalizados",
    icon: "🎓",
    recommended: "M ou G",
  },
];

export default function Sizes() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Guia Completo de Tamanhos
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Escolha o tamanho perfeito de cilindro para seu evento. Comparamos especificações técnicas e recomendações de uso.
          </p>
        </div>

        {/* Cards de Tamanhos */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {CYLINDER_SPECS.map((spec) => (
            <Card
              key={spec.size}
              className={`border-2 cursor-pointer transition-all duration-300 ${
                selectedSize === spec.size
                  ? "border-pink-500 shadow-xl bg-gradient-to-br from-pink-50 to-purple-50"
                  : "border-gray-200 hover:border-pink-300"
              }`}
              onClick={() => setSelectedSize(selectedSize === spec.size ? null : spec.size)}
            >
              <CardHeader className="text-center">
                <div className="text-5xl font-bold text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text mb-2">
                  {spec.size}
                </div>
                <CardTitle className="text-2xl">{spec.altura}</CardTitle>
                <CardDescription>{spec.recomendacao}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Ruler className="w-5 h-5 text-pink-500" />
                    <span>Altura: {spec.altura}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Circle className="w-5 h-5 text-purple-500" />
                    <span>Diâmetro: {spec.diametro}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Weight className="w-5 h-5 text-pink-500" />
                    <span>Peso: {spec.peso}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Zap className="w-5 h-5 text-purple-500" />
                    <span>Área: {spec.area}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-2xl font-bold text-gray-900 mb-4">
                    {spec.preco}
                  </div>
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                    Comprar Agora
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabela Comparativa */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Tabela Comparativa Detalhada
          </h2>

          <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Especificação</th>
                  <th className="px-6 py-4 text-center font-semibold">Tamanho P</th>
                  <th className="px-6 py-4 text-center font-semibold">Tamanho M</th>
                  <th className="px-6 py-4 text-center font-semibold">Tamanho G</th>
                  <th className="px-6 py-4 text-center font-semibold">Painel Retangular</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((row, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700">
                      {row.p}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700">
                      {row.m}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700">
                      {row.g}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700">
                      {row.retangular}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Casos de Uso */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Casos de Uso Recomendados
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {USE_CASES.map((useCase, idx) => (
              <Card key={idx} className="border-gray-200 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="text-4xl mb-3">{useCase.icon}</div>
                  <CardTitle>{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{useCase.description}</p>
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">
                      Recomendado: <span className="text-pink-600">{useCase.recommended}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Dicas de Escolha */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-8 border border-pink-200 mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            💡 Dicas para Escolher o Tamanho Ideal
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-pink-500 text-white">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Espaço Disponível</h3>
                  <p className="text-gray-600 text-sm">
                    Meça o espaço onde o cilindro será colocado. P é ideal para mesas, M para espaços médios e G para grandes áreas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-purple-500 text-white">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Tipo de Evento</h3>
                  <p className="text-gray-600 text-sm">
                    Eventos pequenos e intimistas: P. Eventos padrão: M. Grandes eventos e entrada: G.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-pink-500 text-white">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Quantidade</h3>
                  <p className="text-gray-600 text-sm">
                    Você pode combinar múltiplos cilindros de tamanhos diferentes para criar composições únicas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-purple-500 text-white">
                    4
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Design Personalizado</h3>
                  <p className="text-gray-600 text-sm">
                    Todos os tamanhos podem ser personalizados com seu design. Consulte nossos especialistas!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Pronto para Escolher?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Fale com nossos especialistas para encontrar a solução perfeita para seu evento
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-6 text-lg">
              Falar com Especialista
            </Button>
            <Button variant="outline" className="border-pink-500 text-pink-600 hover:bg-pink-50 px-8 py-6 text-lg">
              Ver Catálogo Completo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
