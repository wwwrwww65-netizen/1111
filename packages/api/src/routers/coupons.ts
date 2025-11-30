import { z } from 'zod';
import { router, publicProcedure } from '../trpc-setup';
import { protectedProcedure } from '../middleware/auth';
import { db } from '@repo/db';

// Feature flag utility: gate strict audience enforcement
function isAudienceEnforced(): boolean {
    try { return String(process.env.COUPONS_AUDIENCE_ENFORCE || '1') === '1'; } catch { return true; }
}

type AdvancedCouponRules = {
    enabled?: boolean;
    title?: string; // Display title for the coupon
    min?: number | null; // minimum order total required (overrides coupon.minOrderAmount if provided)
    max?: number | null; // maximum discount amount cap
    includes?: string[]; // e.g., ["category:catId", "brand:Nike", "sku:ABC", "product:prodId", "vendor:vendorId", "user:userId", "email:user@example.com"]
    excludes?: string[];
    schedule?: { from?: string | null; to?: string | null };
    limitPerUser?: number | null; // max number of uses per user
    paymentMethods?: string[] | null; // optional allow-list; enforcement depends on checkout flow
    audience?: { target?: string } | string; // Target audience: 'all', 'users', 'new'
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

    // If checking against items, we need to see if ANY item matches
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

// Helper to check if a specific item matches any of the include rules
function itemMatchesRules(item: { productId: string; sku?: string | null; brand?: string | null; categoryId?: string | null; vendorId?: string | null }, includes: string[]): boolean {
    if (!includes || includes.length === 0) return true;

    return includes.some(tag => {
        const [k, ...rest] = tag.split(':');
        const v = rest.join(':').trim();
        const key = (k || '').toLowerCase();
        if (!v) return false;

        switch (key) {
            case 'sku': return (item.sku || '').toLowerCase() === v.toLowerCase();
            case 'brand': return (item.brand || '').toLowerCase() === v.toLowerCase();
            case 'product': return item.productId === v;
            case 'category': return (item.categoryId || '') === v;
            case 'vendor': return (item.vendorId || '') === v;
            default: return false; // User/email tags don't apply to items
        }
    });
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
                    title: rules?.title || coupon.code, // Return title if available
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
            let eligibleAmount = orderTotal;

            if (rules) {
                // Enforce audience: 'new' vs 'users' with createdAt threshold for 'users'
                if (isAudienceEnforced()) {
                    const audRaw: any = (rules as any).audience?.target ?? (rules as any).audience ?? '';
                    const aud = String(audRaw || '').toLowerCase().trim();
                    const audNorm =
                        (!aud || aud === '') ? '' :
                            (aud === 'all' || aud === 'everyone' || aud === '*' || aud.includes('الجميع') ? 'all' :
                                (aud === 'users' || aud === 'registered' || aud === 'existing' || aud.includes('مسجل') ? 'users' :
                                    (aud === 'new' || aud === 'new_user' || aud === 'new_users' || aud === 'first' || aud === 'first_order' || aud.includes('الجدد') || aud.includes('الجديدة') ? 'new' : aud)));
                    if (audNorm) {
                        let isNewUser = false;
                        try {
                            const createdAt = order.user?.createdAt ? new Date(order.user.createdAt as any) : null;
                            const ageMs = createdAt ? (now.getTime() - createdAt.getTime()) : Number.MAX_SAFE_INTEGER;
                            const NEW_WINDOW_DAYS = Number(process.env.COUPON_NEW_USER_WINDOW_DAYS || 30);
                            const withinWindow = ageMs <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
                            const orderCount = await db.order.count({ where: { userId } } as any);
                            isNewUser = withinWindow || (Number(orderCount || 0) === 0);
                            if (audNorm === 'users' && createdAt && createdAt.getTime() > new Date(coupon.createdAt).getTime()) {
                                throw new Error('Coupon not eligible for recently registered users');
                            }
                        } catch { }
                        if (audNorm === 'new' && !isNewUser) throw new Error('Coupon is for new users only');
                    }
                }
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

                // Calculate eligible amount based on includes
                if (rules.includes && rules.includes.length > 0) {
                    eligibleAmount = 0;
                    for (const item of order.items) {
                        const itemCtx = {
                            productId: item.productId,
                            sku: item.product?.sku ?? null,
                            brand: item.product?.brand ?? null,
                            categoryId: item.product?.categoryId ?? null,
                            vendorId: item.product?.vendorId ?? null,
                        };
                        if (itemMatchesRules(itemCtx, rules.includes)) {
                            eligibleAmount += item.price * item.quantity;
                        }
                    }
                    if (eligibleAmount === 0) {
                        throw new Error('No eligible items for this coupon');
                    }
                }
            }

            let discountAmount = 0;
            discountAmount = coupon.discountType === 'PERCENTAGE'
                ? (eligibleAmount * coupon.discountValue) / 100
                : coupon.discountValue;

            // Ensure discount doesn't exceed order total (or eligible amount if we want to be strict, but usually total is the cap)
            discountAmount = Math.min(discountAmount, orderTotal);

            if (rules && rules.max != null) {
                discountAmount = Math.min(discountAmount, Number(rules.max));
            }

            // Atomic apply using a transaction with conditional increment
            await db.$transaction(async (tx) => {
                // prevent double apply for same order
                const prior = await tx.couponUsage.findUnique({ where: { couponId_userId_orderId: { couponId: coupon.id, userId, orderId } } });
                if (prior) throw new Error('Coupon already applied to this order');
                // global usage limit guard (conditional update)
                const updated = await tx.$executeRawUnsafe(
                    'UPDATE "Coupon" SET "currentUses" = "currentUses" + 1 WHERE id=$1 AND ("maxUses" IS NULL OR "currentUses" < "maxUses")',
                    coupon.id
                );
                if (!updated) throw new Error('Coupon usage limit exceeded');
                await tx.order.update({ where: { id: orderId }, data: { couponId: coupon.id, discountAmount } });
                await tx.couponUsage.create({ data: { couponId: coupon.id, userId, orderId } });
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

            // Filter coupons and attach rules info (title, etc)
            const availableCoupons: any[] = [];
            for (const c of coupons) {
                if (usedIds.includes(c.id)) continue;
                if (c.maxUses != null && c.currentUses >= c.maxUses) continue;

                const rules = await loadAdvancedRules(c.code);
                if (rules && rules.enabled === false) continue;
                if (rules && !dateInWindow(now, rules.schedule)) continue;

                // Resolve category names for display
                const resolvedIncludes: string[] = [];
                if (rules?.includes) {
                    for (const rule of rules.includes) {
                        const [type, val] = rule.split(':');
                        if (type === 'category') {
                            const cat = await db.category.findUnique({ where: { id: val }, select: { name: true } });
                            if (cat) resolvedIncludes.push(cat.name);
                            else resolvedIncludes.push('فئة محددة');
                        } else if (type === 'product') {
                            resolvedIncludes.push('منتج محدد');
                        } else if (type === 'brand') {
                            resolvedIncludes.push(val);
                        }
                    }
                }

                availableCoupons.push({
                    ...c,
                    title: rules?.title || c.code, // Use title from rules or fallback to code
                    includes: rules?.includes || [], // Raw rules
                    displayCategories: resolvedIncludes, // Resolved names for frontend
                });
            }

            return { coupons: availableCoupons };
        }),
});