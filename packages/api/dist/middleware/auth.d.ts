import { z } from 'zod';
declare const JWTPayloadSchema: z.ZodObject<{
    userId: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["USER", "ADMIN"]>;
    iat: z.ZodNumber;
    exp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    userId: string;
    email: string;
    role: "USER" | "ADMIN";
    iat: number;
    exp: number;
}, {
    userId: string;
    email: string;
    role: "USER" | "ADMIN";
    iat: number;
    exp: number;
}>;
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;
export declare const createToken: (payload: Omit<JWTPayload, 'iat' | 'exp'>) => string;
export declare const verifyToken: (token: string) => JWTPayload;
export declare const authMiddleware: any;
export declare const optionalAuthMiddleware: any;
export declare const adminMiddleware: any;
export {};
//# sourceMappingURL=auth.d.ts.map