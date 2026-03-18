import { jsPDF } from "jspdf";
import "jspdf-autotable";

export interface LeadReport {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  leads: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
    source: string;
    status: string;
    createdAt: Date;
  }>;
}

export function generateLeadsReportPDF(report: LeadReport, month: string): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(233, 30, 140); // Rosa
  doc.text("Painéis Express", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Relatório de Leads - ${month}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 20;

  // Resumo de Estatísticas
  doc.setFontSize(12);
  doc.setTextColor(123, 44, 191); // Roxo
  doc.text("Resumo de Estatísticas", 20, yPosition);

  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const stats = [
    `Total de Leads: ${report.totalLeads}`,
    `Leads Novos: ${report.newLeads}`,
    `Leads Contatados: ${report.contactedLeads}`,
    `Leads Qualificados: ${report.qualifiedLeads}`,
    `Taxa de Conversão: ${report.conversionRate.toFixed(2)}%`,
  ];

  stats.forEach((stat) => {
    doc.text(stat, 25, yPosition);
    yPosition += 7;
  });

  yPosition += 10;

  // Tabela de Leads
  doc.setFontSize(12);
  doc.setTextColor(123, 44, 191);
  doc.text("Detalhes dos Leads", 20, yPosition);

  yPosition += 10;

  const tableData = report.leads.map((lead) => [
    lead.name,
    lead.email,
    lead.phone || "-",
    lead.source,
    lead.status,
    new Date(lead.createdAt).toLocaleDateString("pt-BR"),
  ]);

  (doc as any).autoTable({
    head: [["Nome", "Email", "Telefone", "Fonte", "Status", "Data"]],
    body: tableData,
    startY: yPosition,
    margin: { left: 20, right: 20 },
    headStyles: {
      fillColor: [233, 30, 140],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Rodapé
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}

export function generateLeadsCSV(report: LeadReport): string {
  let csv = "Nome,Email,Telefone,Fonte,Status,Data\n";

  report.leads.forEach((lead) => {
    const row = [
      lead.name,
      lead.email,
      lead.phone || "-",
      lead.source,
      lead.status,
      new Date(lead.createdAt).toLocaleDateString("pt-BR"),
    ];
    csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
  });

  return csv;
}
