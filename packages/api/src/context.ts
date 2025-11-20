import * as trpcExpress from '@trpc/server/adapters/express';
import { prisma } from '@repo/db';

export interface JWTPayload {
	userId: string;
	email?: string;
	phone?: string;
	role: 'USER' | 'ADMIN';
	iat: number;
	exp: number;
}

export const createContext = ({
	req,
	res,
}: trpcExpress.CreateExpressContextOptions) => {
	return {
		prisma,
		req,
		res,
		user: null as JWTPayload | null,
	};
};

export type Context = ReturnType<typeof createContext>;

