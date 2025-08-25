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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
var zod_1 = require("zod");
var server_1 = require("@trpc/server");
var trpc_1 = require("../trpc");
var auth_1 = require("../middleware/auth");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var db_1 = require("@repo/db");
var SALT_ROUNDS = 12;
// Input schemas
var registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(2),
    phone: zod_1.z.string().optional(),
});
var loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
var updateProfileSchema = zod_1.z.object({
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
        .mutation(function (_a) {
        var input = _a.input;
        return __awaiter(void 0, void 0, void 0, function () {
            var email, password, name, phone, existingUser, hashedPassword, user, token;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        email = input.email, password = input.password, name = input.name, phone = input.phone;
                        return [4 /*yield*/, db_1.db.user.findUnique({
                                where: { email: email },
                            })];
                    case 1:
                        existingUser = _b.sent();
                        if (existingUser) {
                            throw new server_1.TRPCError({
                                code: 'CONFLICT',
                                message: 'User with this email already exists',
                            });
                        }
                        return [4 /*yield*/, bcryptjs_1.default.hash(password, SALT_ROUNDS)];
                    case 2:
                        hashedPassword = _b.sent();
                        return [4 /*yield*/, db_1.db.user.create({
                                data: {
                                    email: email,
                                    password: hashedPassword,
                                    name: name,
                                    phone: phone,
                                },
                                select: {
                                    id: true,
                                    email: true,
                                    name: true,
                                    role: true,
                                    isVerified: true,
                                },
                            })];
                    case 3:
                        user = _b.sent();
                        // Create cart for user
                        return [4 /*yield*/, db_1.db.cart.create({
                                data: {
                                    userId: user.id,
                                },
                            })];
                    case 4:
                        // Create cart for user
                        _b.sent();
                        token = (0, auth_1.createToken)({
                            userId: user.id,
                            email: user.email,
                            role: user.role,
                        });
                        return [2 /*return*/, {
                                user: user,
                                token: token,
                            }];
                }
            });
        });
    }),
    // Login user
    login: trpc_1.publicProcedure
        .input(loginSchema)
        .mutation(function (_a) {
        var input = _a.input;
        return __awaiter(void 0, void 0, void 0, function () {
            var email, password, user, isValidPassword, token, _, userWithoutPassword;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        email = input.email, password = input.password;
                        return [4 /*yield*/, db_1.db.user.findUnique({
                                where: { email: email },
                                select: {
                                    id: true,
                                    email: true,
                                    password: true,
                                    name: true,
                                    role: true,
                                    isVerified: true,
                                },
                            })];
                    case 1:
                        user = _b.sent();
                        if (!user) {
                            throw new server_1.TRPCError({
                                code: 'UNAUTHORIZED',
                                message: 'Invalid email or password',
                            });
                        }
                        return [4 /*yield*/, bcryptjs_1.default.compare(password, user.password)];
                    case 2:
                        isValidPassword = _b.sent();
                        if (!isValidPassword) {
                            throw new server_1.TRPCError({
                                code: 'UNAUTHORIZED',
                                message: 'Invalid email or password',
                            });
                        }
                        token = (0, auth_1.createToken)({
                            userId: user.id,
                            email: user.email,
                            role: user.role,
                        });
                        _ = user.password, userWithoutPassword = __rest(user, ["password"]);
                        return [2 /*return*/, {
                                user: userWithoutPassword,
                                token: token,
                            }];
                }
            });
        });
    }),
    // Get current user profile
    me: trpc_1.publicProcedure
        .use(auth_1.authMiddleware)
        .query(function (_a) {
        var ctx = _a.ctx;
        return __awaiter(void 0, void 0, void 0, function () {
            var user;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, db_1.db.user.findUnique({
                            where: { id: ctx.user.userId },
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                phone: true,
                                role: true,
                                isVerified: true,
                                address: true,
                                createdAt: true,
                            },
                        })];
                    case 1:
                        user = _b.sent();
                        if (!user) {
                            throw new server_1.TRPCError({
                                code: 'NOT_FOUND',
                                message: 'User not found',
                            });
                        }
                        return [2 /*return*/, user];
                }
            });
        });
    }),
    // Update user profile
    updateProfile: trpc_1.publicProcedure
        .use(auth_1.authMiddleware)
        .input(updateProfileSchema)
        .mutation(function (_a) {
        var ctx = _a.ctx, input = _a.input;
        return __awaiter(void 0, void 0, void 0, function () {
            var name, phone, address, updateData, user;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        name = input.name, phone = input.phone, address = input.address;
                        updateData = {};
                        if (name)
                            updateData.name = name;
                        if (phone)
                            updateData.phone = phone;
                        return [4 /*yield*/, db_1.db.user.update({
                                where: { id: ctx.user.userId },
                                data: updateData,
                                select: {
                                    id: true,
                                    email: true,
                                    name: true,
                                    phone: true,
                                    role: true,
                                    isVerified: true,
                                    address: true,
                                    createdAt: true,
                                },
                            })];
                    case 1:
                        user = _b.sent();
                        if (!address) return [3 /*break*/, 3];
                        return [4 /*yield*/, db_1.db.address.upsert({
                                where: { userId: ctx.user.userId },
                                update: address,
                                create: __assign(__assign({}, address), { userId: ctx.user.userId }),
                            })];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3: return [2 /*return*/, user];
                }
            });
        });
    }),
    // Change password
    changePassword: trpc_1.publicProcedure
        .use(auth_1.authMiddleware)
        .input(zod_1.z.object({
        currentPassword: zod_1.z.string(),
        newPassword: zod_1.z.string().min(8),
    }))
        .mutation(function (_a) {
        var ctx = _a.ctx, input = _a.input;
        return __awaiter(void 0, void 0, void 0, function () {
            var currentPassword, newPassword, user, isValidPassword, hashedNewPassword;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        currentPassword = input.currentPassword, newPassword = input.newPassword;
                        return [4 /*yield*/, db_1.db.user.findUnique({
                                where: { id: ctx.user.userId },
                                select: { password: true },
                            })];
                    case 1:
                        user = _b.sent();
                        if (!user) {
                            throw new server_1.TRPCError({
                                code: 'NOT_FOUND',
                                message: 'User not found',
                            });
                        }
                        return [4 /*yield*/, bcryptjs_1.default.compare(currentPassword, user.password)];
                    case 2:
                        isValidPassword = _b.sent();
                        if (!isValidPassword) {
                            throw new server_1.TRPCError({
                                code: 'UNAUTHORIZED',
                                message: 'Current password is incorrect',
                            });
                        }
                        return [4 /*yield*/, bcryptjs_1.default.hash(newPassword, SALT_ROUNDS)];
                    case 3:
                        hashedNewPassword = _b.sent();
                        // Update password
                        return [4 /*yield*/, db_1.db.user.update({
                                where: { id: ctx.user.userId },
                                data: { password: hashedNewPassword },
                            })];
                    case 4:
                        // Update password
                        _b.sent();
                        return [2 /*return*/, { success: true }];
                }
            });
        });
    }),
});
