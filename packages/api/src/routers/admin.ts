import { z } from 'zod';
import { router } from '../trpc-setup';
import { protectedProcedure, adminMiddleware } from '../middleware/auth';
import { db } from '@repo/db';

// Admin schemas
const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  images: z.array(z.string()),
  categoryId: z.string(),
  vendorId: z.string().optional(),
  stockQuantity: z.number().int().min(0),
  sku: z.string().optional(),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  // Loyalty fields
  pointsFixed: z.number().int().optional(),
  pointsPercent: z.number().optional(),
  loyaltyMultiplier: z.number().optional(),
  excludeFromPoints: z.boolean().optional(),
  // SEO fields
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  slug: z.string().optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  metaRobots: z.string().optional(),
  hiddenContent: z.string().optional(),
  ogTags: z.any().optional(),
  twitterCard: z.any().optional(),
  schema: z.any().optional(),
});

const updateProductSchema = createProductSchema.partial().extend({
  id: z.string(),
});

const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
});

const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string(),
});

const updateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  trackingNumber: z.string().optional(),
});

const createCouponSchema = z.object({
  code: z.string().min(1),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().optional(),
  maxUses: z.number().int().positive().optional(),
  validFrom: z.string(),
  validUntil: z.string(),
  isActive: z.boolean().default(true),
});

