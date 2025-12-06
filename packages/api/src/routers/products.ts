import { z } from 'zod';
import { publicProcedure, router } from '../trpc-setup';
import { db } from '@repo/db';

export const productsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ input, ctx }) => {
      const limit = input.limit ?? 10;
      const { cursor } = input;
      const items = await ctx.prisma.product.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });
      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }
      return { items, nextCursor };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const product = await db.product.findFirst({
        where: { OR: [{ id: input.id }, { seo: { slug: input.id } }] },
        include: {
          category: { select: { id: true, name: true } },
          reviews: { include: { user: { select: { name: true } } } },
          variants: true,
        },
      });
      if (!product) {
        throw new Error('Product not found');
      }
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
        : 0;
      return { ...product, averageRating: Math.round(avgRating * 10) / 10, reviewCount: product.reviews.length };
    }),
});
