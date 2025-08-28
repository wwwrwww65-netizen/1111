import { initTRPC, TRPCError } from '@trpc/server';
import { createContext, Context } from './context';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
	throw new Error('JWT_SECRET environment variable is not set');
}

const JWTPayloadSchema = z.object({
	userId: z.string(),
	email: z.string().email(),
	role: z.enum(['USER', 'ADMIN']),
	iat: z.number(),
	exp: z.number(),
});
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

export const createToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JWTPayload => {
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		return JWTPayloadSchema.parse(decoded);
	} catch {
		throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
	}
};

const readTokenFromRequest = (req: any): string | null => {
	const cookieToken = req?.cookies?.auth_token as string | undefined;
	if (cookieToken) return cookieToken;
	const header = req?.headers?.authorization as string | undefined;
	if (header?.startsWith('Bearer ')) return header.replace('Bearer ', '');
	return null;
};

export const authMiddleware = t.middleware(async ({ ctx, next }) => {
	const token = readTokenFromRequest(ctx.req);
	if (!token) {
		throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No token provided' });
	}
	const payload = verifyToken(token);
	return next({ ctx: { ...ctx, user: payload } });
});

export const optionalAuthMiddleware = t.middleware(async ({ ctx, next }) => {
	const token = readTokenFromRequest(ctx.req);
	if (token) {
		try {
			const payload = verifyToken(token);
			return next({ ctx: { ...ctx, user: payload } });
		} catch {}
	}
	return next({ ctx: { ...ctx, user: null } });
});

export const adminMiddleware = t.middleware(async ({ ctx, next }) => {
	if (!ctx.user || ctx.user.role !== 'ADMIN') {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
	}
	return next({ ctx });
});

export const protectedProcedure = t.procedure.use(authMiddleware);

