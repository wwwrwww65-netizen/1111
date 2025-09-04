"use strict";
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
var client_1 = require("@prisma/client");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var adminPassword, adminRole, perms, _i, perms_1, key, allPerms, _a, allPerms_1, p, adminUser;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🌱 Seeding admin-only fixtures...');
                    return [4 /*yield*/, bcryptjs_1.default.hash('admin123', 12)];
                case 1:
                    adminPassword = _b.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'admin@example.com' },
                            update: { role: 'ADMIN', isVerified: true, twoFactorEnabled: false },
                            create: {
                                email: 'admin@example.com',
                                name: 'Admin User',
                                password: adminPassword,
                                role: 'ADMIN',
                                isVerified: true,
                                twoFactorEnabled: false,
                            },
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, prisma.role.upsert({
                            where: { name: 'ADMIN' },
                            update: {},
                            create: { name: 'ADMIN', description: 'Full access' },
                        })];
                case 3:
                    adminRole = _b.sent();
                    perms = ['inventory.read', 'inventory.write', 'orders.manage', 'payments.manage', 'users.manage', 'coupons.manage', 'settings.manage'];
                    _i = 0, perms_1 = perms;
                    _b.label = 4;
                case 4:
                    if (!(_i < perms_1.length)) return [3 /*break*/, 7];
                    key = perms_1[_i];
                    return [4 /*yield*/, prisma.permission.upsert({ where: { key: key }, update: {}, create: { key: key } })];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [4 /*yield*/, prisma.permission.findMany({ where: { key: { in: perms } } })];
                case 8:
                    allPerms = _b.sent();
                    _a = 0, allPerms_1 = allPerms;
                    _b.label = 9;
                case 9:
                    if (!(_a < allPerms_1.length)) return [3 /*break*/, 12];
                    p = allPerms_1[_a];
                    return [4 /*yield*/, prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } }, update: {}, create: { roleId: adminRole.id, permissionId: p.id } })];
                case 10:
                    _b.sent();
                    _b.label = 11;
                case 11:
                    _a++;
                    return [3 /*break*/, 9];
                case 12: return [4 /*yield*/, prisma.user.findFirst({ where: { email: 'admin@example.com' } })];
                case 13:
                    adminUser = _b.sent();
                    if (!adminUser) return [3 /*break*/, 15];
                    return [4 /*yield*/, prisma.userRoleLink.upsert({ where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } }, update: {}, create: { userId: adminUser.id, roleId: adminRole.id } })];
                case 14:
                    _b.sent();
                    _b.label = 15;
                case 15: 
                // Basic categories without products
                return [4 /*yield*/, prisma.category.upsert({
                        where: { id: 'seed-electronics' },
                        update: {},
                        create: { id: 'seed-electronics', name: 'Electronics' },
                    })];
                case 16:
                    // Basic categories without products
                    _b.sent();
                    return [4 /*yield*/, prisma.category.upsert({
                            where: { id: 'seed-operations' },
                            update: {},
                            create: { id: 'seed-operations', name: 'Operations' },
                        })];
                case 17:
                    _b.sent();
                    console.log('✅ Admin-only seed completed');
                    return [2 /*return*/];
            }
        });
    });
}
main().finally(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, prisma.$disconnect()];
}); }); });
