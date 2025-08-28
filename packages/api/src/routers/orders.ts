import { z } from 'zod';
import { router } from '../trpc-setup';
import { protectedProcedure } from '../middleware/auth';
import { db } from '@repo/db';

export const ordersRouter = router({
  createOrder: protectedProcedure
    .input(z.object({ shippingAddressId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.userId;

      const cart = await db.cart.findUnique({
        where: { userId },
        include: {
          items: { include: { product: true } },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      const total = cart.items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

      const order = await db.order.create({
        data: {
          userId,
          status: 'PENDING',
          total,
          shippingAddressId: input.shippingAddressId,
          items: {
            create: cart.items.map((ci) => ({
              productId: ci.productId,
              quantity: ci.quantity,
              price: ci.product.price,
            })),
          },
        },
        include: { items: true },
      });

      // Clear cart
      await db.cartItem.deleteMany({ where: { cartId: cart.id } });

      return { order };
    }),

  listOrders: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user!.userId;
      const orders = await db.order.findMany({
        where: { userId },
        include: {
          items: { include: { product: { select: { id: true, name: true, images: true } } } },
          payment: true,
          shippingAddress: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return { orders };
    }),
});