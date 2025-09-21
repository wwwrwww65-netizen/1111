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
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// Rate limiting configuration
export const rateLimitConfig = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
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

  // CORS (avoid duplicating headers with NGINX in production)
  if (process.env.NODE_ENV !== 'production') {
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));
  }

  // Rate limiting
  app.use(rateLimitConfig);

  // Body parser limits
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '10mb' }));

  // Remove X-Powered-By header
  app.disable('x-powered-by');
};