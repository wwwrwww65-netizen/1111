import 'dotenv/config';
import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { createContext } from './trpc';
import { applySecurityMiddleware } from './middleware/security';
import cookieParser from 'cookie-parser';

// Optional Sentry init
let sentryEnabled = false;
try {
  // Dynamically require to avoid build-time errors if missing
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sentry = require('@sentry/node');
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    sentryEnabled = true;
  }
} catch {}

const app = express();

// Apply security middleware
applySecurityMiddleware(app);

<<<<<<< HEAD
=======
// Parse cookies
app.use(cookieParser());

>>>>>>> origin/main
// Root endpoint for Render root URL
app.get('/', (req, res) => {
  res.json({
    name: 'E-commerce API',
    status: 'ok',
    endpoints: {
      health: '/health',
      trpc: '/trpc'
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

<<<<<<< HEAD
=======
// Error test endpoint for monitoring
app.get('/error-test', (_req, _res) => {
  if (sentryEnabled) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/node');
    Sentry.captureException(new Error('Test error from /error-test'));
  }
  throw new Error('Test error endpoint hit');
});

>>>>>>> origin/main
// Informational handler for GET /trpc (tRPC expects JSON-RPC calls; this is a friendly message)
app.get('/trpc', (req, res) => {
  res.status(200).json({
    message: 'tRPC endpoint is live.',
<<<<<<< HEAD
    howToUse: 'Use a tRPC client (e.g., httpBatchLink) or POST JSON-RPC to /trpc with a procedure path such as search.searchProducts.',
=======
    howToUse: 'Use a tRPC client (httpBatchLink) or POST JSON-RPC to /trpc with a procedure path (e.g., search.searchProducts).',
>>>>>>> origin/main
    example: {
      procedure: 'search.searchProducts',
      url: '/trpc',
      method: 'POST'
    }
  });
});

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 API server listening on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 tRPC endpoint: http://localhost:${port}/trpc`);
});

export type AppRouter = typeof appRouter;
