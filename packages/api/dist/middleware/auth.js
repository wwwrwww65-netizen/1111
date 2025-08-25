"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.optionalAuthMiddleware = exports.authMiddleware = exports.verifyToken = exports.createToken = void 0;
var server_1 = require("@trpc/server");
var trpc_1 = require("../trpc");
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var zod_1 = require("zod");
var JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
// Schema for JWT payload
var JWTPayloadSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(['USER', 'ADMIN']),
    iat: zod_1.z.number(),
    exp: zod_1.z.number(),
});
// Create JWT token
var createToken = function (payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
exports.createToken = createToken;
// Verify JWT token
var verifyToken = function (token) {
    try {
        var decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
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
// Auth middleware
exports.authMiddleware = (0, trpc_1.middleware)(function (_a) {
    var ctx = _a.ctx, next = _a.next;
    return __awaiter(void 0, void 0, void 0, function () {
        var token, payload;
        var _b;
        return __generator(this, function (_c) {
            token = (_b = ctx.req.headers.authorization) === null || _b === void 0 ? void 0 : _b.replace('Bearer ', '');
            if (!token) {
                throw new server_1.TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'No token provided',
                });
            }
            payload = (0, exports.verifyToken)(token);
            return [2 /*return*/, next({
                    ctx: __assign(__assign({}, ctx), { user: payload }),
                })];
        });
    });
});
// Optional auth middleware (doesn't throw error if no token)
exports.optionalAuthMiddleware = (0, trpc_1.middleware)(function (_a) {
    var ctx = _a.ctx, next = _a.next;
    return __awaiter(void 0, void 0, void 0, function () {
        var token, payload;
        var _b;
        return __generator(this, function (_c) {
            token = (_b = ctx.req.headers.authorization) === null || _b === void 0 ? void 0 : _b.replace('Bearer ', '');
            if (token) {
                try {
                    payload = (0, exports.verifyToken)(token);
                    return [2 /*return*/, next({
                            ctx: __assign(__assign({}, ctx), { user: payload }),
                        })];
                }
                catch (error) {
                    // Continue without user if token is invalid
                }
            }
            return [2 /*return*/, next({
                    ctx: __assign(__assign({}, ctx), { user: null }),
                })];
        });
    });
});
// Admin middleware
exports.adminMiddleware = (0, trpc_1.middleware)(function (_a) {
    var ctx = _a.ctx, next = _a.next;
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_b) {
            if (!ctx.user || ctx.user.role !== 'ADMIN') {
                throw new server_1.TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Admin access required',
                });
            }
            return [2 /*return*/, next({
                    ctx: ctx,
                })];
        });
    });
});
