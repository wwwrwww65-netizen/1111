"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const db_1 = require("@repo/db");
exports.wishlistRouter = (0, trpc_1.router)({
    // Get user's wishlist
    getWishlist: trpc_1.protectedProcedure
        .query(async ({ ctx }) => {
        var _a;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        const wishlistItems = await db_1.db.wishlistItem.findMany({
            where: { userId },
            include: {
                product: {
                    include: {
                        category: true,
                        reviews: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return { wishlistItems };
    }),
    // Add product to wishlist
    addToWishlist: trpc_1.protectedProcedure
        .input(zod_1.z.object({ productId: zod_1.z.string() }))
        .mutation(async ({ input, ctx }) => {
        var _a;
        const { productId } = input;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        // Check if product exists
        const product = await db_1.db.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new Error('Product not found');
        }
        // Check if already in wishlist
        const existingItem = await db_1.db.wishlistItem.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });
        if (existingItem) {
            throw new Error('Product already in wishlist');
        }
        const wishlistItem = await db_1.db.wishlistItem.create({
            data: {
                userId,
                productId,
            },
            include: {
                product: {
                    include: {
                        category: true,
                    },
                },
            },
        });
        return { wishlistItem };
    }),
    // Remove product from wishlist
    removeFromWishlist: trpc_1.protectedProcedure
        .input(zod_1.z.object({ productId: zod_1.z.string() }))
        .mutation(async ({ input, ctx }) => {
        var _a;
        const { productId } = input;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        await db_1.db.wishlistItem.delete({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });
        return { success: true };
    }),
    // Clear wishlist
    clearWishlist: trpc_1.protectedProcedure
        .mutation(async ({ ctx }) => {
        var _a;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        await db_1.db.wishlistItem.deleteMany({
            where: { userId },
        });
        return { success: true };
    }),
    // Move wishlist item to cart
    moveToCart: trpc_1.protectedProcedure
        .input(zod_1.z.object({ productId: zod_1.z.string(), quantity: zod_1.z.number().min(1).default(1) }))
        .mutation(async ({ input, ctx }) => {
        var _a;
        const { productId, quantity } = input;
        const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        // Get or create cart
        let cart = await db_1.db.cart.findUnique({
            where: { userId },
        });
        if (!cart) {
            cart = await db_1.db.cart.create({
                data: { userId },
            });
        }
        // Check if product already in cart
        const existingCartItem = await db_1.db.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId,
                },
            },
        });
        if (existingCartItem) {
            // Update quantity
            await db_1.db.cartItem.update({
                where: { id: existingCartItem.id },
                data: { quantity: existingCartItem.quantity + quantity },
            });
        }
        else {
            // Add to cart
            await db_1.db.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity,
                },
            });
        }
        // Remove from wishlist
        await db_1.db.wishlistItem.delete({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });
        return { success: true };
    }),
});
//# sourceMappingURL=wishlist.js.map