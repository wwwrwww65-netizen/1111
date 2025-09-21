import { z } from 'zod';
import { router } from '../trpc-setup';
import { protectedProcedure } from '../middleware/auth';
import { db } from '@repo/db';

export const wishlistRouter = router({
  // Get user's wishlist
  getWishlist: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const wishlistItems = await db.wishlistItem.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true } },
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { wishlistItems };
    }),

  // Add product to wishlist
  addToWishlist: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { productId } = input;
      const userId = ctx.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Check if product exists
      const product = await db.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Check if already in wishlist
      const existingItem = await db.wishlistItem.findUnique({
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

      const wishlistItem = await db.wishlistItem.create({
        data: {
          userId,
          productId,
        },
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true } },
            },
          },
        },
      });

      return { wishlistItem };
    }),

  // Remove product from wishlist
  removeFromWishlist: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { productId } = input;
      const userId = ctx.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      await db.wishlistItem.delete({
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
  clearWishlist: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      await db.wishlistItem.deleteMany({
        where: { userId },
      });

      return { success: true };
    }),

  // Move wishlist item to cart
  moveToCart: protectedProcedure
    .input(z.object({ productId: z.string(), quantity: z.number().min(1).default(1) }))
    .mutation(async ({ input, ctx }) => {
      const { productId, quantity } = input;
      const userId = ctx.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get or create cart
      let cart = await db.cart.findUnique({
        where: { userId },
      });

      if (!cart) {
        cart = await db.cart.create({
          data: { userId },
        });
      }

      // Check if product already in cart
      const existingCartItem = await db.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });

      if (existingCartItem) {
        // Update quantity
        await db.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + quantity },
        });
      } else {
        // Add to cart
        await db.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        });
      }

      // Remove from wishlist
      await db.wishlistItem.delete({
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