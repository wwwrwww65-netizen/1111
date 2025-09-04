"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_setup_1 = require("./trpc-setup");
const products_1 = require("./routers/products");
const auth_1 = require("./routers/auth");
const payments_1 = require("./routers/payments");
const email_1 = require("./routers/email");
const search_1 = require("./routers/search");
const admin_1 = require("./routers/admin");
const wishlist_1 = require("./routers/wishlist");
const coupons_1 = require("./routers/coupons");
const cart_1 = require("./routers/cart");
const orders_1 = require("./routers/orders");
exports.appRouter = (0, trpc_setup_1.router)({
    // All sub-routers will be merged here
    auth: auth_1.authRouter,
    products: products_1.productsRouter,
    payments: payments_1.paymentsRouter,
    email: email_1.emailRouter,
    search: search_1.searchRouter,
    admin: admin_1.adminRouter,
    wishlist: wishlist_1.wishlistRouter,
    coupons: coupons_1.couponsRouter,
    cart: cart_1.cartRouter,
    orders: orders_1.ordersRouter,
});
//# sourceMappingURL=router.js.map