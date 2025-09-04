"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const zod_1 = require("zod");
const trpc_setup_1 = require("../trpc-setup");
const auth_1 = require("../middleware/auth");
const db_1 = require("@repo/db");
// Admin schemas
const createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string(),
    price: zod_1.z.number().positive(),
    images: zod_1.z.array(zod_1.z.string()),
    categoryId: zod_1.z.string(),
    vendorId: zod_1.z.string().optional(),
    stockQuantity: zod_1.z.number().int().min(0),
    sku: zod_1.z.string().optional(),
    weight: zod_1.z.number().optional(),
    dimensions: zod_1.z.string().optional(),
    brand: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isActive: zod_1.z.boolean().default(true),
});
const updateProductSchema = createProductSchema.partial().extend({
    id: zod_1.z.string(),
});
const createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
    parentId: zod_1.z.string().optional(),
});
const updateCategorySchema = createCategorySchema.partial().extend({
    id: zod_1.z.string(),
});
const updateOrderStatusSchema = zod_1.z.object({
    orderId: zod_1.z.string(),
    status: zod_1.z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
    trackingNumber: zod_1.z.string().optional(),
});
const createCouponSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    discountType: zod_1.z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: zod_1.z.number().positive(),
    minOrderAmount: zod_1.z.number().optional(),
    maxUses: zod_1.z.number().int().positive().optional(),
    validFrom: zod_1.z.string(),
    validUntil: zod_1.z.string(),
    isActive: zod_1.z.boolean().default(true),
});
const updateUserSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    role: zod_1.z.enum(['USER', 'ADMIN']).optional(),
    isVerified: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.adminRouter = (0, trpc_setup_1.router)({
    // Dashboard statistics
    getDashboardStats: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .query(async () => {
        const [totalUsers, totalProducts, totalOrders, totalRevenue, recentOrders, lowStockProducts, topSellingProducts, monthlyRevenue,] = await Promise.all([
            // Total users
            db_1.db.user.count(),
            // Total products
            db_1.db.product.count(),
            // Total orders
            db_1.db.order.count(),
            // Total revenue
            db_1.db.order.aggregate({
                where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
                _sum: { total: true },
            }),
            // Recent orders
            db_1.db.order.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true, email: true } },
                    items: {
                        include: {
                            product: { select: { name: true } },
                        },
                    },
                },
            }),
            // Low stock products
            db_1.db.product.findMany({
                where: { stockQuantity: { lte: 10 } },
                take: 10,
                orderBy: { stockQuantity: 'asc' },
            }),
            // Top selling products
            db_1.db.orderItem.groupBy({
                by: ['productId'],
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 10,
            }),
            // Monthly revenue (last 6 months)
            db_1.db.order.groupBy({
                by: ['status'],
                where: {
                    createdAt: {
                        gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
                    },
                },
                _sum: { total: true },
            }),
        ]);
        // Get product details for top selling
        const topSellingProductIds = topSellingProducts.map((item) => item.productId);
        const topSellingProductDetails = await db_1.db.product.findMany({
            where: { id: { in: topSellingProductIds } },
            select: { id: true, name: true, price: true, images: true },
        });
        const topSellingWithDetails = topSellingProducts.map((item) => {
            const product = topSellingProductDetails.find((p) => p.id === item.productId);
            return {
                product,
                totalSold: item._sum.quantity || 0,
            };
        });
        return {
            stats: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue: totalRevenue._sum.total || 0,
            },
            recentOrders,
            lowStockProducts,
            topSellingProducts: topSellingWithDetails,
            monthlyRevenue,
        };
    }),
    // Product management
    createProduct: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(createProductSchema)
        .mutation(async ({ input }) => {
        var _a;
        let nextSku = input.sku;
        if (!nextSku && input.vendorId) {
            const vendor = await db_1.db.vendor.findUnique({ where: { id: input.vendorId } });
            if (vendor === null || vendor === void 0 ? void 0 : vendor.vendorCode) {
                const prefix = vendor.vendorCode + '-';
                const last = await db_1.db.product.findFirst({ where: { vendorId: input.vendorId, sku: { startsWith: prefix } }, orderBy: { createdAt: 'desc' } });
                let n = 0;
                if ((last === null || last === void 0 ? void 0 : last.sku) && last.sku.startsWith(prefix)) {
                    const tail = last.sku.substring(prefix.length);
                    const parsed = parseInt(tail, 10);
                    if (!isNaN(parsed))
                        n = parsed;
                }
                nextSku = `${prefix}${n + 1}`;
            }
        }
        const product = await db_1.db.product.create({
            data: { ...input, sku: (_a = nextSku !== null && nextSku !== void 0 ? nextSku : input.sku) !== null && _a !== void 0 ? _a : null },
            include: { category: true },
        });
        return { product };
    }),
    updateProduct: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(updateProductSchema)
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const product = await db_1.db.product.update({
            where: { id },
            data,
            include: { category: true },
        });
        return { product };
    }),
    deleteProduct: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ input }) => {
        await db_1.db.product.delete({
            where: { id: input.id },
        });
        return { success: true };
    }),
    getProducts: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(zod_1.z.object({
        page: zod_1.z.number().min(1).default(1),
        limit: zod_1.z.number().min(1).max(100).default(20),
        search: zod_1.z.string().optional(),
        categoryId: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
    }))
        .query(async ({ input }) => {
        const { page, limit, search, categoryId, isActive } = input;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        const [products, total] = await Promise.all([
            db_1.db.product.findMany({
                where,
                include: {
                    category: true,
                    variants: true,
                    _count: { select: { reviews: true, orderItems: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db_1.db.product.count({ where }),
        ]);
        return {
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }),
    // Create variants (sizes/colors)
    createProductVariants: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(zod_1.z.object({
        productId: zod_1.z.string(),
        variants: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            value: zod_1.z.string(),
            price: zod_1.z.number().optional(),
            purchasePrice: zod_1.z.number().optional(),
            sku: zod_1.z.string().optional(),
            stockQuantity: zod_1.z.number().int().min(0),
        })),
    }))
        .mutation(async ({ input }) => {
        const { productId, variants } = input;
        const created = await Promise.all(variants.map((v) => {
            var _a, _b, _c;
            return db_1.db.productVariant.create({
                data: {
                    productId,
                    name: v.name,
                    value: v.value,
                    price: (_a = v.price) !== null && _a !== void 0 ? _a : null,
                    purchasePrice: (_b = v.purchasePrice) !== null && _b !== void 0 ? _b : null,
                    sku: (_c = v.sku) !== null && _c !== void 0 ? _c : null,
                    stockQuantity: v.stockQuantity,
                },
            });
        }));
        return { variants: created };
    }),
    // Category management
    createCategory: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(createCategorySchema)
        .mutation(async ({ input }) => {
        const category = await db_1.db.category.create({
            data: input,
        });
        return { category };
    }),
    updateCategory: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(updateCategorySchema)
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const category = await db_1.db.category.update({
            where: { id },
            data,
        });
        return { category };
    }),
    deleteCategory: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ input }) => {
        // Check if category has products
        const productCount = await db_1.db.product.count({
            where: { categoryId: input.id },
        });
        if (productCount > 0) {
            throw new Error('Cannot delete category with existing products');
        }
        await db_1.db.category.delete({
            where: { id: input.id },
        });
        return { success: true };
    }),
    getCategories: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .query(async () => {
        const categories = await db_1.db.category.findMany({
            include: {
                _count: { select: { products: true } },
                parent: true,
                children: true,
            },
            orderBy: { name: 'asc' },
        });
        return { categories };
    }),
    // Order management
    getOrders: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(zod_1.z.object({
        page: zod_1.z.number().min(1).default(1),
        limit: zod_1.z.number().min(1).max(100).default(20),
        status: zod_1.z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
        search: zod_1.z.string().optional(),
    }))
        .query(async ({ input }) => {
        const { page, limit, status, search } = input;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [orders, total] = await Promise.all([
            db_1.db.order.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    items: {
                        include: {
                            product: { select: { id: true, name: true, images: true } },
                        },
                    },
                    payment: true,
                    shippingAddress: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db_1.db.order.count({ where }),
        ]);
        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }),
    updateOrderStatus: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(updateOrderStatusSchema)
        .mutation(async ({ input }) => {
        const { orderId, status, trackingNumber } = input;
        const order = await db_1.db.order.update({
            where: { id: orderId },
            data: {
                status,
                ...(trackingNumber && { trackingNumber }),
            },
            include: {
                user: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        return { order };
    }),
    // User management
    getUsers: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(zod_1.z.object({
        page: zod_1.z.number().min(1).default(1),
        limit: zod_1.z.number().min(1).max(100).default(20),
        role: zod_1.z.enum(['USER', 'ADMIN']).optional(),
        search: zod_1.z.string().optional(),
    }))
        .query(async ({ input }) => {
        const { page, limit, role, search } = input;
        const skip = (page - 1) * limit;
        const where = {};
        if (role) {
            where.role = role;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            db_1.db.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isVerified: true,
                    createdAt: true,
                    _count: {
                        select: {
                            orders: true,
                            reviews: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db_1.db.user.count({ where }),
        ]);
        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }),
    updateUser: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(updateUserSchema)
        .mutation(async ({ input }) => {
        const { userId, ...data } = input;
        const user = await db_1.db.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
        });
        return { user };
    }),
    // Coupon management
    createCoupon: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(createCouponSchema)
        .mutation(async ({ input }) => {
        const coupon = await db_1.db.coupon.create({
            data: input,
        });
        return { coupon };
    }),
    getCoupons: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .query(async () => {
        const coupons = await db_1.db.coupon.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return { coupons };
    }),
    updateCoupon: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(createCouponSchema.extend({ id: zod_1.z.string() }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const coupon = await db_1.db.coupon.update({
            where: { id },
            data,
        });
        return { coupon };
    }),
    deleteCoupon: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ input }) => {
        await db_1.db.coupon.delete({
            where: { id: input.id },
        });
        return { success: true };
    }),
    // Analytics
    getAnalytics: auth_1.protectedProcedure
        .use(auth_1.adminMiddleware)
        .input(zod_1.z.object({
        period: zod_1.z.enum(['day', 'week', 'month', 'year']).default('month'),
    }))
        .query(async ({ input }) => {
        const { period } = input;
        const now = new Date();
        let startDate;
        switch (period) {
            case 'day':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
        }
        const [orders, revenue, newUsers, topProducts,] = await Promise.all([
            // Orders in period
            db_1.db.order.count({
                where: { createdAt: { gte: startDate } },
            }),
            // Revenue in period
            db_1.db.order.aggregate({
                where: {
                    createdAt: { gte: startDate },
                    status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
                },
                _sum: { total: true },
            }),
            // New users in period
            db_1.db.user.count({
                where: { createdAt: { gte: startDate } },
            }),
            // Top products in period
            db_1.db.orderItem.groupBy({
                by: ['productId'],
                where: {
                    order: {
                        createdAt: { gte: startDate },
                        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
                    },
                },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5,
            }),
        ]);
        // Get product details for top products
        const topProductIds = topProducts.map((item) => item.productId);
        const topProductDetails = await db_1.db.product.findMany({
            where: { id: { in: topProductIds } },
            select: { id: true, name: true, price: true },
        });
        const topProductsWithDetails = topProducts.map((item) => {
            const product = topProductDetails.find((p) => p.id === item.productId);
            return {
                product,
                totalSold: item._sum.quantity || 0,
            };
        });
        return {
            analytics: {
                orders,
                revenue: revenue._sum.total || 0,
                newUsers,
                topProducts: topProductsWithDetails,
            },
        };
    }),
});
//# sourceMappingURL=admin.js.map