import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../trpc-setup';
import { db } from '@repo/db';

export const reviewsRouter = router({
  listByProduct: publicProcedure
    .input(z.object({ productId: z.string(), limit: z.number().min(1).max(50).default(20), cursor: z.string().nullish() }))
    .query(async ({ input }) => {
      const { productId, limit, cursor } = input;
      const rows = await db.review.findMany({
        where: { productId, isApproved: true },
        include: { user: { select: { name: true } } },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });
      let nextCursor: string | undefined;
      if (rows.length > limit) {
        const next = rows.pop();
        nextCursor = next?.id;
      }
      return { items: rows, nextCursor };
    }),

  create: protectedProcedure
    .input(z.object({ productId: z.string(), rating: z.number().min(1).max(5), comment: z.string().max(2000).optional() }))
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      // upsert to allow one review per user per product
      const created = await db.review.upsert({
        where: { productId_userId: { productId: input.productId, userId: user.userId } },
        create: { productId: input.productId, userId: user.userId, rating: input.rating, comment: input.comment || null, isApproved: true },
        update: { rating: input.rating, comment: input.comment || null },
      });
      return { review: created };
    }),
});

