"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
var trpc_1 = require("./trpc");
var products_1 = require("./routers/products");
var auth_1 = require("./routers/auth");
exports.appRouter = (0, trpc_1.router)({
    // All sub-routers will be merged here
    auth: auth_1.authRouter,
    products: products_1.productsRouter,
});
