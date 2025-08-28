/* eslint-disable no-console */
import crypto from 'node:crypto';

const TRPC_URL = process.env.TRPC_URL || process.env.NEXT_PUBLIC_TRPC_URL || 'http://localhost:4000/trpc';
const API_BASE = process.env.API_BASE || 'http://localhost:4000';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';



async function trpcCall(path, input, cookie) {
	// Single-call JSON-RPC expected by tRPC HTTP: { id, json } where json is the input object
	const res = await fetch(`${TRPC_URL.replace(/\/$/, '')}/${path}`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(cookie ? { cookie } : {}),
		},
		body: JSON.stringify({ id: 1, json: input }),
	});
	const setCookie = res.headers.get('set-cookie') || '';
	const json = await res.json();
	if (!res.ok) {
		throw new Error(`tRPC call failed: ${path} -> ${res.status} ${JSON.stringify(json)}`);
	}
	return { json, setCookie };
}

function extractAuthCookie(setCookieHeader) {
	if (!setCookieHeader) return '';
	const match = setCookieHeader.match(/(^|,\s*)auth_token=[^;]+/);
	if (!match) return '';
	const cookie = match[0].trim().split(',').pop();
	return cookie || '';
}

async function main() {
	console.log('Smoke: register/login, cart→order→payment, webhook, inventory');
	const email = `user_${Date.now()}@example.com`;
	const password = 'StrongPassw0rd!';
	let cookie = '';

	// Try register
	try {
		await trpcCall('auth.register', { email, password, name: 'User' }, '');
		const login = await trpcCall('auth.login', { email, password }, '');
		cookie = extractAuthCookie(login.setCookie);
		if (!cookie) throw new Error('No auth cookie received after login');
		console.log('✔ Login cookie acquired');
	} catch (e) {
		console.log('Register/login failed, attempting seeded admin login...');
		const admin = await trpcCall('auth.login', { email: 'admin@example.com', password: 'admin123' }, '');
		cookie = extractAuthCookie(admin.setCookie);
		if (!cookie) throw new Error('No auth cookie from admin login');
	}

	// Find a product
	const products = await trpcCall('products.list', { limit: 1 }, cookie);
	const first = products?.json?.result?.data?.json?.items?.[0];
	if (!first?.id) throw new Error('No products available for test');
	console.log('✔ Product found:', first.id);

	// Add to cart and create order
	await trpcCall('cart.addItem', { productId: first.id, quantity: 1 }, cookie);
	const orderRes = await trpcCall('orders.createOrder', { }, cookie);
	const order = orderRes?.json?.result?.data?.json?.order;
	if (!order?.id) throw new Error('Order not created');
	console.log('✔ Order created:', order.id, 'total:', order.total);

	// Create payment intent
	const piRes = await trpcCall('payments.createPaymentIntent', { amount: order.total, currency: 'usd', orderId: order.id }, cookie);
	const pi = piRes?.json?.result?.data?.json;
	if (!pi?.paymentIntentId) throw new Error('Payment intent not created');
	console.log('✔ PaymentIntent:', pi.paymentIntentId);

	// Simulate Stripe webhook success
	if (!WEBHOOK_SECRET) {
		console.log('⚠ STRIPE_WEBHOOK_SECRET not set; skipping webhook verification.');
	} else {
		const payloadObj = {
			id: `evt_${Date.now()}`,
			type: 'payment_intent.succeeded',
			data: { object: { id: pi.paymentIntentId } },
		};
		const payload = JSON.stringify(payloadObj);
		const timestamp = Math.floor(Date.now() / 1000);
		const signedPayload = `${timestamp}.${payload}`;
		const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(signedPayload).digest('hex');
		const sigHeader = `t=${timestamp},v1=${signature}`;
		const whRes = await fetch(`${API_BASE}/webhooks/stripe`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', 'stripe-signature': sigHeader },
			body: payload,
		});
		if (!whRes.ok) {
			const t = await whRes.text();
			throw new Error(`Webhook failed: ${whRes.status} ${t}`);
		}
		console.log('✔ Webhook delivered');
	}

	// Verify order paid
	const orders = await trpcCall('orders.listOrders', {}, cookie);
	const list = orders?.json?.result?.data?.json?.orders || [];
	const myOrder = list.find(o => o.id === order.id);
	if (!myOrder) throw new Error('Order not found after payment');
	console.log('Order status:', myOrder.status);
	if (WEBHOOK_SECRET && myOrder.status !== 'PAID') {
		throw new Error('Order not marked PAID after webhook');
	}

	// Check CSP header
	const root = await fetch(`${API_BASE}/`);
	const csp = root.headers.get('content-security-policy');
	if (!csp) console.log('⚠ No CSP header found'); else console.log('✔ CSP header present');

	console.log('✔ Smoke flow OK');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

