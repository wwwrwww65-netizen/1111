import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { createContext } from './trpc';
import { applySecurityMiddleware } from './middleware/security';

const app = express();

// Apply security middleware
applySecurityMiddleware(app);

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
