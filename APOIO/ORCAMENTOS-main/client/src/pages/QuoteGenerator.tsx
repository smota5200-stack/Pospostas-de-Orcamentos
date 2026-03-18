import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Download, Building2, FileCheck, CircleDollarSign, Percent, Eye, RefreshCcw, Cloud } from "lucide-react";
import logoMicrosoft from "../assets/logo-microsoft.png";
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
};

// Utility for formatting phone numbers e.g 11999999999 -> (11) 99999-9999
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

const initialQuoteData: QuoteData = {
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
};

declare global {
  interface Window {
    gapi?: any;
  }
}

const GOOGLE_DRIVE_CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID || "";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export default function QuoteGenerator({ params }: { params?: { id?: string } }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isEditing = !!params?.id;

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => fetch("/api/clients").then(r => r.json()),
  });

  const { data: budgetToEdit, isLoading: loadingBudget } = useQuery({
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

  const [data, setData] = useState<QuoteData>(initialQuoteData);

  useEffect(() => {
    if (budgetToEdit && clients.length > 0) {
      // Find client to auto-populate email/phone
      const client = clients.find(c => c.name === budgetToEdit.clientName);

      let validityDays = "";
      let parsedValidityDate = "";
      if (budgetToEdit.validityDate) {
        parsedValidityDate = new Date(budgetToEdit.validityDate).toISOString().split('T')[0];

        // Try to reverse calculate validity days based on created at (or today as fallback)
        const createdDate = budgetToEdit.createdAt ? new Date(budgetToEdit.createdAt) : new Date();
        createdDate.setHours(0, 0, 0, 0);
        const validDate = new Date(budgetToEdit.validityDate);
        validDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((validDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        validityDays = `${diffDays} dias`;
      }

      const standardCurrencies = ["BRL", "USD", "EUR"];
      const isCustomCurrency = budgetToEdit.currency && !standardCurrencies.includes(budgetToEdit.currency);

      // Fallback date: use budget createdAt if client date is unavailable
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
    toast({ title: "Gerando PDF...", description: "Aguarde enquanto preparamos o seu arquivo." });

    const element = document.getElementById('prop-document');
    if (!element) {
      toast({ title: "Erro", description: "O bloco da proposta não foi encontrado.", variant: "destructive" });
      return;
    }

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
      toast({ title: "Erro na geração", description: "Ocorreu um erro ao gerar o PDF.", variant: "destructive" });
    }
  };

  const createPdfBlob = async () => {
    const element = document.getElementById('prop-document');
    if (!element) return null;

    const filename = `Orcamento_${data.contactName.replace(/[^a-z0-9]/gi, '_') || 'Avulso'}.pdf`;
    const opt = {
      margin: 10,
      filename,
      image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' }
    };

    try {
      // Prefer `outputPdf` when available (html2pdf & jsPDF)
      // @ts-ignore
      const blob = await html2pdf().from(element).set(opt).outputPdf?.('blob');
      if (blob) return blob;

      // Fall back to general output() if outputPdf is not present
      // @ts-ignore
      return await html2pdf().from(element).set(opt).output('blob');
    } catch (err) {
      console.error("PDF error:", err);
      toast({ title: "Erro na geração", description: "Ocorreu um erro ao gerar o PDF.", variant: "destructive" });
      return null;
    }
  };

  const loadGapi = async () => {
    if (!GOOGLE_DRIVE_CLIENT_ID) return null;
    if (window.gapi) return window.gapi;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.onload = () => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              clientId: GOOGLE_DRIVE_CLIENT_ID,
              scope: GOOGLE_DRIVE_SCOPE,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            resolve(window.gapi);
          } catch (initErr) {
            reject(initErr);
          }
        });
      };
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  };

  const getDriveAccessToken = async () => {
    if (!GOOGLE_DRIVE_CLIENT_ID) return null;
    const gapi = await loadGapi();
    if (!gapi) return null;

    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance) return null;

    const user = authInstance.currentUser.get();
    if (!user.isSignedIn()) {
      await authInstance.signIn();
    }

    const authResponse = authInstance.currentUser.get().getAuthResponse(true);
    return authResponse?.access_token;
  };

  const uploadToDrive = async (blob: Blob, filename: string) => {
    const accessToken = await getDriveAccessToken();
    if (!accessToken) {
      throw new Error('Não foi possível obter token de acesso para o Google Drive.');
    }

    const boundary = 'driveupload-' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: filename,
      mimeType: 'application/pdf',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/pdf\r\n\r\n';

    const body = new Blob([multipartRequestBody, blob, closeDelimiter], {
      type: `multipart/related; boundary=${boundary}`,
    });

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao enviar para o Drive: ${response.status} ${text}`);
    }

    return response.json();
  };

  const previewPDF = async () => {
    toast({ title: "Gerando pré-visualização...", description: "Aguarde enquanto preparamos o documento." });
    const blob = await createPdfBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    toast({ title: "Pré-visualização aberta", description: "Uma nova aba foi aberta com o PDF." });
  };

  const saveToDrive = async () => {
    toast({ title: "Gerando arquivo...", description: "Aguarde enquanto preparamos o PDF." });
    const blob = await createPdfBlob();
    if (!blob) return;

    const filename = `Orcamento_${data.contactName.replace(/[^a-z0-9]/gi, '_') || 'Avulso'}.pdf`;

    // For users who want the file immediately as well, always trigger a download.
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    if (!GOOGLE_DRIVE_CLIENT_ID) {
      toast({
        title: "Arquivo pronto",
        description: "O PDF foi gerado. Faça upload manualmente para o Google Drive.",
      });
      return;
    }

    try {
      const result = await uploadToDrive(blob, filename);
      toast({
        title: "Enviado para o Drive",
        description: "O PDF foi salvo no seu Google Drive.",
      });
      if (result?.webViewLink) {
        window.open(result.webViewLink, '_blank');
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro",
        description: "Não foi possível enviar para o Google Drive. O arquivo foi baixado no navegador.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setData(initialQuoteData);
    toast({ title: "Formulário limpo", description: "Todos os campos foram resetados." });
  };

  const createBudgetMutation = useMutation({
    mutationFn: async (budgetData: any) => {
      const url = isEditing ? `/api/budgets/${params.id}` : "/api/budgets";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetData),
      });
      if (!res.ok) throw new Error("Erro ao salvar orçamento");
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
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o orçamento.",
        variant: "destructive",
      });
    }
  });

  const handleGenerate = () => {
    if (!data.contactName) {
      toast({ title: "Atenção", description: "Preencha o nome do cliente.", variant: "destructive" });
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

    // Formatting data for API matching schema
    const budgetPayload = {
      clientName: data.contactName,
      title: budgetToEdit?.title || "Orçamento " + new Date().toLocaleDateString('pt-BR'),
      status: budgetToEdit?.status || "rascunho",
      totalValue: Math.round(calculateTotal * 100), // integer cents
      currency: data.currency === "CUSTOM" ? data.customCurrency || "USD" : data.currency,
      validityDate: calculatedValidityDate,
      paymentTerms: data.paymentTerms,
      notes: data.notes,
      items: data.items,
    };

    createBudgetMutation.mutate(budgetPayload);
  };

  const formatCurrency = (value: number) => {
    const currencyToUse = data.currency === "CUSTOM" ? data.customCurrency || "USD" : data.currency;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyToUse.length === 3 ? currencyToUse : 'USD',
      }).format(value);
    } catch (e) {
      return `${currencyToUse} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="w-6 h-6" />
            <span className="font-heading font-semibold text-lg tracking-tight">Proposify</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="min-w-[220px] h-12 px-6 font-semibold bg-slate-600 hover:bg-slate-700 text-white"
              onClick={resetForm}
            >
              <RefreshCcw className="w-5 h-5" /> Limpar Formulário
            </Button>
            <Button
              size="lg"
              className="min-w-[220px] h-12 px-6 font-semibold bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={generatePDF}
            >
              <Download className="w-5 h-5" /> Baixar PDF
            </Button>
            <Button
              size="lg"
              className="min-w-[220px] h-12 px-6 font-semibold bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={saveToDrive}
            >
              <Cloud className="w-5 h-5" /> Salvar no Google Drive
            </Button>
            <Button
              size="lg"
              className="min-w-[220px] h-12 px-6 font-semibold bg-sky-700 hover:bg-sky-800 text-white"
              onClick={previewPDF}
            >
              <Eye className="w-5 h-5" /> Visualizar
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
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={data.contactName}
                    onChange={(e) => {
                      const clientName = e.target.value;
                      const client = clients.find(c => c.name === clientName);
                      if (client) {
                        setData({
                          ...data,
                          contactName: client.name,
                          company: client.company || "",
                          anniversaryDate: client.createdAt ? new Date(client.createdAt).toISOString().split('T')[0] : "",
                          responsibleEmail: client.email || "",
                          responsiblePhone: client.phone || "",
                        });
                      } else {
                        setData({ ...data, contactName: clientName });
                      }
                    }}
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.name}>{c.name} {c.company ? `- ${c.company}` : ''}</option>
                    ))}
                  </select>
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
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <Card className="shadow-xl overflow-hidden">
              <div id="prop-document" className="bg-white">
                <div className="text-white" style={{ backgroundColor: '#0f172a' }}>
                  {/* Top row: Logo + Title + Partner logos */}
                  <div className="px-6 pt-6 pb-4 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="bg-white rounded px-1 py-1 flex items-center">
                        <img src={logoP3} alt="P3" className="h-10 w-10 object-contain" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold tracking-wide">PROPOSTA COMERCIAL</h2>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>
                          Ref: {new Date().getFullYear()}-PROP-{proposalNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="#FF0000" className="w-7 h-7">
                          <path d="M15.1 2H24v20L15.1 2zM8.9 2H0v20L8.9 2zM12 9.4L17.6 22h-3.8l-1.6-4H8.1L12 9.4z" />
                        </svg>
                        <span className="text-white font-semibold text-sm">Adobe</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap" style={{ width: '20px', height: '20px', gap: '1px' }}>
                          <div style={{ width: '9px', height: '9px', backgroundColor: '#f25022' }}></div><div style={{ width: '9px', height: '9px', backgroundColor: '#7fba00' }}></div>
                          <div style={{ width: '9px', height: '9px', backgroundColor: '#00a4ef' }}></div><div style={{ width: '9px', height: '9px', backgroundColor: '#ffb900' }}></div>
                        </div>
                        <span className="text-white font-semibold text-sm">Microsoft</span>
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="mx-6" style={{ borderTop: '1px solid #1e293b' }}></div>

                  {/* Contact details grid */}
                  <div className="px-6 py-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Elaine Cristina Silva</p>
                      <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>
                        (11) 94832-7056
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">{data.company || data.contactName || '—'}</p>
                      {data.contactDepartment && (
                        <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>
                          {data.contactName} — {data.contactDepartment}
                        </p>
                      )}
                      <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>
                        {[formatPhone(data.responsiblePhone), data.responsibleEmail].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs mb-1 font-medium" style={{ color: '#94a3b8' }}>Data</p>
                      <p className="font-semibold">{new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-center">Qtde</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Preço Total</TableHead>
                        <TableHead>Garantia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                          <TableCell>{item.warranty || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-6 flex justify-end">
                    <div className="p-4 border rounded w-48 text-right" style={{ backgroundColor: '#f8fafc' }}>
                      <p className="text-xs text-muted-foreground uppercase">Total Geral</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(calculateTotal)}</p>
                    </div>
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 border rounded" style={{ backgroundColor: '#fefce8', borderColor: '#fef3c7' }}>
                      <p className="font-bold" style={{ color: '#854d0e' }}>Pagamento</p><p>{data.paymentTerms}</p>
                    </div>
                    <div className="p-3 border rounded" style={{ backgroundColor: '#f8fafc' }}>
                      <p className="font-bold" style={{ color: '#1e293b' }}>Validade da Proposta</p><p>{data.validityDays}</p>
                    </div>
                  </div>

                  {data.notes && (
                    <div className="mt-4 p-4 border rounded text-sm w-full" style={{ backgroundColor: '#f8fafc' }}>
                      <p className="font-bold mb-1" style={{ color: '#1e293b' }}>Observações</p>
                      <p className="whitespace-pre-wrap">{data.notes}</p>
                    </div>
                  )}

                  <Separator className="my-6" />

                  <div className="grid grid-cols-2 gap-4 text-[10px] uppercase tracking-wider" style={{ color: '#64748b' }}>
                    <div className="flex items-center gap-2">
                      {formatPhone(data.responsiblePhone)}
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      {data.responsibleEmail}
                    </div>
                  </div>


                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}