const updateUserSchema = z.object({
  userId: z.string(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const adminRouter = router({
  // Dashboard statistics
  getDashboardStats: protectedProcedure
    .use(adminMiddleware)
    .query(async () => {
      const [
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        recentOrders,
        lowStockProducts,
        topSellingProducts,
        monthlyRevenue,
      ] = await Promise.all([
        // Total users
        db.user.count(),

        // Total products
        db.product.count(),

        // Total orders
        db.order.count(),

        // Total revenue
        db.order.aggregate({
          where: { status: { in: ['PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'] } },
          _sum: { total: true },
        }),

        // Recent orders
        db.order.findMany({
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
        db.product.findMany({
          where: { stockQuantity: { lte: 10 } },
          take: 10,
          orderBy: { stockQuantity: 'asc' },
        }),

        // Top selling products
        db.orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10,
        }),

        // Monthly revenue (last 6 months)
        db.order.groupBy({
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
      const topSellingProductIds = topSellingProducts.map((item: { productId: string }) => item.productId);
      const topSellingProductDetails = await db.product.findMany({
        where: { id: { in: topSellingProductIds } },
        select: { id: true, name: true, price: true, images: true },
      });

      const topSellingWithDetails = topSellingProducts.map((item: { productId: string; _sum: { quantity: number | null } }) => {
        const product = topSellingProductDetails.find((p: { id: string }) => p.id === item.productId);
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
  createProduct: protectedProcedure
    .use(adminMiddleware)
    .input(createProductSchema)
    .mutation(async ({ input }) => {
      const {
        seoTitle,
        seoDescription,
        slug,
        seoKeywords,
        canonicalUrl,
        metaRobots,
        hiddenContent,
        ogTags,
        twitterCard,
        schema,
        ...productData
      } = input;

      let nextSku = productData.sku;
      if (!nextSku && productData.vendorId) {
        const vendor = await db.vendor.findUnique({ where: { id: productData.vendorId } });
        if (vendor?.vendorCode) {
          const prefix = vendor.vendorCode + '-';
          const last = await db.product.findFirst({ where: { vendorId: productData.vendorId, sku: { startsWith: prefix } }, orderBy: { createdAt: 'desc' } });
          let n = 0;
          if (last?.sku && last.sku.startsWith(prefix)) {
            const tail = last.sku.substring(prefix.length);
            const parsed = parseInt(tail, 10);
            if (!isNaN(parsed)) n = parsed;
          }
          nextSku = `${prefix}${n + 1}`;
        }
      }

      // Helper to process SEO keywords
      const processedKeywords = seoKeywords
        ? seoKeywords.split(',').map((k) => k.trim()).filter((k) => k.length > 0)
        : [];

      const product = await db.product.create({
        data: {
          ...productData,
          sku: nextSku ?? productData.sku ?? null,
          seo: {
            create: {
              seoTitle,
              seoDescription,
              slug,
              seoKeywords: processedKeywords,
              canonicalUrl,
              metaRobots,
              hiddenContent,
              ogTags: ogTags as any,
              twitterCard: twitterCard as any,
              schema: schema as any,
            },
          },
        },
        include: { category: { select: { id: true, name: true } } },
      });

      return { product };
    }),

  updateProduct: protectedProcedure
    .use(adminMiddleware)
    .input(updateProductSchema)
    .mutation(async ({ input }) => {
      const {
        id,
        seoTitle,
        seoDescription,
        slug,
        seoKeywords,
        canonicalUrl,
        metaRobots,
        hiddenContent,
        ogTags,
        twitterCard,
        schema,
        ...productData
      } = input;

      const processedKeywords = (typeof seoKeywords === 'string')
        ? seoKeywords.split(',').map((k) => k.trim()).filter((k) => k.length > 0)
        : undefined; // undefined allows partial updates to ignore this field if not provided

      const seoData = {
        seoTitle,
        seoDescription,
        slug,
        // Only update keywords if explicitly provided (even empty string clears it)
        ...(seoKeywords !== undefined && { seoKeywords: processedKeywords }),
        canonicalUrl,
        metaRobots,
        hiddenContent,
        ogTags: ogTags as any,
        twitterCard: twitterCard as any,
        schema: schema as any,
      };

      // Filter out undefined values for update to avoid overwriting with null/undefined naturally
      // But Zod .partial() makes them optional/undefined, so we should only include keys that are present
      // Actually Prisma accepts undefined and ignores it for updates

      const product = await db.product.update({
        where: { id },
        data: {
          ...productData,
          seo: {
            upsert: {
              create: {
                ...seoData,
                seoKeywords: processedKeywords || []
              },
              update: seoData
            }
          }
        },
        include: { category: { select: { id: true, name: true } } },
      });

      return { product };
    }),

  // Toggle or set product active/archive status
  setProductStatus: protectedProcedure
    .use(adminMiddleware)
    .input(z.object({ id: z.string(), status: z.enum(['PUBLISHED', 'ARCHIVED', 'DISABLED']) }))
    .mutation(async ({ input }) => {
      // Map UI statuses to isActive flag; extend later for richer status
      const { id, status } = input;
      const isActive = status === 'PUBLISHED';
      const product = await db.product.update({ where: { id }, data: { isActive } });
      return { product };
    }),

  deleteProduct: protectedProcedure
    .use(adminMiddleware)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.product.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  getProducts: protectedProcedure
    .use(adminMiddleware)
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      categoryId: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const { page, limit, search, categoryId, isActive } = input;
      const skip = (page - 1) * limit;

      const where: any = {};

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
        db.product.findMany({
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
        db.product.count({ where }),
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
  createProductVariants: protectedProcedure
    .use(adminMiddleware)
    .input(z.object({
      productId: z.string(),
      variants: z.array(z.object({
        name: z.string(),
        value: z.string(),
        price: z.number().optional(),
        purchasePrice: z.number().optional(),
        sku: z.string().optional(),
        stockQuantity: z.number().int().min(0),
      })),
    }))
    .mutation(async ({ input }) => {
      const { productId, variants } = input;
      const created = await Promise.all(
        variants.map((v) => db.productVariant.create({
          data: {
            productId,
            name: v.name,
            value: v.value,
            price: v.price ?? null,
            purchasePrice: v.purchasePrice ?? null,
            sku: v.sku ?? null,
            stockQuantity: v.stockQuantity,
          },
        }))
      );
      return { variants: created };
    }),

  // Category management
  createCategory: protectedProcedure
    .use(adminMiddleware)
    .input(createCategorySchema)
    .mutation(async ({ input }) => {
      const category = await db.category.create({
        data: input,
      });

      return { category };
    }),

  updateCategory: protectedProcedure
    .use(adminMiddleware)
    .input(updateCategorySchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const category = await db.category.update({
        where: { id },
        data,
      });

      return { category };
    }),

  deleteCategory: protectedProcedure
    .use(adminMiddleware)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Check if category has products
      const productCount = await db.product.count({
        where: { categoryId: input.id },
      });

      if (productCount > 0) {
        throw new Error('Cannot delete category with existing products');
      }

      await db.category.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  getCategories: protectedProcedure
    .use(adminMiddleware)
    .query(async () => {
      const categories = await db.category.findMany({
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
  getOrders: protectedProcedure
    .use(adminMiddleware)
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      status: z.enum(['PENDING', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, limit, status, search } = input;
      const skip = (page - 1) * limit;

      const where: any = {};

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
        db.order.findMany({
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
        db.order.count({ where }),
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

  updateOrderStatus: protectedProcedure
    .use(adminMiddleware)
    .input(updateOrderStatusSchema)
    .mutation(async ({ input }) => {
      const { orderId, status, trackingNumber } = input;

      const order = await db.order.update({
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
  getUsers: protectedProcedure
    .use(adminMiddleware)
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      role: z.enum(['USER', 'ADMIN']).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, limit, role, search } = input;
      const skip = (page - 1) * limit;

      const where: any = {};

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
        db.user.findMany({
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
        db.user.count({ where }),
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

  updateUser: protectedProcedure
    .use(adminMiddleware)
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      const { userId, ...data } = input;

      const user = await db.user.update({
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
  createCoupon: protectedProcedure
    .use(adminMiddleware)
    .input(createCouponSchema)
    .mutation(async ({ input }) => {
      const coupon = await db.coupon.create({
        data: input,
      });

      return { coupon };
    }),

  getCoupons: protectedProcedure
    .use(adminMiddleware)
    .query(async () => {
      const coupons = await db.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return { coupons };
    }),

  updateCoupon: protectedProcedure
    .use(adminMiddleware)
    .input(createCouponSchema.extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const coupon = await db.coupon.update({
        where: { id },
        data,
      });

      return { coupon };
    }),

  deleteCoupon: protectedProcedure
    .use(adminMiddleware)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.coupon.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Analytics
  getAnalytics: protectedProcedure
    .use(adminMiddleware)
    .input(z.object({
      period: z.enum(['day', 'week', 'month', 'year']).default('month'),
    }))
    .query(async ({ input }) => {
      const { period } = input;

      const now = new Date();
      let startDate: Date;

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

      const [
        orders,
        revenue,
        newUsers,
        topProducts,
      ] = await Promise.all([
        // Orders in period
        db.order.count({
          where: { createdAt: { gte: startDate } },
        }),

        // Revenue in period
        db.order.aggregate({
          where: {
            createdAt: { gte: startDate },
            status: { in: ['PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
          },
          _sum: { total: true },
        }),

        // New users in period
        db.user.count({
          where: { createdAt: { gte: startDate } },
        }),

        // Top products in period
        db.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: {
              createdAt: { gte: startDate },
              status: { in: ['PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
            },
          },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),
      ]);

      // Get product details for top products
      const topProductIds = topProducts.map((item: { productId: string }) => item.productId);
      const topProductDetails = await db.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, name: true, price: true },
      });

      const topProductsWithDetails = topProducts.map((item: { productId: string; _sum: { quantity: number | null } }) => {
        const product = topProductDetails.find((p: { id: string }) => p.id === item.productId);
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