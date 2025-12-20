import { z } from 'zod';
import { router, publicProcedure } from '../trpc-setup';
import { protectedProcedure, optionalAuthMiddleware } from '../middleware/auth';
import { db } from '@repo/db';

export const cartRouter = router({
  getCart: publicProcedure
    .use(optionalAuthMiddleware)
    .query(async ({ ctx }) => {
      const userId = ctx.user?.userId;

      if (!userId) {
        return { cart: null, subtotal: 0 };
      }

      let cart = await db.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true, name: true, price: true, images: true, stockQuantity: true,
                  colors: { select: { name: true, primaryImageUrl: true, isPrimary: true, images: { select: { url: true }, orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } }
                },
              },
            },
          },
        },
      });

      if (!cart) {
        await db.cart.create({ data: { userId } });
        cart = await db.cart.findUnique({
          where: { userId },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true, name: true, price: true, images: true, stockQuantity: true,
                    colors: { select: { name: true, primaryImageUrl: true, isPrimary: true, images: { select: { url: true }, orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } }
                  },
                },
              },
            },
          },
        });
      }

      // Post-process items to prioritize hero image if no variant image is selected
      if (cart && cart.items) {
        cart.items.forEach((item: any) => {
          const p = item.product;
          if (Array.isArray(p.colors) && p.colors.length > 0) {
            const colors = p.colors;
            const defaultColor = colors.find((c: any) => c.isPrimary) || colors[0];
            const hero = defaultColor.primaryImageUrl || (Array.isArray(defaultColor.images) && defaultColor.images[0]?.url);
            if (hero) {
              const heroUrl = String(hero).trim();
              if (heroUrl) {
                p.images = p.images || [];
                p.images = p.images.filter((u: string) => u !== heroUrl);
                p.images.unshift(heroUrl);
              }
            }
          }
        });
      }

      const subtotal = (cart?.items ?? []).reduce((sum, item) => sum + item.quantity * item.product.price, 0);

      return { cart, subtotal };
    }),

  addItem: protectedProcedure
    .input(z.object({
      productId: z.string(),
      quantity: z.number().min(1).default(1),
      attributes: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.userId;
      const { productId, quantity, attributes } = input;

      let cart = await db.cart.findUnique({ where: { userId } });
      if (!cart) {
        cart = await db.cart.create({ data: { userId } });
      }

      const existingItems = await db.cartItem.findMany({
        where: { cartId: cart.id, productId },
      });

      const existing = existingItems.find(item => {
        const itemAttrs = (item.attributes as Record<string, any>) || {};
        const inputAttrs = attributes || {};
        const k1 = Object.keys(itemAttrs).sort();
        const k2 = Object.keys(inputAttrs).sort();
        if (k1.length !== k2.length) return false;
        return k1.every(k => itemAttrs[k] === inputAttrs[k]);
      });

      if (existing) {
        await db.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        });
      } else {
        await db.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
            attributes: attributes || {}
          }
        });
      }

      return { success: true };
    }),

  updateItem: protectedProcedure
    .input(z.object({
      productId: z.string(),
      quantity: z.number().min(0),
      attributes: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.userId;
      const { productId, quantity, attributes } = input;

      const cart = await db.cart.findUnique({ where: { userId } });
      if (!cart) return { success: true };

      const existingItems = await db.cartItem.findMany({
        where: { cartId: cart.id, productId },
      });

      const existing = existingItems.find(item => {
        const itemAttrs = (item.attributes as Record<string, any>) || {};
        const inputAttrs = attributes || {};
        const k1 = Object.keys(itemAttrs).sort();
        const k2 = Object.keys(inputAttrs).sort();
        if (k1.length !== k2.length) return false;
        return k1.every(k => itemAttrs[k] === inputAttrs[k]);
      });

      if (!existing) return { success: true };

      if (quantity === 0) {
        await db.cartItem.delete({ where: { id: existing.id } });
      } else {
        await db.cartItem.update({ where: { id: existing.id }, data: { quantity } });
      }

      return { success: true };
    }),

  removeItem: protectedProcedure
    .input(z.object({
      productId: z.string(),
      attributes: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.userId;
      const { productId, attributes } = input;

      const cart = await db.cart.findUnique({ where: { userId } });
      if (!cart) return { success: true };

      const existingItems = await db.cartItem.findMany({
        where: { cartId: cart.id, productId },
      });

      const existing = existingItems.find(item => {
        const itemAttrs = (item.attributes as Record<string, any>) || {};
        const inputAttrs = attributes || {};
        const k1 = Object.keys(itemAttrs).sort();
        const k2 = Object.keys(inputAttrs).sort();
        if (k1.length !== k2.length) return false;
        return k1.every(k => itemAttrs[k] === inputAttrs[k]);
      });

      if (existing) {
        await db.cartItem.delete({ where: { id: existing.id } });
      }
      return { success: true };
    }),

  clear: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.user!.userId;
      const cart = await db.cart.findUnique({ where: { userId } });
      if (!cart) return { success: true };
      await db.cartItem.deleteMany({ where: { cartId: cart.id } });
      return { success: true };
    }),
});