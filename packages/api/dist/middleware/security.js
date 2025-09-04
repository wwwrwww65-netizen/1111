"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySecurityMiddleware = exports.authRateLimit = exports.rateLimitConfig = exports.corsOptions = void 0;
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
// CORS configuration
const buildAllowedOrigins = () => {
    const origins = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
    const extra = process.env.CORS_ALLOW_ORIGINS; // comma-separated list
    if (appUrl)
        origins.push(appUrl);
    if (adminUrl)
        origins.push(adminUrl);
    if (extra)
        origins.push(...extra.split(',').map((s) => s.trim()).filter(Boolean));
    // Known deployment fallbacks for current project
    origins.push('https://jeeey1.onrender.com', 'https://jeeey-manger.onrender.com');
    // In non-prod, include local defaults as well
    if (process.env.NODE_ENV !== 'production') {
        origins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081');
    }
    if (origins.length === 0)
        origins.push('http://localhost:3000');
    return Array.from(new Set(origins));
};
exports.corsOptions = {
    origin: (origin, callback) => {
        const allowed = buildAllowedOrigins();
        if (!origin)
            return callback(null, true); // non-browser or same-origin
        if (allowed.includes(origin))
            return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
};
// Rate limiting configuration
exports.rateLimitConfig = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Stricter rate limit for auth endpoints
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply security middleware to Express app
const applySecurityMiddleware = (app) => {
    // Basic security headers
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                defaultSrc: ["'self'"],
                // Allow styles from self; UI frameworks inline styles are not used here
                styleSrc: ["'self'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        // For API responses, disable COEP to avoid cross-origin fetch blocking
        crossOriginEmbedderPolicy: false,
        // Loosen COOP to allow integrations/popups if needed
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
        // Allow cross-origin consumers (the web/admin frontends)
        crossOriginResourcePolicy: { policy: "cross-origin" },
        hsts: process.env.NODE_ENV === 'production' ? { maxAge: 15552000, includeSubDomains: true, preload: true } : false,
    }));
    // CORS (with credentials for cookies)
    app.use((0, cors_1.default)(exports.corsOptions));
    // Ensure OPTIONS preflight responds with proper headers
    app.options('*', (0, cors_1.default)(exports.corsOptions));
    // Manual header reinforcement for some proxies/CDNs
    app.use((req, res, next) => {
        const allowed = buildAllowedOrigins();
        const origin = req.headers.origin;
        if (origin && allowed.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Vary', 'Origin');
            res.header('Access-Control-Allow-Credentials', 'true');
        }
        next();
    });
    // Rate limiting
    app.use(exports.rateLimitConfig);
    // Body parser limits
    app.use(require('express').json({ limit: '10mb' }));
    app.use(require('express').urlencoded({ extended: true, limit: '10mb' }));
    // Remove X-Powered-By header
    app.disable('x-powered-by');
};
exports.applySecurityMiddleware = applySecurityMiddleware;
//# sourceMappingURL=security.js.map