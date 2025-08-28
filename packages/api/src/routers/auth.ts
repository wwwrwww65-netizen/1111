import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc';
import { authMiddleware, createToken } from '../middleware/auth';
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
<<<<<<< HEAD
      await db.cart.create({
        data: { userId: user.id },
      });
=======
      await db.cart.create({ data: { userId: user.id } });
>>>>>>> origin/main

      // Generate JWT token and set cookie
      const token = createToken({ userId: user.id, email: user.email, role: user.role });
      ctx.res.cookie(COOKIE_NAME, token, COOKIE_OPTS);

<<<<<<< HEAD
      return { user, token };
=======
      return { user };
>>>>>>> origin/main
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
      ctx.res.cookie(COOKIE_NAME, token, COOKIE_OPTS);

      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };
    }),

  // Logout user
  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { path: '/' });
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
<<<<<<< HEAD
          create: {
            ...address,
            userId: ctx.user!.userId,
          },
=======
          create: { ...address, userId: ctx.user.userId },
>>>>>>> origin/main
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
<<<<<<< HEAD
      const user = await db.user.findUnique({
        where: { id: ctx.user!.userId },
        select: { password: true },
      });

=======
      const user = await db.user.findUnique({ where: { id: ctx.user.userId }, select: { password: true } });
>>>>>>> origin/main
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
<<<<<<< HEAD

      // Update password
      await db.user.update({
        where: { id: ctx.user!.userId },
        data: { password: hashedNewPassword },
      });
=======
      await db.user.update({ where: { id: ctx.user.userId }, data: { password: hashedNewPassword } });
>>>>>>> origin/main

      return { success: true };
    }),
});