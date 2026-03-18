import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { customOrders, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { adminLeadsRouter } from "./admin-leads";

// Middleware para verificar se é admin
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new Error("Você não tem permissão para acessar este recurso");
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ========== PEDIDOS PERSONALIZADOS ==========
  customOrders: router({
    // Listar todos os pedidos personalizados (admin)
    listAll: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allOrders = await db
        .select()
        .from(customOrders)
        .orderBy(customOrders.createdAt);

      return allOrders;
    }),

    // Obter pedido personalizado por ID (admin)
    getById: adminProcedure
      .input(z.object({ customOrderId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const order = await db
          .select()
          .from(customOrders)
          .where(eq(customOrders.id, input.customOrderId));

        return order[0] || null;
      }),

    // Atualizar status e adicionar notas (admin)
    updateStatus: adminProcedure
      .input(z.object({
        customOrderId: z.number(),
        status: z.enum(["draft", "submitted", "approved", "rejected", "completed"]),
        estimatedPrice: z.number().optional(),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .update(customOrders)
          .set({
            status: input.status,
            estimatedPrice: input.estimatedPrice ? Math.round(input.estimatedPrice * 100) : undefined,
            adminNotes: input.adminNotes,
            updatedAt: new Date(),
          })
          .where(eq(customOrders.id, input.customOrderId));

        return { success: true };
      }),

    // Obter estatísticas de pedidos personalizados
    getStats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allOrders = await db.select().from(customOrders);

      const stats = {
        total: allOrders.length,
        draft: allOrders.filter(o => o.status === "draft").length,
        submitted: allOrders.filter(o => o.status === "submitted").length,
        approved: allOrders.filter(o => o.status === "approved").length,
        rejected: allOrders.filter(o => o.status === "rejected").length,
        completed: allOrders.filter(o => o.status === "completed").length,
        totalRevenue: allOrders
          .filter(o => o.estimatedPrice && o.status === "completed")
          .reduce((sum, o) => sum + (o.estimatedPrice || 0), 0),
      };

      return stats;
    }),

    // Filtrar pedidos por status
    filterByStatus: adminProcedure
      .input(z.object({
        status: z.enum(["draft", "submitted", "approved", "rejected", "completed"]),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const orders = await db
          .select()
          .from(customOrders)
          .where(eq(customOrders.status, input.status))
          .orderBy(customOrders.createdAt);

        return orders;
      }),

    // Buscar pedidos por título ou descrição
    search: adminProcedure
      .input(z.object({
        query: z.string().min(1),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Nota: MySQL LIKE é case-insensitive por padrão
        const orders = await db
          .select()
          .from(customOrders);

        // Filtrar em memória (alternativa: usar raw SQL com LIKE)
        const filtered = orders.filter(
          order =>
            order.title.toLowerCase().includes(input.query.toLowerCase()) ||
            (order.description?.toLowerCase().includes(input.query.toLowerCase()) ?? false)
        );

        return filtered;
      }),
  }),

  // ========== DASHBOARD ==========
  dashboard: router({
    // Obter resumo geral do dashboard
    getSummary: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allCustomOrders = await db.select().from(customOrders);

      const summary = {
        customOrders: {
          total: allCustomOrders.length,
          pending: allCustomOrders.filter(o => o.status === "submitted").length,
          approved: allCustomOrders.filter(o => o.status === "approved").length,
          completed: allCustomOrders.filter(o => o.status === "completed").length,
        },
        recentOrders: allCustomOrders
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5),
      };

      return summary;
    }),
  }),
  leads: adminLeadsRouter,
});
