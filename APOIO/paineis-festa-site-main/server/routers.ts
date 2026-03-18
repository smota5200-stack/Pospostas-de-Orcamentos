import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { shopRouter } from "./routers/shop";
import { uploadRouter } from "./routers/upload";
import { adminRouter } from "./routers/admin";
import { leadsRouter } from "./routers/leads";
import { reportsRouter } from "./routers/reports";
import { reviewsRouter } from "./routers/reviews";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  shop: shopRouter,
  upload: uploadRouter,
  admin: adminRouter,
  leads: leadsRouter,
  reports: reportsRouter,
  reviews: reviewsRouter,
});

export type AppRouter = typeof appRouter;
