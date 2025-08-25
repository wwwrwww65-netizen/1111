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
Object.defineProperty(exports, "__esModule", { value: true });
var msw_trpc_1 = require("msw-trpc");
var router_1 = require("../router");
var trpc_1 = require("../trpc");
var t = (0, msw_trpc_1.createTRPCMsw)(router_1.appRouter);
describe('Auth Router', function () {
    var mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        isVerified: false,
    };
    var mockToken = 'mock-jwt-token';
    beforeEach(function () {
        // Reset any mocks
        jest.clearAllMocks();
    });
    describe('register', function () {
        it('should register a new user successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var input, mockDb, ctx, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        input = {
                            email: 'newuser@example.com',
                            password: 'password123',
                            name: 'New User',
                        };
                        mockDb = {
                            user: {
                                findUnique: jest.fn().mockResolvedValue(null),
                                create: jest.fn().mockResolvedValue(mockUser),
                            },
                            cart: {
                                create: jest.fn().mockResolvedValue({ id: 'cart-1' }),
                            },
                        };
                        return [4 /*yield*/, (0, trpc_1.createContext)({ req: {}, res: {} })];
                    case 1:
                        ctx = _a.sent();
                        return [4 /*yield*/, router_1.appRouter.createCaller(ctx).auth.register(input)];
                    case 2:
                        result = _a.sent();
                        expect(result.user).toEqual(mockUser);
                        expect(result.token).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw error if user already exists', function () { return __awaiter(void 0, void 0, void 0, function () {
            var input, mockDb, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        input = {
                            email: 'existing@example.com',
                            password: 'password123',
                            name: 'Existing User',
                        };
                        mockDb = {
                            user: {
                                findUnique: jest.fn().mockResolvedValue(mockUser),
                            },
                        };
                        return [4 /*yield*/, (0, trpc_1.createContext)({ req: {}, res: {} })];
                    case 1:
                        ctx = _a.sent();
                        return [4 /*yield*/, expect(router_1.appRouter.createCaller(ctx).auth.register(input)).rejects.toThrow('User with this email already exists')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('login', function () {
        it('should login user successfully with valid credentials', function () { return __awaiter(void 0, void 0, void 0, function () {
            var input, mockUserWithPassword, ctx, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        input = {
                            email: 'test@example.com',
                            password: 'password123',
                        };
                        mockUserWithPassword = __assign(__assign({}, mockUser), { password: '$2a$12$hashedpassword' });
                        // Mock bcrypt to return true for password comparison
                        jest.mock('bcryptjs', function () { return ({
                            compare: jest.fn().mockResolvedValue(true),
                        }); });
                        return [4 /*yield*/, (0, trpc_1.createContext)({ req: {}, res: {} })];
                    case 1:
                        ctx = _a.sent();
                        return [4 /*yield*/, router_1.appRouter.createCaller(ctx).auth.login(input)];
                    case 2:
                        result = _a.sent();
                        expect(result.user).toEqual(mockUser);
                        expect(result.token).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw error with invalid credentials', function () { return __awaiter(void 0, void 0, void 0, function () {
            var input, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        input = {
                            email: 'test@example.com',
                            password: 'wrongpassword',
                        };
                        return [4 /*yield*/, (0, trpc_1.createContext)({ req: {}, res: {} })];
                    case 1:
                        ctx = _a.sent();
                        return [4 /*yield*/, expect(router_1.appRouter.createCaller(ctx).auth.login(input)).rejects.toThrow('Invalid email or password')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
