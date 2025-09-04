"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRouter = void 0;
const zod_1 = require("zod");
const trpc_setup_1 = require("../trpc-setup");
const auth_1 = require("../middleware/auth");
const db_1 = require("@repo/db");
exports.cartRouter = (0, trpc_setup_1.router)({
    getCart: auth_1.protectedProcedure
        .query(async ({ ctx }) => {
        var _a;
        const userId = ctx.user.userId;
        let cart = await db_1.db.cart.findUnique({
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
            await db_1.db.cart.create({ data: { userId } });
            cart = await db_1.db.cart.findUnique({
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
        const subtotal = ((_a = cart === null || cart === void 0 ? void 0 : cart.items) !== null && _a !== void 0 ? _a : []).reduce((sum, item) => sum + item.quantity * item.product.price, 0);
        return { cart, subtotal };
    }),
    addItem: auth_1.protectedProcedure
        .input(zod_1.z.object({ productId: zod_1.z.string(), quantity: zod_1.z.number().min(1).default(1) }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.userId;
        const { productId, quantity } = input;
        let cart = await db_1.db.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await db_1.db.cart.create({ data: { userId } });
        }
        const existing = await db_1.db.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });
        if (existing) {
            await db_1.db.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + quantity },
            });
        }
        else {
            await db_1.db.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
        }
        return { success: true };
    }),
    updateItem: auth_1.protectedProcedure
        .input(zod_1.z.object({ productId: zod_1.z.string(), quantity: zod_1.z.number().min(0) }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.userId;
        const { productId, quantity } = input;
        const cart = await db_1.db.cart.findUnique({ where: { userId } });
        if (!cart)
            return { success: true };
        const existing = await db_1.db.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });
        if (!existing)
            return { success: true };
        if (quantity === 0) {
            await db_1.db.cartItem.delete({ where: { id: existing.id } });
        }
        else {
            await db_1.db.cartItem.update({ where: { id: existing.id }, data: { quantity } });
        }
        return { success: true };
    }),
    removeItem: auth_1.protectedProcedure
        .input(zod_1.z.object({ productId: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.userId;
        const { productId } = input;
        const cart = await db_1.db.cart.findUnique({ where: { userId } });
        if (!cart)
            return { success: true };
        const existing = await db_1.db.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });
        if (existing) {
            await db_1.db.cartItem.delete({ where: { id: existing.id } });
        }
        return { success: true };
    }),
    clear: auth_1.protectedProcedure
        .mutation(async ({ ctx }) => {
        const userId = ctx.user.userId;
        const cart = await db_1.db.cart.findUnique({ where: { userId } });
        if (!cart)
            return { success: true };
        await db_1.db.cartItem.deleteMany({ where: { cartId: cart.id } });
        return { success: true };
    }),
});
//# sourceMappingURL=cart.js.map