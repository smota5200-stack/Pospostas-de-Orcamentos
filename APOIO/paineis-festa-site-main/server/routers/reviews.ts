import { z } from "zod";
import { protectedProcedure, publicProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { reviews } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const reviewsRouter = router({
  // Listar avaliações aprovadas de um produto
  listByProduct: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      return await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.productId, input.productId), eq(reviews.status, "approved")))
        .orderBy(reviews.createdAt);
    }),

  // Criar nova avaliação
  create: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        rating: z.number().min(1).max(5),
        title: z.string().min(5).max(255),
        comment: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const result = await db.insert(reviews).values({
          userId: ctx.user.id,
          productId: input.productId,
          rating: input.rating,
          title: input.title,
          comment: input.comment,
          status: "pending",
        });

        return {
          success: true,
          message: "Avaliação enviada para moderação",
        };
      } catch (error) {
        console.error("[Reviews] Error creating review:", error);
        throw new Error("Erro ao criar avaliação");
      }
    }),

  // Listar avaliações pendentes (admin)
  listPending: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.status, "pending"))
      .orderBy(reviews.createdAt);
  }),

  // Aprovar avaliação (admin)
  approve: adminProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        await db
          .update(reviews)
          .set({ status: "approved", updatedAt: new Date() })
          .where(eq(reviews.id, input.reviewId));

        return { success: true };
      } catch (error) {
        console.error("[Reviews] Error approving review:", error);
        throw new Error("Erro ao aprovar avaliação");
      }
    }),

  // Rejeitar avaliação (admin)
  reject: adminProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        await db
          .update(reviews)
          .set({ status: "rejected", updatedAt: new Date() })
          .where(eq(reviews.id, input.reviewId));

        return { success: true };
      } catch (error) {
        console.error("[Reviews] Error rejecting review:", error);
        throw new Error("Erro ao rejeitar avaliação");
      }
    }),

  // Marcar como útil
  markHelpful: publicProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const review = await db.select().from(reviews).where(eq(reviews.id, input.reviewId));
        if (review.length === 0) {
          throw new Error("Review not found");
        }

        await db
          .update(reviews)
          .set({ helpful: (review[0].helpful || 0) + 1 })
          .where(eq(reviews.id, input.reviewId));

        return { success: true };
      } catch (error) {
        console.error("[Reviews] Error marking helpful:", error);
        throw new Error("Erro ao marcar como útil");
      }
    }),

  // Obter média de avaliações de um produto
  getAverageRating: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const productReviews = await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.productId, input.productId), eq(reviews.status, "approved")));

      if (productReviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
        };
      }

      const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
      const average = sum / productReviews.length;

      return {
        averageRating: Math.round(average * 10) / 10,
        totalReviews: productReviews.length,
      };
    }),
});
