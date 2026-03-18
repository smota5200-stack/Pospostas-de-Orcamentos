import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { leads } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { generateLeadsReportPDF, generateLeadsCSV } from "../services/pdf-reports";

export const reportsRouter = router({
  leads: router({
    generatePDF: adminProcedure
      .input(
        z.object({
          month: z.string().default(new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })),
          status: z.enum(["all", "new", "contacted", "qualified"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        try {
          // Buscar todos os leads
          let query = db.select().from(leads);
          const allLeads = await query;

          // Filtrar por status se necessário
          let filteredLeads = allLeads;
          if (input.status && input.status !== "all") {
            filteredLeads = allLeads.filter((lead: any) => lead.status === input.status);
          }

          // Calcular estatísticas
          const newLeads = filteredLeads.filter((l: any) => l.status === "new").length;
          const contactedLeads = filteredLeads.filter((l: any) => l.status === "contacted").length;
          const qualifiedLeads = filteredLeads.filter((l: any) => l.status === "qualified").length;
          const conversionRate = filteredLeads.length > 0 ? (qualifiedLeads / filteredLeads.length) * 100 : 0;

          const report = {
            totalLeads: filteredLeads.length,
            newLeads,
            contactedLeads,
            qualifiedLeads,
            conversionRate,
            leads: filteredLeads.map((lead: any) => ({
              id: lead.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              source: lead.source,
              status: lead.status,
              createdAt: lead.createdAt,
            })),
          };

          const pdfBuffer = generateLeadsReportPDF(report, input.month);

          return {
            success: true,
            fileName: `relatorio-leads-${input.month.replace(/\s+/g, "-")}.pdf`,
            buffer: pdfBuffer.toString("base64"),
          };
        } catch (error) {
          console.error("[Reports] Error generating PDF:", error);
          throw new Error("Erro ao gerar relatório");
        }
      }),

    generateCSV: adminProcedure
      .input(
        z.object({
          month: z.string().default(new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })),
          status: z.enum(["all", "new", "contacted", "qualified"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        try {
          // Buscar todos os leads
          let query = db.select().from(leads);
          const allLeads = await query;

          // Filtrar por status se necessário
          let filteredLeads = allLeads;
          if (input.status && input.status !== "all") {
            filteredLeads = allLeads.filter((lead: any) => lead.status === input.status);
          }

          // Calcular estatísticas
          const newLeads = filteredLeads.filter((l: any) => l.status === "new").length;
          const contactedLeads = filteredLeads.filter((l: any) => l.status === "contacted").length;
          const qualifiedLeads = filteredLeads.filter((l: any) => l.status === "qualified").length;
          const conversionRate = filteredLeads.length > 0 ? (qualifiedLeads / filteredLeads.length) * 100 : 0;

          const report = {
            totalLeads: filteredLeads.length,
            newLeads,
            contactedLeads,
            qualifiedLeads,
            conversionRate,
            leads: filteredLeads.map((lead: any) => ({
              id: lead.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              source: lead.source,
              status: lead.status,
              createdAt: lead.createdAt,
            })),
          };

          const csv = generateLeadsCSV(report);

          return {
            success: true,
            fileName: `relatorio-leads-${input.month.replace(/\s+/g, "-")}.csv`,
            content: csv,
          };
        } catch (error) {
          console.error("[Reports] Error generating CSV:", error);
          throw new Error("Erro ao gerar relatório");
        }
      }),
  }),
});
