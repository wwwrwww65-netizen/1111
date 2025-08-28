"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const db_1 = require("@repo/db");
exports.productsRouter = (0, trpc_1.router)({
    list: trpc_1.publicProcedure
        .input(zod_1.z.object({
        limit: zod_1.z.number().min(1).max(100).nullish(),
        cursor: zod_1.z.string().nullish(),
    }))
        .query(async ({ input, ctx }) => {
        var _a;
        const limit = (_a = input.limit) !== null && _a !== void 0 ? _a : 10;
        const { cursor } = input;
        const items = await ctx.prisma.product.findMany({
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: 'desc' },
        });
        let nextCursor = undefined;
        if (items.length > limit) {
            const nextItem = items.pop();
            nextCursor = nextItem.id;
        }
        return { items, nextCursor };
    }),
    getById: trpc_1.publicProcedure
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .query(async ({ input }) => {
        const product = await db_1.db.product.findUnique({
            where: { id: input.id },
            include: {
                category: true,
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
//# sourceMappingURL=products.js.map