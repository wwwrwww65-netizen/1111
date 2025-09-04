"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedProcedure = exports.adminMiddleware = exports.optionalAuthMiddleware = exports.authMiddleware = exports.verifyToken = exports.createToken = exports.middleware = exports.publicProcedure = exports.router = exports.t = void 0;
const server_1 = require("@trpc/server");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
exports.t = server_1.initTRPC.context().create();
exports.router = exports.t.router;
exports.publicProcedure = exports.t.procedure;
exports.middleware = exports.t.middleware;
const JWTPayloadSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(['USER', 'ADMIN']),
    iat: zod_1.z.number(),
    exp: zod_1.z.number(),
});
const createToken = (payload) => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET is not set');
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '7d' });
};
exports.createToken = createToken;
const verifyToken = (token) => {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error('JWT_SECRET is not set');
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return JWTPayloadSchema.parse(decoded);
    }
    catch {
        throw new server_1.TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
    }
};
exports.verifyToken = verifyToken;
const readTokenFromRequest = (req) => {
    var _a, _b;
    const cookieToken = (_a = req === null || req === void 0 ? void 0 : req.cookies) === null || _a === void 0 ? void 0 : _a.auth_token;
    if (cookieToken)
        return cookieToken;
    const header = (_b = req === null || req === void 0 ? void 0 : req.headers) === null || _b === void 0 ? void 0 : _b.authorization;
    if (header === null || header === void 0 ? void 0 : header.startsWith('Bearer '))
        return header.replace('Bearer ', '');
    return null;
};
exports.authMiddleware = exports.t.middleware(async ({ ctx, next }) => {
    const token = readTokenFromRequest(ctx.req);
    if (!token) {
        throw new server_1.TRPCError({ code: 'UNAUTHORIZED', message: 'No token provided' });
    }
    const payload = (0, exports.verifyToken)(token);
    return next({ ctx: { ...ctx, user: payload } });
});
exports.optionalAuthMiddleware = exports.t.middleware(async ({ ctx, next }) => {
    const token = readTokenFromRequest(ctx.req);
    if (token) {
        try {
            const payload = (0, exports.verifyToken)(token);
            return next({ ctx: { ...ctx, user: payload } });
        }
        catch { }
    }
    return next({ ctx: { ...ctx, user: null } });
});
exports.adminMiddleware = exports.t.middleware(async ({ ctx, next }) => {
    if (!ctx.user || ctx.user.role !== 'ADMIN') {
        throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
    }
    return next({ ctx });
});
exports.protectedProcedure = exports.t.procedure.use(exports.authMiddleware);
//# sourceMappingURL=trpc-setup.js.map