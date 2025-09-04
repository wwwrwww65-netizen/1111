"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponsRouter = void 0;
const zod_1 = require("zod");
const trpc_setup_1 = require("../trpc-setup");
const auth_1 = require("../middleware/auth");
const db_1 = require("@repo/db");
exports.couponsRouter = (0, trpc_setup_1.router)({
    // Validate coupon code
    validateCoupon: trpc_setup_1.publicProcedure
        .input(zod_1.z.object({ code: zod_1.z.string() }))
        .mutation(async ({ input }) => {
        const { code } = input;
        const coupon = await db_1.db.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!coupon)
            throw new Error('Invalid coupon code');
        if (!coupon.isActive)
            throw new Error('Coupon is not active');
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
    applyCoupon: auth_1.protectedProcedure
        .input(zod_1.z.object({ couponCode: zod_1.z.string(), orderTotal: zod_1.z.number(), orderId: zod_1.z.string() }))
        .mutation(async ({ input, ctx }) => {
        var _a;
        const { couponCode, orderTotal, orderId } = input;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new Error('User not authenticated');
        const coupon = await db_1.db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
        if (!coupon)
            throw new Error('Invalid coupon code');
        if (!coupon.isActive)
            throw new Error('Coupon is not active');
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
        const existingUsage = await db_1.db.couponUsage.findUnique({
            where: { couponId_userId_orderId: { couponId: coupon.id, userId, orderId } },
        });
        if (existingUsage)
            throw new Error('Coupon already applied to this order');
        let discountAmount = 0;
        discountAmount = coupon.discountType === 'PERCENTAGE'
            ? (orderTotal * coupon.discountValue) / 100
            : coupon.discountValue;
        discountAmount = Math.min(discountAmount, orderTotal);
        await db_1.db.order.update({
            where: { id: orderId },
            data: { couponId: coupon.id, discountAmount },
        });
        await db_1.db.couponUsage.create({ data: { couponId: coupon.id, userId, orderId } });
        await db_1.db.coupon.update({
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
    removeCoupon: auth_1.protectedProcedure
        .input(zod_1.z.object({ orderId: zod_1.z.string() }))
        .mutation(async ({ input, ctx }) => {
        var _a;
        const { orderId } = input;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new Error('User not authenticated');
        const order = await db_1.db.order.findFirst({ where: { id: orderId, userId }, include: { coupon: true } });
        if (!order)
            throw new Error('Order not found');
        if (!order.couponId)
            throw new Error('No coupon applied to this order');
        await db_1.db.couponUsage.deleteMany({ where: { couponId: order.couponId, userId, orderId } });
        await db_1.db.order.update({ where: { id: orderId }, data: { couponId: null, discountAmount: 0 } });
        if (order.coupon) {
            await db_1.db.coupon.update({
                where: { id: order.coupon.id },
                data: { currentUses: Math.max(0, order.coupon.currentUses - 1) },
            });
        }
        return { success: true };
    }),
    // Get user's coupon usage history
    getCouponHistory: auth_1.protectedProcedure
        .query(async ({ ctx }) => {
        var _a;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new Error('User not authenticated');
        const couponUsage = await db_1.db.couponUsage.findMany({
            where: { userId },
            include: { coupon: true },
            orderBy: { usedAt: 'desc' },
        });
        return { couponUsage };
    }),
    // Get available coupons for user
    getAvailableCoupons: auth_1.protectedProcedure
        .query(async ({ ctx }) => {
        var _a;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new Error('User not authenticated');
        const now = new Date();
        // Fetch active and currently valid coupons
        const coupons = await db_1.db.coupon.findMany({
            where: {
                isActive: true,
                validFrom: { lte: now },
                validUntil: { gte: now },
            },
            orderBy: { discountValue: 'desc' },
        });
        const userCouponUsage = await db_1.db.couponUsage.findMany({
            where: { userId },
            select: { couponId: true },
        });
        const usedIds = userCouponUsage.map((u) => u.couponId);
        const availableCoupons = coupons
            .filter((c) => !usedIds.includes(c.id))
            .filter((c) => c.maxUses == null || c.currentUses < c.maxUses);
        return { coupons: availableCoupons };
    }),
});
//# sourceMappingURL=coupons.js.map