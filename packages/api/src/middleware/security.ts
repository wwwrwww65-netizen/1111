import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Express } from 'express';

// CORS configuration
const buildAllowedOrigins = (): string[] => {
  const origins: string[] = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
  const extra = process.env.CORS_ALLOW_ORIGINS; // comma-separated list
  if (appUrl) origins.push(appUrl);
  if (adminUrl) origins.push(adminUrl);
  if (extra) origins.push(...extra.split(',').map((s) => s.trim()).filter(Boolean));
  // Allow subdomains of COOKIE_DOMAIN if provided
  const cookieDomain = process.env.COOKIE_DOMAIN;
  if (cookieDomain && cookieDomain.startsWith('.')) {
    const root = cookieDomain.slice(1);
    origins.push(`https://${root}`);
    origins.push(`https://admin.${root}`);
    origins.push(`https://api.${root}`);
    origins.push(`https://*.${root}`);
  }
  // Production fallback: allow known domain if COOKIE_DOMAIN is not set
  if (!cookieDomain && process.env.NODE_ENV === 'production') {
    const root = 'jeeey.com';
    origins.push(`https://${root}`);
    origins.push(`https://www.${root}`);
    origins.push(`https://admin.${root}`);
    origins.push(`https://api.${root}`);
    origins.push(`https://m.${root}`);
  }
  // In non-prod, include local defaults as well
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081');
  }
  if (origins.length === 0) origins.push('http://localhost:3000');
  return Array.from(new Set(origins));
};

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowed = buildAllowedOrigins();
    if (!origin) return callback(null, true); // non-browser or same-origin
    if (allowed.includes(origin)) return callback(null, true);
    // Allow any subdomain under COOKIE_DOMAIN root (e.g., m.jeeey.com) when COOKIE_DOMAIN is set
    try {
      const cookieDomain = process.env.COOKIE_DOMAIN || '';
      const root = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
      if (root) {
        const u = new URL(origin);
        const host = u.hostname || '';
        if (host === root || host.endsWith('.' + root)) return callback(null, true);
      }
    } catch { }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Origin',
    'X-Requested-With',
    'Accept',
    'X-Shop-Client',
  ],
  optionsSuccessStatus: 204,
};

// Rate limiting configuration (enabled for production only)
export const rateLimitConfig = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 600, // allow 600 req/min baseline to avoid admin throttling
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    try {
      const p = String((req as any).path || (req as any).originalUrl || '');
      const m = String((req as any).method || 'GET').toUpperCase();
      // Always skip rate limit for admin API routes (protected) and media ops
      if (p.startsWith('/api/admin')) return true;
      if (p.startsWith('/uploads/')) return true;
      // Skip public cacheable shop endpoints
      if (m === 'GET' && /^\/api\/(currency|categories|products|product|recommendations|reviews|cms|geo|shipping|payments)/.test(p)) return true;
    } catch { }
    return false;
  },
  keyGenerator: (req /*, _res */) => {
    const ip = (req.ip || (req.socket && (req.socket as any).remoteAddress) || '') as string;
    const client = String((req.headers['x-shop-client'] as string) || '').toLowerCase();
    // Whitelist admin actors via auth header presence
    const hasAuth = Boolean((req.headers['authorization'] as string) || '');
    return hasAuth ? `admin|${ip}|${client}` : `${ip}|${client}`;
  },
});

// Stricter rate limit for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply security middleware to Express app
export const applySecurityMiddleware = (app: Express) => {
  // Basic security headers
  app.use(helmet({
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

  // CORS (enable in all environments; NGINX should not duplicate Access-Control-Allow-* for API vhost)
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // Prevent caches for admin/API responses to ensure fresh data after mutations
  app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // Rate limiting (enable only in production)
  if (process.env.NODE_ENV === 'production') {
    app.use(rateLimitConfig);
  }

  // Body parser limits (allow up to ~20mb to accommodate base64 images of 10mb)
  app.use(require('express').json({ limit: '20mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '20mb' }));

  // Remove X-Powered-By header
  app.disable('x-powered-by');
};