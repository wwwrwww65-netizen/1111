"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middleware = exports.publicProcedure = exports.router = exports.createContext = void 0;
var server_1 = require("@trpc/server");
var db_1 = require("@repo/db");
// The context is passed to all procedures
var createContext = function (_a) {
    var req = _a.req, res = _a.res;
    // Here you could get user session data
    // For now, we'll just pass the prisma client and request
    return {
        prisma: db_1.prisma,
        req: req,
        res: res,
        user: null,
    };
};
exports.createContext = createContext;
// You can use any variable name you like.
// We use t and procedural style to infer types as we add procedures.
var t = server_1.initTRPC.context().create();
exports.router = t.router;
exports.publicProcedure = t.procedure;
exports.middleware = t.middleware;
