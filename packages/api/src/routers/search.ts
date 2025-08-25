import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@repo/db';

// Search and filter schemas
const searchProductsSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  inStock: z.boolean().optional(),
  sortBy: z.enum(['name', 'price', 'rating', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  tags: z.array(z.string()).optional(),
  brand: z.string().optional(),
});

const searchCategoriesSchema = z.object({
  query: z.string().optional(),
  parentId: z.string().optional(),
  includeProducts: z.boolean().default(false),
});

const searchUsersSchema = z.object({
  query: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isVerified: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const searchOrdersSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  minTotal: z.number().optional(),
  maxTotal: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const searchRouter = router({
  // Search products with advanced filtering
  searchProducts: publicProcedure
    .input(searchProductsSchema)
    .query(async ({ input }) => {
      const {
        query,
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page,
        limit,
        tags,
        brand,
      } = input;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        isActive: true,
      };

      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      if (inStock !== undefined) {
        where.stockQuantity = inStock ? { gt: 0 } : { lte: 0 };
      }

      if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
      }

      if (brand) {
        where.brand = { contains: brand, mode: 'insensitive' };
      }

      // Build order by clause
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get products with pagination
      const [products, total] = await Promise.all([
        db.product.findMany({
          where,
          include: {
            category: true,
            reviews: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
            variants: true,
          },
          orderBy,
          skip,
          take: limit,
        }),
        db.product.count({ where }),
      ]);

      // Calculate average rating for each product
      const productsWithRating = products.map(product => {
        const avgRating = product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 0;

        return {
          ...product,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: product.reviews.length,
        };
      });

      return {
        products: productsWithRating,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    }),

  // Search categories
  searchCategories: publicProcedure
    .input(searchCategoriesSchema)
    .query(async ({ input }) => {
      const { query, parentId, includeProducts } = input;

      const where: any = {};

      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ];
      }

      if (parentId) {
        where.parentId = parentId;
      } else {
        where.parentId = null; // Only top-level categories
      }

      const categories = await db.category.findMany({
        where,
        include: includeProducts ? {
          products: {
            where: { isActive: true },
            select: { id: true, name: true, price: true, images: true },
            take: 5, // Limit to 5 products per category
          },
          _count: {
            select: { products: true },
          },
        } : undefined,
        orderBy: { name: 'asc' },
      });

      return { categories };
    }),

  // Search users (admin only)
  searchUsers: publicProcedure
    .input(searchUsersSchema)
    .query(async ({ input }) => {
      const { query, role, isVerified, page, limit } = input;

      const skip = (page - 1) * limit;

      const where: any = {};

      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (isVerified !== undefined) {
        where.isVerified = isVerified;
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
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    }),

  // Search orders (admin only)
  searchOrders: publicProcedure
    .input(searchOrdersSchema)
    .query(async ({ input }) => {
      const { query, status, minTotal, maxTotal, startDate, endDate, page, limit } = input;

      const skip = (page - 1) * limit;

      const where: any = {};

      if (query) {
        where.OR = [
          { id: { contains: query, mode: 'insensitive' } },
          { user: { name: { contains: query, mode: 'insensitive' } } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (minTotal !== undefined || maxTotal !== undefined) {
        where.total = {};
        if (minTotal !== undefined) where.total.gte = minTotal;
        if (maxTotal !== undefined) where.total.lte = maxTotal;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [orders, total] = await Promise.all([
        db.order.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            items: {
              include: {
                product: {
                  select: { id: true, name: true, images: true },
                },
              },
            },
            payment: {
              select: { status: true, method: true },
            },
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
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    }),

  // Get search suggestions
  getSearchSuggestions: publicProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ input }) => {
      const { query } = input;

      const [products, categories] = await Promise.all([
        db.product.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, name: true, images: true, price: true },
          take: 5,
        }),
        db.category.findMany({
          where: {
            name: { contains: query, mode: 'insensitive' },
          },
          select: { id: true, name: true },
          take: 3,
        }),
      ]);

      return {
        products,
        categories,
      };
    }),

  // Get popular searches
  getPopularSearches: publicProcedure
    .query(async () => {
      // This would typically come from a search analytics table
      // For now, we'll return some common searches
      return {
        searches: [
          'هاتف ذكي',
          'لابتوب',
          'سماعات',
          'ساعة ذكية',
          'كاميرا',
          'أحذية رياضية',
          'حقائب',
          'عطور',
        ],
      };
    }),

  // Get search filters
  getSearchFilters: publicProcedure
    .query(async () => {
      const [categories, priceRanges, brands] = await Promise.all([
        db.category.findMany({
          select: { id: true, name: true, _count: { select: { products: true } } },
          orderBy: { name: 'asc' },
        }),
        db.product.aggregate({
          _min: { price: true },
          _max: { price: true },
        }),
        db.product.findMany({
          where: { isActive: true, brand: { not: null } },
          select: { brand: true },
          distinct: ['brand'],
        }),
      ]);

      return {
        categories: categories.filter(cat => cat._count.products > 0),
        priceRange: {
          min: priceRanges._min.price || 0,
          max: priceRanges._max.price || 1000,
        },
        brands: brands.map(b => b.brand).filter(Boolean),
      };
    }),
});