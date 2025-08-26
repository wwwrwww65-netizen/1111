"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const zod_1 = require("zod");
const server_1 = require("@trpc/server");
const trpc_1 = require("../trpc");
const auth_1 = require("../middleware/auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("@repo/db");
const SALT_ROUNDS = 12;
// Input schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(2),
    phone: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.object({
        street: zod_1.z.string(),
        city: zod_1.z.string(),
        state: zod_1.z.string(),
        postalCode: zod_1.z.string(),
        country: zod_1.z.string(),
    }).optional(),
});
exports.authRouter = (0, trpc_1.router)({
    // Register new user
    register: trpc_1.publicProcedure
        .input(registerSchema)
        .mutation(async ({ input }) => {
        const { email, password, name, phone } = input;
        // Check if user already exists
        const existingUser = await db_1.db.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new server_1.TRPCError({
                code: 'CONFLICT',
                message: 'User with this email already exists',
            });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
        // Create user
        const user = await db_1.db.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isVerified: true,
            },
        });
        // Create cart for user
        await db_1.db.cart.create({
            data: { userId: user.id },
        });
        // Generate JWT token
        const token = (0, auth_1.createToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        return { user, token };
    }),
    // Login user
    login: trpc_1.publicProcedure
        .input(loginSchema)
        .mutation(async ({ input }) => {
        const { email, password } = input;
        // Find user
        const user = await db_1.db.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                name: true,
                role: true,
                isVerified: true,
            },
        });
        if (!user) {
            throw new server_1.TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Invalid email or password',
            });
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            throw new server_1.TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Invalid email or password',
            });
        }
        // Generate JWT token
        const token = (0, auth_1.createToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            token,
        };
    }),
    // Get current user profile
    me: trpc_1.publicProcedure
        .use(auth_1.authMiddleware)
        .query(async ({ ctx }) => {
        const user = await db_1.db.user.findUnique({
            where: { id: ctx.user.userId },
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
            throw new server_1.TRPCError({
                code: 'NOT_FOUND',
                message: 'User not found',
            });
        }
        return user;
    }),
    // Update user profile
    updateProfile: trpc_1.publicProcedure
        .use(auth_1.authMiddleware)
        .input(updateProfileSchema)
        .mutation(async ({ ctx, input }) => {
        const { name, phone, address } = input;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (phone)
            updateData.phone = phone;
        // Update user
        const user = await db_1.db.user.update({
            where: { id: ctx.user.userId },
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
            await db_1.db.address.upsert({
                where: { userId: ctx.user.userId },
                update: address,
                create: {
                    ...address,
                    userId: ctx.user.userId,
                },
            });
        }
        return user;
    }),
    // Change password
    changePassword: trpc_1.publicProcedure
        .use(auth_1.authMiddleware)
        .input(zod_1.z.object({
        currentPassword: zod_1.z.string(),
        newPassword: zod_1.z.string().min(8),
    }))
        .mutation(async ({ ctx, input }) => {
        const { currentPassword, newPassword } = input;
        // Get user with password
        const user = await db_1.db.user.findUnique({
            where: { id: ctx.user.userId },
            select: { password: true },
        });
        if (!user) {
            throw new server_1.TRPCError({
                code: 'NOT_FOUND',
                message: 'User not found',
            });
        }
        // Verify current password
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValidPassword) {
            throw new server_1.TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Current password is incorrect',
            });
        }
        // Hash new password
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, SALT_ROUNDS);
        // Update password
        await db_1.db.user.update({
            where: { id: ctx.user.userId },
            data: { password: hashedNewPassword },
        });
        return { success: true };
    }),
});
//# sourceMappingURL=auth.js.map