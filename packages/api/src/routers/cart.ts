import { z } from 'zod';
import { router } from '../trpc-setup';
import { protectedProcedure } from '../middleware/auth';
import { db } from '@repo/db';

export const cartRouter = router({
  getCart: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user!.userId;
      let cart = await db.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, price: true, images: true, stockQuantity: true },
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
                  select: { id: true, name: true, price: true, images: true, stockQuantity: true },
                },
              },
            },
          },
        });
      }

      const subtotal = (cart?.items ?? []).reduce((sum, item) => sum + item.quantity * item.product.price, 0);

      return { cart, subtotal };
    }),

  addItem: protectedProcedure
    .input(z.object({ productId: z.string(), quantity: z.number().min(1).default(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.userId;
      const { productId, quantity } = input;

      let cart = await db.cart.findUnique({ where: { userId } });
      if (!cart) {
        cart = await db.cart.create({ data: { userId } });
      }

      const existing = await db.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });

      if (existing) {
        await db.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        });
      } else {
        await db.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
      }

      return { success: true };
    }),

  updateItem: protectedProcedure
    .input(z.object({ productId: z.string(), quantity: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.userId;
      const { productId, quantity } = input;

      const cart = await db.cart.findUnique({ where: { userId } });
      if (!cart) return { success: true };

      const existing = await db.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
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
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.userId;
      const { productId } = input;

      const cart = await db.cart.findUnique({ where: { userId } });
      if (!cart) return { success: true };

      const existing = await db.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
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