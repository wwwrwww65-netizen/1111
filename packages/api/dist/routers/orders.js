"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const db_1 = require("@repo/db");
exports.ordersRouter = (0, trpc_1.router)({
    createOrder: trpc_1.protectedProcedure
        .input(zod_1.z.object({ shippingAddressId: zod_1.z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.userId;
        const cart = await db_1.db.cart.findUnique({
            where: { userId },
            include: {
                items: { include: { product: true } },
            },
        });
        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }
        const total = cart.items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
        const order = await db_1.db.order.create({
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
        await db_1.db.cartItem.deleteMany({ where: { cartId: cart.id } });
        return { order };
    }),
    listOrders: trpc_1.protectedProcedure
        .query(async ({ ctx }) => {
        const userId = ctx.user.userId;
        const orders = await db_1.db.order.findMany({
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
//# sourceMappingURL=orders.js.map