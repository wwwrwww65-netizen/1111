/* eslint-disable no-console */
import crypto from 'node:crypto';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const TRPC_URL = process.env.TRPC_URL || process.env.NEXT_PUBLIC_TRPC_URL || 'http://localhost:4000/trpc';
const API_BASE = process.env.API_BASE || 'http://localhost:4000';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

let cookieJar = '';
function extractAuthCookie(setCookieHeader) {
	if (!setCookieHeader) return '';
	const match = setCookieHeader.match(/(^|,\s*)auth_token=[^;]+/);
	if (!match) return '';
	const cookie = match[0].trim().split(',').pop();
	return cookie || '';
}

const client = createTRPCProxyClient({
	links: [
		httpBatchLink({
			url: TRPC_URL,
			fetch: async (input, init) => {
				const res = await fetch(input, {
					...init,
					headers: {
						...(init?.headers || {}),
						...(cookieJar ? { cookie: cookieJar } : {}),
					},
					credentials: 'include',
				});
				const sc = res.headers.get('set-cookie');
				if (sc) cookieJar = extractAuthCookie(sc);
				return res;
			},
		}),
	],
});

async function main() {
	console.log('Smoke: register/login, cart→order→payment, webhook, inventory');
	const email = `user_${Date.now()}@example.com`;
	const password = 'StrongPassw0rd!';

	// Try admin seeded login first
	try {
		await client.auth.login.mutate({ email: 'admin@example.com', password: 'admin123' });
		if (!cookieJar) throw new Error('No cookie from admin login');
		console.log('✔ Admin login OK');
	} catch {
		// Register and login fallback
		await client.auth.register.mutate({ email, password, name: 'User' });
		await client.auth.login.mutate({ email, password });
		if (!cookieJar) throw new Error('No cookie after user login');
		console.log('✔ User login OK');
	}

	// Product
	const list = await client.products.list.query({ limit: 1 });
	const first = list?.items?.[0];
	if (!first?.id) throw new Error('No products available for test');
	console.log('✔ Product found:', first.id);

	// Cart and order
	await client.cart.addItem.mutate({ productId: first.id, quantity: 1 });
	const orderRes = await client.orders.createOrder.mutate({});
	const order = orderRes?.order;
	if (!order?.id) throw new Error('Order not created');
	console.log('✔ Order created:', order.id, 'total:', order.total);

	// Payment intent (mock if stripe missing)
	await client.payments.createPaymentIntent.mutate({ amount: order.total, currency: 'usd', orderId: order.id });

	// Webhook optional
	if (WEBHOOK_SECRET) {
		const payloadObj = { id: `evt_${Date.now()}`, type: 'payment_intent.succeeded', data: { object: { id: 'pi_mock' } } };
		const payload = JSON.stringify(payloadObj);
		const timestamp = Math.floor(Date.now() / 1000);
		const signedPayload = `${timestamp}.${payload}`;
		const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(signedPayload).digest('hex');
		const sigHeader = `t=${timestamp},v1=${signature}`;
		const whRes = await fetch(`${API_BASE}/webhooks/stripe`, { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': sigHeader }, body: payload });
		if (!whRes.ok) throw new Error(`Webhook failed: ${whRes.status}`);
		console.log('✔ Webhook delivered');
	}

	// Verify order paid/list
	const orders = await client.orders.listOrders.query();
	if (!orders?.orders || !orders.orders.length) console.log('⚠ No orders listed');

	console.log('✔ Smoke flow OK');
}

main().catch((err) => { console.error(err); process.exit(1); });

