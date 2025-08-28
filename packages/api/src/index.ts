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

// Stripe webhook MUST be registered BEFORE any body parser middlewares
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
	try {
		const stripeSecret = process.env.STRIPE_SECRET_KEY;
		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
		if (!stripeSecret || !webhookSecret) {
			return res.status(500).json({ error: 'Stripe secrets not configured' });
		}
		const Stripe = require('stripe');
		const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
		const sig = req.headers['stripe-signature'];
		let event;
		try {
			event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
		} catch (err) {
			return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
		}
		const { db } = require('@repo/db');
		if (event.type === 'payment_intent.succeeded') {
			const intent = event.data.object;
			const paymentIntentId = intent.id as string;
			// Update payment + order, adjust inventory in a transaction
			await db.$transaction(async (tx: any) => {
				const payment = await tx.payment.update({
					where: { stripeId: paymentIntentId },
					data: { status: 'COMPLETED' },
				});
				await tx.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });
				const items = await tx.orderItem.findMany({ where: { orderId: payment.orderId } });
				for (const it of items) {
					await tx.product.update({
						where: { id: it.productId },
						data: { stockQuantity: { decrement: it.quantity } },
					});
				}
			});
		}
		if (event.type === 'payment_intent.payment_failed') {
			const intent = event.data.object;
			const paymentIntentId = intent.id as string;
			await require('@repo/db').db.payment.update({
				where: { stripeId: paymentIntentId },
				data: { status: 'FAILED' },
			});
		}
		return res.json({ received: true });
	} catch (e) {
		return res.status(500).json({ error: 'internal_error' });
	}
});

// Apply security middleware AFTER webhook so JSON parser doesn't consume raw body
applySecurityMiddleware(app);
// Parse cookies
app.use(cookieParser());

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

// Error test endpoint for monitoring
app.get('/error-test', (_req, _res) => {
  if (sentryEnabled) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/node');
    Sentry.captureException(new Error('Test error from /error-test'));
  }
  throw new Error('Test error endpoint hit');
});
// Informational handler for GET /trpc (tRPC expects JSON-RPC calls; this is a friendly message)
app.get('/trpc', (req, res) => {
  res.status(200).json({
    message: 'tRPC endpoint is live.',
    howToUse: 'Use a tRPC client (httpBatchLink) or POST JSON-RPC to /trpc with a procedure path (e.g., search.searchProducts).',
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
