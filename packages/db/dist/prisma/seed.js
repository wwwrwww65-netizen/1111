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
        var adminPassword, admin, userPassword, user, electronics, clothing, books, smartphones, laptops, products, productVariants, reviews, coupons, addresses, carts, cartItems, wishlistItems;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Starting database seeding...');
                    return [4 /*yield*/, bcryptjs_1.default.hash('admin123', 12)];
                case 1:
                    adminPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'admin@example.com' },
                            update: {},
                            create: {
                                email: 'admin@example.com',
                                name: 'Admin User',
                                password: adminPassword,
                                role: 'ADMIN',
                                isVerified: true,
                            },
                        })];
                case 2:
                    admin = _a.sent();
                    return [4 /*yield*/, bcryptjs_1.default.hash('user123', 12)];
                case 3:
                    userPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'user@example.com' },
                            update: {},
                            create: {
                                email: 'user@example.com',
                                name: 'Regular User',
                                password: userPassword,
                                role: 'USER',
                                isVerified: true,
                            },
                        })];
                case 4:
                    user = _a.sent();
                    console.log('✅ Users created');
                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var existing;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prisma.category.findFirst({ where: { name: 'Electronics' } })];
                                    case 1:
                                        existing = _a.sent();
                                        if (existing)
                                            return [2 /*return*/, existing];
                                        return [2 /*return*/, prisma.category.create({
                                                data: {
                                                    name: 'Electronics',
                                                    description: 'Electronic devices and gadgets',
                                                    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
                                                },
                                            })];
                                }
                            });
                        }); })()];
                case 5:
                    electronics = _a.sent();
                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var existing;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prisma.category.findFirst({ where: { name: 'Clothing' } })];
                                    case 1:
                                        existing = _a.sent();
                                        if (existing)
                                            return [2 /*return*/, existing];
                                        return [2 /*return*/, prisma.category.create({
                                                data: {
                                                    name: 'Clothing',
                                                    description: 'Fashion and apparel',
                                                    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
                                                },
                                            })];
                                }
                            });
                        }); })()];
                case 6:
                    clothing = _a.sent();
                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var existing;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prisma.category.findFirst({ where: { name: 'Books' } })];
                                    case 1:
                                        existing = _a.sent();
                                        if (existing)
                                            return [2 /*return*/, existing];
                                        return [2 /*return*/, prisma.category.create({
                                                data: {
                                                    name: 'Books',
                                                    description: 'Books and literature',
                                                    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
                                                },
                                            })];
                                }
                            });
                        }); })()];
                case 7:
                    books = _a.sent();
                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var existing;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prisma.category.findFirst({ where: { name: 'Smartphones' } })];
                                    case 1:
                                        existing = _a.sent();
                                        if (existing)
                                            return [2 /*return*/, existing];
                                        return [2 /*return*/, prisma.category.create({
                                                data: {
                                                    name: 'Smartphones',
                                                    description: 'Mobile phones and accessories',
                                                    parentId: electronics.id,
                                                },
                                            })];
                                }
                            });
                        }); })()];
                case 8:
                    smartphones = _a.sent();
                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var existing;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prisma.category.findFirst({ where: { name: 'Laptops' } })];
                                    case 1:
                                        existing = _a.sent();
                                        if (existing)
                                            return [2 /*return*/, existing];
                                        return [2 /*return*/, prisma.category.create({
                                                data: {
                                                    name: 'Laptops',
                                                    description: 'Portable computers',
                                                    parentId: electronics.id,
                                                },
                                            })];
                                }
                            });
                        }); })()];
                case 9:
                    laptops = _a.sent();
                    console.log('✅ Categories created');
                    return [4 /*yield*/, Promise.all([
                            prisma.product.upsert({
                                where: { sku: 'IPHONE15PRO' },
                                update: {},
                                create: {
                                    name: 'iPhone 15 Pro',
                                    description: 'Latest iPhone with advanced features and titanium design',
                                    price: 999.99,
                                    images: [
                                        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
                                        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
                                    ],
                                    categoryId: smartphones.id,
                                    stockQuantity: 50,
                                    sku: 'IPHONE15PRO',
                                    weight: 187,
                                    dimensions: '146.7 x 71.5 x 8.25 mm',
                                    brand: 'Apple',
                                    tags: ['smartphone', 'apple', 'iphone', '5g'],
                                },
                            }),
                            prisma.product.upsert({
                                where: { sku: 'MBP16M3' },
                                update: {},
                                create: {
                                    name: 'MacBook Pro 16"',
                                    description: 'Powerful laptop for professionals with M3 chip',
                                    price: 2499.99,
                                    images: [
                                        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
                                        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
                                    ],
                                    categoryId: laptops.id,
                                    stockQuantity: 25,
                                    sku: 'MBP16M3',
                                    weight: 2200,
                                    dimensions: '355.7 x 248.1 x 16.8 mm',
                                    brand: 'Apple',
                                    tags: ['laptop', 'apple', 'macbook', 'professional'],
                                },
                            }),
                            prisma.product.upsert({
                                where: { sku: 'SAMSUNGS24' },
                                update: {},
                                create: {
                                    name: 'Samsung Galaxy S24',
                                    description: 'Premium Android smartphone with AI features',
                                    price: 799.99,
                                    images: [
                                        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
                                        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
                                    ],
                                    categoryId: smartphones.id,
                                    stockQuantity: 40,
                                    sku: 'SAMSUNGS24',
                                    weight: 168,
                                    dimensions: '147.0 x 70.6 x 7.6 mm',
                                    brand: 'Samsung',
                                    tags: ['smartphone', 'samsung', 'android', '5g'],
                                },
                            }),
                            prisma.product.upsert({
                                where: { sku: 'DELLXPS13' },
                                update: {},
                                create: {
                                    name: 'Dell XPS 13',
                                    description: 'Ultra-thin laptop with InfinityEdge display',
                                    price: 1299.99,
                                    images: [
                                        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
                                        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
                                    ],
                                    categoryId: laptops.id,
                                    stockQuantity: 30,
                                    sku: 'DELLXPS13',
                                    weight: 1200,
                                    dimensions: '302 x 199 x 14.8 mm',
                                    brand: 'Dell',
                                    tags: ['laptop', 'dell', 'ultrabook', 'windows'],
                                },
                            }),
                            prisma.product.upsert({
                                where: { sku: 'NIKEAIRMAX270' },
                                update: {},
                                create: {
                                    name: 'Nike Air Max 270',
                                    description: 'Comfortable running shoes with Air Max technology',
                                    price: 150.0,
                                    images: [
                                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                                    ],
                                    categoryId: clothing.id,
                                    stockQuantity: 100,
                                    sku: 'NIKEAIRMAX270',
                                    weight: 320,
                                    dimensions: 'Various sizes',
                                    brand: 'Nike',
                                    tags: ['shoes', 'nike', 'running', 'sports'],
                                },
                            }),
                            prisma.product.upsert({
                                where: { sku: 'BOOKGATSBY' },
                                update: {},
                                create: {
                                    name: 'The Great Gatsby',
                                    description: 'Classic American novel by F. Scott Fitzgerald',
                                    price: 12.99,
                                    images: [
                                        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
                                        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
                                    ],
                                    categoryId: books.id,
                                    stockQuantity: 200,
                                    sku: 'BOOKGATSBY',
                                    weight: 250,
                                    dimensions: 'Paperback',
                                    brand: 'Scribner',
                                    tags: ['book', 'classic', 'fiction', 'literature'],
                                },
                            }),
                        ])];
                case 10:
                    products = _a.sent();
                    console.log('✅ Products created');
                    return [4 /*yield*/, Promise.all([
                            // iPhone variants
                            prisma.productVariant.createMany({
                                data: [
                                    { productId: products[0].id, name: 'Color', value: 'Natural Titanium', price: 999.99 },
                                    { productId: products[0].id, name: 'Color', value: 'Blue Titanium', price: 999.99 },
                                    { productId: products[0].id, name: 'Storage', value: '128GB', price: 999.99 },
                                    { productId: products[0].id, name: 'Storage', value: '256GB', price: 1099.99 },
                                    { productId: products[0].id, name: 'Storage', value: '512GB', price: 1299.99 },
                                ],
                                skipDuplicates: true,
                            }),
                            // MacBook variants
                            prisma.productVariant.createMany({
                                data: [
                                    { productId: products[1].id, name: 'Color', value: 'Space Black', price: 2499.99 },
                                    { productId: products[1].id, name: 'Color', value: 'Silver', price: 2499.99 },
                                    { productId: products[1].id, name: 'Storage', value: '512GB', price: 2499.99 },
                                    { productId: products[1].id, name: 'Storage', value: '1TB', price: 2699.99 },
                                ],
                                skipDuplicates: true,
                            }),
                            // Nike shoes variants
                            prisma.productVariant.createMany({
                                data: [
                                    { productId: products[4].id, name: 'Size', value: 'US 7', price: 150.0 },
                                    { productId: products[4].id, name: 'Size', value: 'US 8', price: 150.0 },
                                    { productId: products[4].id, name: 'Size', value: 'US 9', price: 150.0 },
                                    { productId: products[4].id, name: 'Size', value: 'US 10', price: 150.0 },
                                    { productId: products[4].id, name: 'Color', value: 'Black', price: 150.0 },
                                    { productId: products[4].id, name: 'Color', value: 'White', price: 150.0 },
                                ],
                                skipDuplicates: true,
                            }),
                        ])];
                case 11:
                    productVariants = _a.sent();
                    console.log('✅ Product variants created');
                    return [4 /*yield*/, Promise.all([
                            prisma.review.createMany({
                                data: [
                                    {
                                        productId: products[0].id,
                                        userId: user.id,
                                        rating: 5,
                                        comment: 'Amazing phone! The camera quality is outstanding.',
                                    },
                                    {
                                        productId: products[0].id,
                                        userId: admin.id,
                                        rating: 4,
                                        comment: 'Great performance, but a bit expensive.',
                                    },
                                    {
                                        productId: products[1].id,
                                        userId: user.id,
                                        rating: 5,
                                        comment: 'Perfect for my development work. Super fast!',
                                    },
                                    {
                                        productId: products[4].id,
                                        userId: user.id,
                                        rating: 4,
                                        comment: 'Very comfortable for running. Good quality.',
                                    },
                                    {
                                        productId: products[5].id,
                                        userId: admin.id,
                                        rating: 5,
                                        comment: 'A true classic. Must read for everyone.',
                                    },
                                ],
                                skipDuplicates: true,
                            }),
                        ])];
                case 12:
                    reviews = _a.sent();
                    console.log('✅ Reviews created');
                    return [4 /*yield*/, Promise.all([
                            prisma.coupon.createMany({
                                data: [
                                    {
                                        code: 'WELCOME10',
                                        discountType: 'PERCENTAGE',
                                        discountValue: 10,
                                        minOrderAmount: 50,
                                        maxUses: 100,
                                        validFrom: new Date(),
                                        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                        isActive: true,
                                    },
                                    {
                                        code: 'SAVE20',
                                        discountType: 'PERCENTAGE',
                                        discountValue: 20,
                                        minOrderAmount: 100,
                                        maxUses: 50,
                                        validFrom: new Date(),
                                        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                                        isActive: true,
                                    },
                                    {
                                        code: 'FREESHIP',
                                        discountType: 'FIXED',
                                        discountValue: 15,
                                        minOrderAmount: 75,
                                        maxUses: 200,
                                        validFrom: new Date(),
                                        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                                        isActive: true,
                                    },
                                    {
                                        code: 'FLASH25',
                                        discountType: 'PERCENTAGE',
                                        discountValue: 25,
                                        minOrderAmount: 150,
                                        maxUses: 25,
                                        validFrom: new Date(),
                                        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                                        isActive: true,
                                    },
                                ],
                                skipDuplicates: true,
                            }),
                        ])];
                case 13:
                    coupons = _a.sent();
                    console.log('✅ Coupons created');
                    return [4 /*yield*/, Promise.all([
                            prisma.address.upsert({
                                where: { userId: user.id },
                                update: {},
                                create: {
                                    userId: user.id,
                                    street: '123 Main Street',
                                    city: 'New York',
                                    state: 'NY',
                                    postalCode: '10001',
                                    country: 'USA',
                                    isDefault: true,
                                },
                            }),
                            prisma.address.upsert({
                                where: { userId: admin.id },
                                update: {},
                                create: {
                                    userId: admin.id,
                                    street: '456 Admin Avenue',
                                    city: 'Los Angeles',
                                    state: 'CA',
                                    postalCode: '90210',
                                    country: 'USA',
                                    isDefault: true,
                                },
                            }),
                        ])];
                case 14:
                    addresses = _a.sent();
                    console.log('✅ Addresses created');
                    return [4 /*yield*/, Promise.all([
                            prisma.cart.upsert({
                                where: { userId: user.id },
                                update: {},
                                create: { userId: user.id },
                            }),
                            prisma.cart.upsert({
                                where: { userId: admin.id },
                                update: {},
                                create: { userId: admin.id },
                            }),
                        ])];
                case 15:
                    carts = _a.sent();
                    console.log('✅ Carts created');
                    return [4 /*yield*/, Promise.all([
                            prisma.cartItem.createMany({
                                data: [
                                    {
                                        cartId: carts[0].id,
                                        productId: products[0].id,
                                        quantity: 1,
                                    },
                                    {
                                        cartId: carts[0].id,
                                        productId: products[4].id,
                                        quantity: 2,
                                    },
                                ],
                                skipDuplicates: true,
                            }),
                        ])];
                case 16:
                    cartItems = _a.sent();
                    console.log('✅ Cart items created');
                    return [4 /*yield*/, Promise.all([
                            prisma.wishlistItem.createMany({
                                data: [
                                    {
                                        userId: user.id,
                                        productId: products[1].id,
                                    },
                                    {
                                        userId: user.id,
                                        productId: products[2].id,
                                    },
                                    {
                                        userId: admin.id,
                                        productId: products[3].id,
                                    },
                                ],
                                skipDuplicates: true,
                            }),
                        ])];
                case 17:
                    wishlistItems = _a.sent();
                    console.log('✅ Wishlist items created');
                    console.log('🎉 Database seeding completed successfully!');
                    console.log('');
                    console.log('📋 Created:');
                    console.log("  \uD83D\uDC65 Users: ".concat(admin.email, " (admin), ").concat(user.email, " (user)"));
                    console.log("  \uD83D\uDCE6 Products: ".concat(products.length, " products with variants"));
                    console.log("  \uD83C\uDFF7\uFE0F Categories: ".concat(electronics.name, ", ").concat(clothing.name, ", ").concat(books.name));
                    console.log("  \u2B50 Reviews: ".concat(reviews[0].count, " reviews"));
                    console.log("  \uD83C\uDFAB Coupons: ".concat(coupons[0].count, " active coupons"));
                    console.log("  \uD83D\uDED2 Carts: ".concat(carts.length, " user carts"));
                    console.log("  \u2764\uFE0F Wishlist: ".concat(wishlistItems[0].count, " wishlist items"));
                    console.log('');
                    console.log('🔑 Login credentials:');
                    console.log("  Admin: ".concat(admin.email, " / admin123"));
                    console.log("  User: ".concat(user.email, " / user123"));
                    console.log('');
                    console.log('🎫 Available coupons:');
                    console.log('  WELCOME10 - 10% off (min $50)');
                    console.log('  SAVE20 - 20% off (min $100)');
                    console.log('  FREESHIP - $15 off shipping (min $75)');
                    console.log('  FLASH25 - 25% off (min $150)');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })
    .catch(function (e) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error(e);
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
