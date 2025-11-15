import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc-setup';
import { authMiddleware, createToken } from '../middleware/auth';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies';
import bcrypt from 'bcryptjs';
import { db } from '@repo/db';

const SALT_ROUNDS = 12;
const COOKIE_NAME = 'auth_token';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days (seconds)
};
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '';

// Input schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
});

export const authRouter = router({
  // Register new user
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, password, name, phone } = input;

      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const user = await db.user.create({
        data: { email, password: hashedPassword, name, phone },
        select: { id: true, email: true, name: true, role: true, isVerified: true },
      });

      // Create cart for user
      await db.cart.create({ data: { userId: user.id } });

      // Generate JWT token and set cookie
      const token = createToken({ userId: user.id, email: user.email, role: user.role });
      setAuthCookies(ctx.res as any, token, true);

      return { user };
    }),

  // Login user
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      // Find user
      const user = await db.user.findUnique({
        where: { email },
        select: { id: true, email: true, password: true, name: true, role: true, isVerified: true },
      });

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
      }

      // Generate JWT token and set cookie
      const token = createToken({ userId: user.id, email: user.email, role: user.role });
      setAuthCookies(ctx.res as any, token);

      // Merge guest cart into user cart if a guest session cookie exists (first-login sync)
      try {
        const req: any = ctx.req as any;
        const res: any = ctx.res as any;
        const raw = String(req.headers?.cookie || '');
        const cookies: Record<string, string> = raw.split(';').reduce((acc: any, p: string) => {
          const [k, ...rest] = p.split('=');
          if (!k) return acc;
          acc[k.trim()] = decodeURIComponent((rest.join('=') || '').trim());
          return acc;
        }, {});
        const sid = (req.headers['x-session-id'] as string | undefined) || cookies['guest_session'] || cookies['guest_sid'];
        if (sid) {
          const guest: any = await db.guestCart.findUnique({ where: { sessionId: sid }, include: { items: true } } as any);
          if (guest && Array.isArray(guest.items) && guest.items.length) {
            // Ensure user cart
            const cart = await db.cart.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} } as any);
            const cartId = cart.id;
            for (const it of guest.items) {
              const pid = String(it.productId);
              const existing = await db.cartItem.findFirst({ where: { cartId, productId: pid }, select: { id: true, quantity: true } });
              if (existing) {
                await db.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + Number(it.quantity || 1) } });
              } else {
                await db.cartItem.create({ data: { cartId, productId: pid, quantity: Number(it.quantity || 1), attributes: (it as any).attributes || undefined } });
              }
            }
            // cleanup guest cart
            try { await db.guestCartItem.deleteMany({ where: { cartId: guest.id } } as any); } catch {}
            try { await db.guestCart.delete({ where: { id: guest.id } } as any); } catch {}
            try { await db.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } } as any); } catch {}
          }
        }
      } catch {}

      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };
    }),

  // Logout user
  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      clearAuthCookies(ctx.res as any);
      return { success: true };
    }),

  // Get current user profile
  me: publicProcedure
    .use(authMiddleware)
    .query(async ({ ctx }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.user!.userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isVerified: true,
          addresses: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      return user;
    }),

  // Update user profile
  updateProfile: publicProcedure
    .use(authMiddleware)
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, phone, address } = input;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;

      // Update user
      const user = await db.user.update({
        where: { id: ctx.user!.userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isVerified: true,
          addresses: true,
          createdAt: true,
        },
      });

      // Update address if provided
      if (address) {
        await db.address.upsert({
          where: { userId: ctx.user!.userId },
          update: address,
          create: { ...address, userId: ctx.user.userId },
        });
      }

      return user;
    }),

  // Change password
  changePassword: publicProcedure
    .use(authMiddleware)
    .input(z.object({ currentPassword: z.string(), newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword } = input;

      // Get user with password
      const user = await db.user.findUnique({ where: { id: ctx.user.userId }, select: { password: true } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await db.user.update({ where: { id: ctx.user.userId }, data: { password: hashedNewPassword } });

      return { success: true };
    }),
});