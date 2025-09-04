"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = void 0;
const db_1 = require("@repo/db");
const createContext = ({ req, res, }) => {
    return {
        prisma: db_1.prisma,
        req,
        res,
        user: null,
    };
};
exports.createContext = createContext;
//# sourceMappingURL=context.js.map