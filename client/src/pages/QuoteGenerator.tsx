import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, FileText, Download, Building2, Calendar, FileCheck, CircleDollarSign, Percent, Phone, Mail, Clock, CreditCard, Image as ImageIcon, Upload, CloudUpload } from "lucide-react";
import logoP3 from "../assets/logo-p3.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { Client } from "@shared/schema";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
// @ts-ignore
import html2pdf from "html2pdf.js";

type LineItem = {
  id: string;
  quantity: number;
  description: string;
  unitPrice: number;
  warranty: string;
};

type QuoteData = {
  contactName: string;
  company: string;
  contactDepartment: string;
  currency: string;
  customCurrency: string;
  anniversaryDate: string;
  validityDate: string;
  validityDays: string;
  responsiblePhone: string;
  responsibleEmail: string;
  paymentTerms: string;
  notes: string;
  commissionRate: number;
  items: LineItem[];
  referenceImages: string[];
};

function formatPhone(phone: string) {
  if (!phone) return "";
  const cleaned = ('' + phone).replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6, 10)}`;
  }
  return phone;
}

export default function QuoteGenerator({ params }: { params?: { id?: string } }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isEditing = !!params?.id;

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => fetch("/api/clients").then(r => r.json()),
  });

  const { data: budgetToEdit } = useQuery({
    queryKey: [`/api/budgets/${params?.id}`],
    queryFn: () => fetch(`/api/budgets/${params?.id}`).then(r => r.json()),
    enabled: isEditing,
  });

  const { data: nextIdData } = useQuery<{ nextId: number }>({
    queryKey: ["/api/budgets-next-id"],
    queryFn: () => fetch("/api/budgets-next-id").then(r => r.json()),
    enabled: !isEditing,
  });

  const proposalNumber = isEditing
    ? (budgetToEdit?.proposalId ? String(budgetToEdit.proposalId).padStart(5, '0') : 'XXXXX')
    : (nextIdData?.nextId ? String(nextIdData.nextId).padStart(5, '0') : '...');

  const [data, setData] = useState<QuoteData>({
    contactName: "",
    company: "",
    contactDepartment: "",
    currency: "BRL",
    customCurrency: "",
    anniversaryDate: "",
    validityDate: "",
    validityDays: "",
    responsiblePhone: "",
    responsibleEmail: "",
    paymentTerms: "",
    notes: "",
    commissionRate: 0,
    items: [],
    referenceImages: [],
  });

  const [proRata, setProRata] = useState({
    baseValue: 0,
    totalDays: 30,
    usedDays: 0,
    description: "Serviço Pro-rata"
  });

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const addProRataItem = () => {
    if (proRata.baseValue <= 0 || proRata.usedDays <= 0) {
      toast({ title: "Atenção", description: "Preencha o valor e os dias utilizados.", variant: "destructive" });
      return;
    }
    const valuePerDay = proRata.baseValue / (proRata.totalDays || 1);
    const calculatedValue = valuePerDay * proRata.usedDays;

    setData({
      ...data,
      items: [
        ...data.items,
        {
          id: Math.random().toString(36).substring(7),
          quantity: 1,
          description: `${proRata.description} (${proRata.usedDays}/${proRata.totalDays} dias)`,
          unitPrice: parseFloat(calculatedValue.toFixed(2)),
          warranty: "Pro-rata",
        },
      ],
    });
    toast({ title: "Item Adicionado", description: "Cálculo pro-rata adicionado aos itens." });
  };

  useEffect(() => {
    if (budgetToEdit && clients.length > 0) {
      const client = clients.find(c => c.name === budgetToEdit.clientName);
      let validityDays = "";
      let parsedValidityDate = "";
      if (budgetToEdit.validityDate) {
        parsedValidityDate = new Date(budgetToEdit.validityDate).toISOString().split('T')[0];
        const createdDate = budgetToEdit.createdAt ? new Date(budgetToEdit.createdAt) : new Date();
        createdDate.setHours(0, 0, 0, 0);
        const validDate = new Date(budgetToEdit.validityDate);
        validDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((validDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        validityDays = `${diffDays} dias`;
      }
      const standardCurrencies = ["BRL", "USD", "EUR"];
      const isCustomCurrency = budgetToEdit.currency && !standardCurrencies.includes(budgetToEdit.currency);
      const sendDate = budgetToEdit.createdAt
        ? new Date(budgetToEdit.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      setData({
        contactName: budgetToEdit.clientName || "",
        company: client?.company || "",
        contactDepartment: "",
        currency: isCustomCurrency ? "CUSTOM" : (budgetToEdit.currency || "BRL"),
        customCurrency: isCustomCurrency ? budgetToEdit.currency : "",
        anniversaryDate: sendDate,
        validityDate: parsedValidityDate,
        validityDays: validityDays,
        responsiblePhone: client?.phone || "",
        responsibleEmail: client?.email || "",
        paymentTerms: budgetToEdit.paymentTerms || "",
        notes: budgetToEdit.notes || "",
        commissionRate: 0,
        items: budgetToEdit.items || [],
        referenceImages: budgetToEdit.referenceImages || [],
      });
    }
  }, [budgetToEdit, clients]);

  const calculateTotal = useMemo(() => {
    return data.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  }, [data.items]);

  const calculateCommission = useMemo(() => {
    return (calculateTotal * data.commissionRate) / 100;
  }, [calculateTotal, data.commissionRate]);

  const addItem = () => {
    setData({
      ...data,
      items: [
        ...data.items,
        {
          id: Math.random().toString(36).substring(7),
          quantity: 1,
          description: "",
          unitPrice: 0,
          warranty: "",
        },
      ],
    });
  };

  const removeItem = (id: string) => {
    setData({
      ...data,
      items: data.items.filter((item) => item.id !== id),
    });
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setData({
      ...data,
      items: data.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const generatePDF = async () => {
    setIsExportDialogOpen(false);
    toast({ title: "Gerando PDF...", description: "Aguarde enquanto preparamos o seu arquivo." });
    const element = document.getElementById('prop-document');
    if (!element) return;
    const filename = `Orcamento_${data.contactName.replace(/[^a-z0-9]/gi, '_') || 'Avulso'}.pdf`;
    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' }
    };
    try {
      await html2pdf().from(element).set(opt).save();
      toast({ title: "Sucesso!", description: `PDF baixado: ${filename}` });
    } catch (err) {
      console.error("PDF error:", err);
    }
  };

  const [isUploadingDrive, setIsUploadingDrive] = useState(false);

  const saveToGoogleDrive = async () => {
    setIsExportDialogOpen(false);
    toast({ title: "Gerando PDF...", description: "Preparando o arquivo para o Google Drive." });
    const element = document.getElementById('prop-document');
    if (!element) return;
    const filename = `Orcamento_${data.contactName.replace(/[^a-z0-9]/gi, '_') || 'Avulso'}.pdf`;
    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' }
    };
    try {
      setIsUploadingDrive(true);
      const pdfBase64 = await html2pdf().from(element).set(opt).outputPdf('datauristring');

      toast({ title: "Enviando...", description: "Fazendo upload para o Google Drive." });
      const res = await fetch("/api/drive/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, base64Data: pdfBase64 })
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "Erro desconhecido ao enviar");
      }

      toast({
        title: "Sucesso!",
        description: "PDF salvo no Google Drive com sucesso.",
        action: responseData.webViewLink ? (
          <a href={responseData.webViewLink} target="_blank" rel="noreferrer" className="text-blue-500 underline ml-2 font-bold">Abrir</a>
        ) : undefined
      });
    } catch (err: any) {
      console.error("Drive upload error:", err);
      toast({ title: "Erro na Integração", description: err.message || "Falha ao salvar no Google Drive", variant: "destructive" });
    } finally {
      setIsUploadingDrive(false);
    }
  };

  const createBudgetMutation = useMutation({
    mutationFn: async (budgetData: any) => {
      const url = isEditing ? `/api/budgets/${params?.id}` : "/api/budgets";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetData),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao salvar orçamento no banco de dados.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "✓ Orçamento Salvo!",
        description: isEditing ? "O orçamento foi atualizado com sucesso." : "O orçamento foi salvo com sucesso nos seus registros.",
      });
      setLocation("/orcamentos");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Salvar",
        description: error.message || "Não foi possível salvar o orçamento.",
        variant: "destructive",
      });
    }
  });

  const handleGenerate = () => {
    if (!data.contactName || data.contactName.trim() === "") {
      toast({ title: "Atenção", description: "Preencha o nome do cliente ou empresa.", variant: "destructive" });
      return;
    }
    let calculatedValidityDate = data.validityDate;
    const match = data.validityDays.match(/(\d+)/);
    if (match) {
      const days = parseInt(match[1]);
      const start = data.anniversaryDate ? new Date(data.anniversaryDate) : new Date();
      start.setDate(start.getDate() + days);
      calculatedValidityDate = start.toISOString().split('T')[0];
    }
    const budgetPayload = {
      clientName: data.contactName,
      title: data.contactName || (budgetToEdit?.title || `Orçamento ${new Date().toLocaleDateString('pt-BR')}`),
      status: budgetToEdit?.status || "rascunho",
      totalValue: Math.round(calculateTotal * 100),
      currency: data.currency === "CUSTOM" ? data.customCurrency || "USD" : data.currency,
      validityDate: calculatedValidityDate,
      paymentTerms: data.paymentTerms,
      notes: data.notes,
      items: data.items,
      referenceImages: data.referenceImages,
    };
    createBudgetMutation.mutate(budgetPayload);
  };

  const formatCurrency = (value: number) => {
    const currencyToUse = data.currency === "CUSTOM" ? (data.customCurrency || "USD") : data.currency;
    return `${currencyToUse} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: 'rgb(221, 221, 221)' }}>
      <header className="border-b sticky top-0 z-10" style={{ backgroundColor: 'rgb(8, 21, 52)' }}>
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start" style={{ color: 'white' }}>
            <Building2 className="w-6 h-6" />
            <span className="font-heading font-semibold text-lg tracking-tight">Propostas</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setIsExportDialogOpen(true)} style={{ backgroundColor: 'rgb(8, 21, 52)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} className="hover:opacity-80 flex-1 sm:flex-none">
              <Download className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Exportar PDF</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} style={{ backgroundColor: 'rgb(8, 21, 52)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} className="hover:opacity-80 flex-1 sm:flex-none hidden sm:flex">
              <FileText className="w-4 h-4 mr-2" /> Imprimir
            </Button>
            <Button size="sm" onClick={handleGenerate} disabled={createBudgetMutation.isPending} style={{ backgroundColor: 'white', color: 'rgb(8, 21, 52)' }} className="font-semibold hover:opacity-80 w-full sm:w-auto mt-2 sm:mt-0">
              <Download className="w-4 h-4 mr-2" /> {createBudgetMutation.isPending ? "Salvando..." : "Salvar Orçamento"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-primary" /> Detalhes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Contato / Empresa (Cliente)</Label>
                  <datalist id="clients-list">
                    {clients.map(c => (
                      <option key={c.id} value={c.name}>{c.name} {c.company ? `- ${c.company}` : ''}</option>
                    ))}
                  </datalist>
                  <Input
                    list="clients-list"
                    placeholder="Digite ou selecione um cliente..."
                    value={data.contactName}
                    onChange={(e) => {
                      const clientName = e.target.value;
                      const client = clients.find(c => c.name === clientName);
                      if (client) {
                        setData({
                          ...data,
                          contactName: client.name,
                          company: client.company || "",
                          responsibleEmail: client.email || "",
                          responsiblePhone: client.phone || "",
                        });
                      } else {
                        setData({ ...data, contactName: clientName });
                      }
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Input placeholder="Nome da empresa" value={data.company} onChange={(e) => setData({ ...data, company: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>A/C (aos cuidados de:)</Label>
                    <Input placeholder="Ex: TI, Comercial" value={data.contactDepartment} onChange={(e) => setData({ ...data, contactDepartment: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Envio da Proposta</Label>
                    <Input type="date" value={data.anniversaryDate} onChange={(e) => setData({ ...data, anniversaryDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Validade da Proposta</Label>
                    <Input placeholder="Ex: 30 dias" value={data.validityDays} onChange={(e) => setData({ ...data, validityDays: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={data.responsiblePhone} onChange={(e) => setData({ ...data, responsiblePhone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={data.responsibleEmail} onChange={(e) => setData({ ...data, responsibleEmail: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Moeda</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={data.currency}
                      onChange={(e) => setData({ ...data, currency: e.target.value })}
                    >
                      <option value="USD">USD</option>
                      <option value="BRL">BRL</option>
                      <option value="EUR">EUR</option>
                      <option value="CUSTOM">Livre</option>
                    </select>
                  </div>
                  {data.currency === "CUSTOM" && (
                    <div className="space-y-2">
                      <Label>Código</Label>
                      <Input placeholder="Ex: GBP" value={data.customCurrency} onChange={(e) => setData({ ...data, customCurrency: e.target.value.toUpperCase() })} />
                    </div>
                  )}
                </div>

                <Separator className="my-2" />

                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Condições</TabsTrigger>
                    <TabsTrigger value="commission" className="flex gap-2"><Percent className="w-4 h-4" /> Comissão</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Pagamento</Label>
                      <Input value={data.paymentTerms} onChange={(e) => setData({ ...data, paymentTerms: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Notas</Label>
                      <Textarea rows={3} value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} />
                    </div>
                  </TabsContent>
                  <TabsContent value="commission" className="pt-4">
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 space-y-2">
                      <Label>Comissão (%)</Label>
                      <div className="flex gap-4 items-center">
                        <Input type="number" value={data.commissionRate} onChange={(e) => setData({ ...data, commissionRate: parseFloat(e.target.value) || 0 })} className="w-20" />
                        <div className="text-sm font-medium text-primary">{formatCurrency(calculateCommission)}</div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><CircleDollarSign className="w-5 h-5 text-primary" /> Itens</CardTitle>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="list">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="list" className="flex gap-2"><FileText className="w-4 h-4" /> Lista de Itens</TabsTrigger>
                    <TabsTrigger value="prorata" className="flex gap-2"><Clock className="w-4 h-4" /> Pro rata</TabsTrigger>
                    <TabsTrigger value="images" className="flex gap-2"><ImageIcon className="w-4 h-4" /> Imagens Ref.</TabsTrigger>
                  </TabsList>

                  <TabsContent value="list" className="space-y-4">
                    {data.items.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg bg-slate-50/50 space-y-3 relative">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4" /></Button>
                        <div className="pr-8"><Label className="text-xs">Descrição</Label><Input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="h-8" /></div>
                        <div className="grid grid-cols-4 gap-2">
                          <div><Label className="text-xs">Qtd</Label><Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)} className="h-8" /></div>
                          <div><Label className="text-xs">Preço Unit.</Label><Input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="h-8" /></div>
                          <div><Label className="text-xs">Total</Label><Input value={formatCurrency(item.quantity * item.unitPrice)} readOnly className="h-8 bg-slate-100 font-semibold" /></div>
                          <div><Label className="text-xs">Garantia</Label><Input value={item.warranty} onChange={(e) => updateItem(item.id, 'warranty', e.target.value)} className="h-8" /></div>
                        </div>
                      </div>
                    ))}
                    {data.items.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground italic">
                        Nenhum item adicionado à lista.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="prorata" className="space-y-4 border p-4 rounded-lg bg-blue-50/30">
                    <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                      <Clock className="w-4 h-4" /> Calculadora de Pro-rata
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Descrição do Item</Label>
                        <Input value={proRata.description} onChange={(e) => setProRata({ ...proRata, description: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Valor Base (Mensal)</Label>
                          <Input type="number" value={proRata.baseValue} onChange={(e) => setProRata({ ...proRata, baseValue: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Dias Totais do Período</Label>
                          <Input type="number" value={proRata.totalDays} onChange={(e) => setProRata({ ...proRata, totalDays: parseInt(e.target.value) || 30 })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Dias Utilizados (Tempo na mão)</Label>
                        <Input type="number" placeholder="Ex: 12" value={proRata.usedDays} onChange={(e) => setProRata({ ...proRata, usedDays: parseInt(e.target.value) || 0 })} />
                      </div>

                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Valor Calculado</p>
                          <p className="text-xl font-bold text-primary">
                            {formatCurrency((proRata.baseValue / (proRata.totalDays || 1)) * proRata.usedDays)}
                          </p>
                        </div>
                        <Button onClick={addProRataItem} className="bg-primary text-white">
                          <Plus className="w-4 h-4 mr-2" /> Adicionar ao Orçamento
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="images" className="space-y-4 border p-4 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                      <ImageIcon className="w-4 h-4" /> Imagens de Referência do Cliente
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Cole a URL de uma imagem aqui..."
                          id="image-url-input"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              if (input.value) {
                                setData({
                                  ...data,
                                  referenceImages: [...data.referenceImages, input.value]
                                });
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            const input = document.getElementById('image-url-input') as HTMLInputElement;
                            if (input && input.value) {
                              setData({
                                ...data,
                                referenceImages: [...data.referenceImages, input.value]
                              });
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Adicionar
                        </Button>
                      </div>

                      <div className="text-sm text-muted-foreground mb-4">
                        Ou clique no botão abaixo para selecionar arquivos do seu computador.
                      </div>

                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 border-slate-300">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-slate-400" />
                            <p className="mb-2 text-sm text-slate-500 font-semibold">Clique para fazer upload de imagens</p>
                            <p className="text-xs text-slate-500">PNG, JPG, JPEG (Max. 5MB recomendável)</p>
                          </div>
                          <input
                            id="dropzone-file"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            multiple
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                Object.values(e.target.files).forEach(file => {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result && typeof event.target.result === 'string') {
                                      setData(prev => ({
                                        ...prev,
                                        referenceImages: [...prev.referenceImages, event.target!.result as string]
                                      }));
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                });
                              }
                              e.target.value = ''; // Reset input
                            }}
                          />
                        </label>
                      </div>

                      {data.referenceImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                          {data.referenceImages.map((img, idx) => (
                            <div key={idx} className="relative group rounded-md overflow-hidden border">
                              <img src={img} alt={`Referência ${idx + 1}`} className="w-full h-32 object-cover" />
                              <button
                                onClick={() => {
                                  setData({
                                    ...data,
                                    referenceImages: data.referenceImages.filter((_, i) => i !== idx)
                                  });
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-12 xl:col-span-7 lg:sticky lg:top-24">
            <Card className="shadow-xl overflow-hidden">
              <div id="prop-document" className="bg-white">
                <div className="text-white p-6" style={{ backgroundColor: '#0f172a' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-2 shadow-lg">
                        <img src={logoP3} alt="P3 Logo" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none uppercase">
                          {data.contactName || "PROPOSTA COMERCIAL"}
                        </h2>
                        <p className="text-white/60 text-xs font-mono mt-1">Ref: {budgetToEdit?.proposalId ? String(budgetToEdit.proposalId).padStart(5, '0') : (new Date().getFullYear() + '-PROP-' + proposalNumber)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white/10 rounded-md px-3 py-2 border border-white/20">
                        <div className="w-5 h-5 bg-red-600 rounded-sm flex items-center justify-center mr-2">
                          <span className="text-[10px] font-bold text-white uppercase">A</span>
                        </div>
                        <span className="text-xs font-semibold text-white/90">Adobe</span>
                      </div>
                      <div className="flex items-center bg-white/10 rounded-md px-3 py-2 border border-white/20">
                        <div className="grid grid-cols-2 gap-0.5 mr-2">
                          <div className="w-2 h-2 bg-[#f25022]"></div>
                          <div className="w-2 h-2 bg-[#7fba00]"></div>
                          <div className="w-2 h-2 bg-[#00a4ef]"></div>
                          <div className="w-2 h-2 bg-[#ffb900]"></div>
                        </div>
                        <span className="text-xs font-semibold text-white/90">Microsoft</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm border-b border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Para</p>
                    <p className="font-bold text-slate-800 text-base">{data.company || '—'}</p>
                    {data.contactName && (
                      <p className="text-slate-500 mt-1">
                        A/C: {data.contactName} {data.contactDepartment ? `— ${data.contactDepartment}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="hidden sm:block"></div>
                  <div className="sm:text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data da Proposta</p>
                    <p className="font-bold text-slate-800 text-base">{new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-bold text-slate-700">Descrição</TableHead>
                          <TableHead className="text-center font-bold text-slate-700">Qtd</TableHead>
                          <TableHead className="text-right font-bold text-slate-700">Unitário</TableHead>
                          <TableHead className="text-right font-bold text-slate-700">Total</TableHead>
                          <TableHead className="font-bold text-slate-700">Garantia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.items.length > 0 ? (
                          data.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.description}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</TableCell>
                              <TableCell className="text-xs text-slate-500">{item.warranty}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-slate-400 italic">Nenhum item adicionado</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg min-w-[240px] text-right transform hover:scale-105 transition-transform duration-300">
                      <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Investimento Total</p>
                      <p className="text-3xl font-black">{formatCurrency(calculateTotal)}</p>
                    </div>
                  </div>

                  <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4" /> Condições de Pagamento
                      </h4>
                      <p className="text-amber-800 font-medium">{data.paymentTerms}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" /> Validade
                      </h4>
                      <p className="text-slate-800 font-medium">{data.validityDays}</p>
                    </div>
                  </div>

                  {data.notes && (
                    <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-900 mb-2">Observações Adicionais</h4>
                      <p className="text-slate-600 whitespace-pre-wrap">{data.notes}</p>
                    </div>
                  )}

                  {data.referenceImages.length > 0 && (
                    <div className="mt-8">
                      <h4 className="font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Imagens de Referência</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-12">
                        {data.referenceImages.map((img, idx) => (
                          <div key={idx} className="rounded-lg overflow-hidden border border-slate-200">
                            <img src={img} alt={`Ref ${idx}`} className="w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rodapé removido conforme solicitação */}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>

    <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar PDF</DialogTitle>
          <DialogDescription>
            Escolha para onde você deseja exportar o orçamento.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button 
            className="w-full justify-start h-12 text-base font-semibold" 
            onClick={generatePDF}
            variant="outline"
          >
            <Download className="mr-3 h-5 w-5" />
            Baixar Localmente (PDF)
          </Button>
          <Button 
            className="w-full justify-start h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white" 
            onClick={saveToGoogleDrive}
            disabled={isUploadingDrive}
          >
            <CloudUpload className="mr-3 h-5 w-5" />
            {isUploadingDrive ? "Salvando no Drive..." : "Salvar no Google Drive"}
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsExportDialogOpen(false)}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}