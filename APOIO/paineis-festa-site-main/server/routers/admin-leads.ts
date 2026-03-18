import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { leads } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminLeadsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Verificar se é admin
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      const result = await db
        .select()
        .from(leads)
        .orderBy(desc(leads.createdAt));
      return result;
    } catch (error) {
      console.error("[Admin Leads] Error listing leads:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const result = await db
          .select()
          .from(leads)
          .where(eq(leads.id, input.id))
          .limit(1);

        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
        }

        return result[0];
      } catch (error) {
        console.error("[Admin Leads] Error getting lead:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "qualified", "lost"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        await db
          .update(leads)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(leads.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("[Admin Leads] Error updating lead status:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      const allLeads = await db.select().from(leads);

      const stats = {
        total: allLeads.length,
        new: allLeads.filter((l) => l.status === "new").length,
        contacted: allLeads.filter((l) => l.status === "contacted").length,
        qualified: allLeads.filter((l) => l.status === "qualified").length,
        lost: allLeads.filter((l) => l.status === "lost").length,
      };

      return stats;
    } catch (error) {
      console.error("[Admin Leads] Error getting stats:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  filterByStatus: protectedProcedure
    .input(z.object({ status: z.enum(["new", "contacted", "qualified", "lost"]) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const result = await db
          .select()
          .from(leads)
          .where(eq(leads.status, input.status))
          .orderBy(desc(leads.createdAt));

        return result;
      } catch (error) {
        console.error("[Admin Leads] Error filtering leads:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const allLeads = await db.select().from(leads);

        const filtered = allLeads.filter(
          (lead) =>
            lead.name.toLowerCase().includes(input.query.toLowerCase()) ||
            lead.email.toLowerCase().includes(input.query.toLowerCase()) ||
            lead.company?.toLowerCase().includes(input.query.toLowerCase())
        );

        return filtered;
      } catch (error) {
        console.error("[Admin Leads] Error searching leads:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
