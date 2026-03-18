import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { leads } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sendNewLeadNotification, sendLeadConfirmationEmail } from "../services/email";

export const leadsRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        email: z.string().email("Email inválido"),
        phone: z.string().optional(),
        company: z.string().optional(),
        message: z.string().optional(),
        source: z.enum(["home", "catalog", "contact"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const result = await db.insert(leads).values({
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company,
          message: input.message,
          source: input.source,
          status: "new",
        });

        // Enviar emails
        await Promise.all([
          sendNewLeadNotification(input),
          sendLeadConfirmationEmail(input.email, input.name),
        ]);

        return {
          success: true,
          id: result[0],
        };
      } catch (error) {
        console.error("[Leads] Error creating lead:", error);
        throw new Error("Erro ao criar lead");
      }
    }),

  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return [];
    }

    try {
      const result = await db.select().from(leads).orderBy(desc(leads.createdAt));
      return result;
    } catch (error) {
      console.error("[Leads] Error listing leads:", error);
      return [];
    }
  }),
});
