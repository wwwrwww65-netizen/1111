import { z } from 'zod';
import { router, publicProcedure } from '../trpc-setup';
import { protectedProcedure } from '../middleware/auth';
import { db } from '@repo/db';

type AdvancedCouponRules = {
  enabled?: boolean;
  min?: number | null; // minimum order total required (overrides coupon.minOrderAmount if provided)
  max?: number | null; // maximum discount amount cap
  includes?: string[]; // e.g., ["category:catId", "brand:Nike", "sku:ABC", "product:prodId", "vendor:vendorId", "user:userId", "email:user@example.com"]
  excludes?: string[];
  schedule?: { from?: string | null; to?: string | null };
  limitPerUser?: number | null; // max number of uses per user
  paymentMethods?: string[] | null; // optional allow-list; enforcement depends on checkout flow
};

async function loadAdvancedRules(couponCode: string): Promise<AdvancedCouponRules | null> {
  const key = `coupon_rules:${couponCode.toUpperCase()}`;
  const setting = await db.setting.findUnique({ where: { key } });
  return (setting?.value as unknown as AdvancedCouponRules) ?? null;
}

function dateInWindow(now: Date, schedule?: { from?: string | null; to?: string | null }): boolean {
  if (!schedule) return true;
  const fromOk = !schedule.from || now >= new Date(schedule.from);
  const toOk = !schedule.to || now <= new Date(schedule.to);
  return fromOk && toOk;
}

function matchesTag(tag: string, ctx: { userId?: string; userEmail?: string | null; items: Array<{ productId: string; sku?: string | null; brand?: string | null; categoryId?: string | null; vendorId?: string | null }> }): boolean {
  const [k, ...rest] = tag.split(':');
  const v = rest.join(':').trim();
  const key = (k || '').toLowerCase();
  if (!v) return false;
  switch (key) {
    case 'user':
      return (ctx.userId || '').toLowerCase() === v.toLowerCase();
    case 'email':
      return (ctx.userEmail || '').toLowerCase() === v.toLowerCase();
    case 'sku':
      return ctx.items.some(i => (i.sku || '').toLowerCase() === v.toLowerCase());
    case 'brand':
      return ctx.items.some(i => (i.brand || '').toLowerCase() === v.toLowerCase());
    case 'product':
      return ctx.items.some(i => i.productId === v);
    case 'category':
      return ctx.items.some(i => (i.categoryId || '') === v);
    case 'vendor':
      return ctx.items.some(i => (i.vendorId || '') === v);
    default:
      return false;
  }
}

function checkAdvancedRules(rules: AdvancedCouponRules | null, params: { now: Date; orderTotal: number; ctx: { userId?: string; userEmail?: string | null; items: Array<{ productId: string; sku?: string | null; brand?: string | null; categoryId?: string | null; vendorId?: string | null }> } }): { ok: boolean; reason?: string } {
  if (!rules) return { ok: true };
  if (rules.enabled === false) return { ok: false, reason: 'Coupon disabled by rules' };
  if (!dateInWindow(params.now, rules.schedule)) return { ok: false, reason: 'Coupon out of schedule' };
  if (rules.min != null && params.orderTotal < Number(rules.min)) return { ok: false, reason: 'Minimum order amount not met' };
  // includes: if provided, at least ONE must match
  if (rules.includes && rules.includes.length > 0) {
    const anyIncluded = rules.includes.some(t => matchesTag(t, params.ctx));
    if (!anyIncluded) return { ok: false, reason: 'Not eligible by include rules' };
  }
  // excludes: if any matches, reject
  if (rules.excludes && rules.excludes.length > 0) {
    const anyExcluded = rules.excludes.some(t => matchesTag(t, params.ctx));
    if (anyExcluded) return { ok: false, reason: 'Excluded by rules' };
  }
  return { ok: true };
}

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

      // Optional basic check for rules schedule/enabled
      const rules = await loadAdvancedRules(coupon.code);
      if (rules) {
        if (rules.enabled === false) throw new Error('Coupon is disabled');
        if (!dateInWindow(now, rules.schedule)) throw new Error('Coupon is not valid at this time');
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

      // Load order context for advanced rules evaluation
      const order = await db.order.findFirst({
        where: { id: orderId, userId },
        include: { items: { include: { product: true } }, user: true },
      });
      if (!order) throw new Error('Order not found');

      const rules = await loadAdvancedRules(coupon.code);
      if (rules) {
        // Enforce per-user limit if configured
        if (rules.limitPerUser != null) {
          const uses = await db.couponUsage.count({ where: { couponId: coupon.id, userId } });
          if (uses >= Number(rules.limitPerUser)) throw new Error('Per-user coupon usage limit exceeded');
        }
        const ctxObj = {
          userId,
          userEmail: order.user?.email ?? null,
          items: (order.items || []).map(it => ({
            productId: it.productId,
            sku: it.product?.sku ?? null,
            brand: it.product?.brand ?? null,
            categoryId: it.product?.categoryId ?? null,
            vendorId: it.product?.vendorId ?? null,
          })),
        };
        const check = checkAdvancedRules(rules, { now, orderTotal, ctx: ctxObj });
        if (!check.ok) throw new Error(check.reason || 'Coupon rules not satisfied');
      }

      let discountAmount = 0;
      discountAmount = coupon.discountType === 'PERCENTAGE'
        ? (orderTotal * coupon.discountValue) / 100
        : coupon.discountValue;
      discountAmount = Math.min(discountAmount, orderTotal);

      if (rules && rules.max != null) {
        discountAmount = Math.min(discountAmount, Number(rules.max));
      }

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