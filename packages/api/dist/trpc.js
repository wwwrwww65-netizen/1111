"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedProcedure = exports.middleware = exports.publicProcedure = exports.router = exports.t = exports.createContext = void 0;
const server_1 = require("@trpc/server");
const db_1 = require("@repo/db");
const auth_1 = require("./middleware/auth");
// The context is passed to all procedures
const createContext = ({ req, res, }) => {
    return {
        prisma: db_1.prisma,
        req,
        res,
        user: null,
    };
};
exports.createContext = createContext;
const trpc = server_1.initTRPC.context().create();
exports.t = trpc;
exports.router = trpc.router;
exports.publicProcedure = trpc.procedure;
exports.middleware = trpc.middleware;
exports.protectedProcedure = trpc.procedure.use(auth_1.authMiddleware);
//# sourceMappingURL=trpc.js.map