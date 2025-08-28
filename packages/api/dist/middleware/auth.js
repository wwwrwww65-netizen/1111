"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.optionalAuthMiddleware = exports.authMiddleware = exports.verifyToken = exports.createToken = void 0;
const server_1 = require("@trpc/server");
const trpc_1 = require("../trpc");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
}
// Schema for JWT payload
const JWTPayloadSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(['USER', 'ADMIN']),
    iat: zod_1.z.number(),
    exp: zod_1.z.number(),
});
// Create JWT token
const createToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
exports.createToken = createToken;
// Verify JWT token
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return JWTPayloadSchema.parse(decoded);
    }
    catch (error) {
        throw new server_1.TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token',
        });
    }
};
exports.verifyToken = verifyToken;
exports.authMiddleware = trpc_1.t.middleware(async ({ ctx, next }) => {
    var _a;
    const token = (_a = ctx.req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token) {
        throw new server_1.TRPCError({
            code: 'UNAUTHORIZED',
            message: 'No token provided',
        });
    }
    const payload = (0, exports.verifyToken)(token);
    return next({
        ctx: {
            ...ctx,
            user: payload,
        },
    });
});
exports.optionalAuthMiddleware = trpc_1.t.middleware(async ({ ctx, next }) => {
    var _a;
    const token = (_a = ctx.req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (token) {
        try {
            const payload = (0, exports.verifyToken)(token);
            return next({
                ctx: {
                    ...ctx,
                    user: payload,
                },
            });
        }
        catch (error) {
            // Continue without user if token is invalid
        }
    }
    return next({
        ctx: {
            ...ctx,
            user: null,
        },
    });
});
exports.adminMiddleware = trpc_1.t.middleware(async ({ ctx, next }) => {
    if (!ctx.user || ctx.user.role !== 'ADMIN') {
        throw new server_1.TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
        });
    }
    return next({
        ctx,
    });
});
//# sourceMappingURL=auth.js.map