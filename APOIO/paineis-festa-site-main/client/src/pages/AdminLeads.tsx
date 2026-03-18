import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Mail, Phone, Building2, MessageSquare, Filter, Search, CheckCircle, Clock, TrendingUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type LeadStatus = "new" | "contacted" | "qualified" | "lost";

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  lost: "Perdido",
};

export default function AdminLeads() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null);

  // Verificar se é admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-8">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => setLocation("/")} className="bg-pink-500 hover:bg-pink-600">
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  const leadsQuery = trpc.admin.leads.list.useQuery();
  const statsQuery = trpc.admin.leads.getStats.useQuery();
  const updateStatusMutation = trpc.admin.leads.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      leadsQuery.refetch();
      statsQuery.refetch();
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  // Filtrar leads
  const filteredLeads = (leadsQuery.data || []).filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !selectedStatus || lead.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gerenciar Leads</h1>
          <p className="text-gray-600">Visualize e gerencie todos os leads capturados</p>
        </div>

        {/* Stats Cards */}
        {statsQuery.data && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total de Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{statsQuery.data.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Novos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{statsQuery.data.new}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Qualificados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{statsQuery.data.qualified}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Taxa de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {statsQuery.data.total > 0
                    ? ((statsQuery.data.qualified / statsQuery.data.total) * 100).toFixed(1)
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome, email ou empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedStatus === null ? "default" : "outline"}
                onClick={() => setSelectedStatus(null)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Todos
              </Button>
              {(["new", "contacted", "qualified", "lost"] as LeadStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  onClick={() => setSelectedStatus(status)}
                  className={selectedStatus === status ? "bg-pink-500 hover:bg-pink-600" : ""}
                >
                  {STATUS_LABELS[status]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela de Leads */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {leadsQuery.isLoading ? (
            <div className="p-8 text-center text-gray-600">Carregando leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-gray-600">Nenhum lead encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Empresa</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fonte</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Data</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{lead.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <a href={`mailto:${lead.email}`} className="hover:text-pink-500">
                          {lead.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lead.company || "-"}</td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            updateStatusMutation.mutate({
                              id: lead.id,
                              status: e.target.value as LeadStatus,
                            })
                          }
                          className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer border-0 ${
                            STATUS_COLORS[lead.status]
                          }`}
                        >
                          {(["new", "contacted", "qualified", "lost"] as LeadStatus[]).map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{lead.source}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          Ver Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Total de Resultados */}
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredLeads.length} de {leadsQuery.data?.length || 0} leads
        </div>
      </div>
    </div>
  );
}
