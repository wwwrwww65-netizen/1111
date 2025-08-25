import { Express } from 'express';
export declare const corsOptions: {
    origin: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
};
export declare const rateLimitConfig: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const applySecurityMiddleware: (app: Express) => void;
//# sourceMappingURL=security.d.ts.map