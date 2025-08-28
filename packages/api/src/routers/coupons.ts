import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { protectedProcedure } from '../middleware/auth';
import { db } from '@repo/db';

export const couponsRouter = router({
  // Validate coupon code
  validateCoupon: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const { code } = input;

      const coupon = await db.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) throw new Error('Invalid coupon code');
      if (!coupon.isActive) throw new Error('Coupon is not active');

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        throw new Error('Coupon is not valid at this time');
      }

      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        throw new Error('Coupon usage limit exceeded');
      }

      return {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
        },
      };
    }),

  // Apply coupon to order
  applyCoupon: protectedProcedure
    .input(z.object({ couponCode: z.string(), orderTotal: z.number(), orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { couponCode, orderTotal, orderId } = input;
      const userId = ctx.user?.userId;
      if (!userId) throw new Error('User not authenticated');

      const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (!coupon) throw new Error('Invalid coupon code');
      if (!coupon.isActive) throw new Error('Coupon is not active');

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        throw new Error('Coupon is not valid at this time');
      }

      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        throw new Error('Coupon usage limit exceeded');
      }

      if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
        throw new Error(`Minimum order amount of $${coupon.minOrderAmount} required`);
      }

      const existingUsage = await db.couponUsage.findUnique({
        where: { couponId_userId_orderId: { couponId: coupon.id, userId, orderId } },
      });
      if (existingUsage) throw new Error('Coupon already applied to this order');

      let discountAmount = 0;
      discountAmount = coupon.discountType === 'PERCENTAGE'
        ? (orderTotal * coupon.discountValue) / 100
        : coupon.discountValue;
      discountAmount = Math.min(discountAmount, orderTotal);

      await db.order.update({
        where: { id: orderId },
        data: { couponId: coupon.id, discountAmount },
      });

      await db.couponUsage.create({ data: { couponId: coupon.id, userId, orderId } });

      await db.coupon.update({
        where: { id: coupon.id },
        data: { currentUses: coupon.currentUses + 1 },
      });

      return {
        discountAmount,
        finalTotal: orderTotal - discountAmount,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
      };
    }),

  // Remove coupon from order
  removeCoupon: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { orderId } = input;
      const userId = ctx.user?.userId;
      if (!userId) throw new Error('User not authenticated');

      const order = await db.order.findFirst({ where: { id: orderId, userId }, include: { coupon: true } });
      if (!order) throw new Error('Order not found');
      if (!order.couponId) throw new Error('No coupon applied to this order');

      await db.couponUsage.deleteMany({ where: { couponId: order.couponId, userId, orderId } });
      await db.order.update({ where: { id: orderId }, data: { couponId: null, discountAmount: 0 } });
      if (order.coupon) {
        await db.coupon.update({
          where: { id: order.coupon.id },
          data: { currentUses: Math.max(0, order.coupon.currentUses - 1) },
        });
      }
      return { success: true };
    }),

  // Get user's coupon usage history
  getCouponHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.userId;
      if (!userId) throw new Error('User not authenticated');

      const couponUsage = await db.couponUsage.findMany({
        where: { userId },
        include: { coupon: true },
        orderBy: { usedAt: 'desc' },
      });
      return { couponUsage };
    }),

  // Get available coupons for user
  getAvailableCoupons: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.userId;
      if (!userId) throw new Error('User not authenticated');

      const now = new Date();

      // Fetch active and currently valid coupons
      const coupons = await db.coupon.findMany({
        where: {
          isActive: true,
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
        orderBy: { discountValue: 'desc' },
      });

      const userCouponUsage = await db.couponUsage.findMany({
        where: { userId },
        select: { couponId: true },
      });
      const usedIds = userCouponUsage.map((u) => u.couponId);
      const availableCoupons = coupons
        .filter((c: { id: string; maxUses: number | null; currentUses: number }) => !usedIds.includes(c.id))
        .filter((c: { maxUses: number | null; currentUses: number }) => c.maxUses == null || c.currentUses < c.maxUses);

      return { coupons: availableCoupons };
    }),
});