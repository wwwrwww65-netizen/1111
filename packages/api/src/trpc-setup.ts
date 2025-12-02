import { initTRPC, TRPCError } from '@trpc/server';
import { createContext, Context } from './context';
import { z } from 'zod';
import { signJwt, verifyJwt, readTokenFromRequest as readFromReq } from './utils/jwt';

export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const JWTPayloadSchema = z.object({
	userId: z.string(),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	role: z.enum(['USER', 'ADMIN']),
	iat: z.number(),
	exp: z.number(),
});
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

export const createToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => signJwt(payload);

export const verifyToken = (token: string): JWTPayload => verifyJwt(token);

const readTokenFromRequest = (req: any): string | null => readFromReq(req);

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

