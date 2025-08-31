import request from 'supertest';
import { expressApp } from '../index';
import crypto from 'crypto';
import { db } from '@repo/db';

describe('Shipping webhook HMAC', () => {
  beforeAll(async () => {
    process.env.SHIP_WEBHOOK_SECRET = 'test_secret';
    const user = await db.user.upsert({ where: { email: 'user@e2e.com' }, update: {}, create: { email: 'user@e2e.com', name: 'U', password: 'x' } });
    const cat = await db.category.upsert({ where: { id: 'ship-cat' }, update: {}, create: { id: 'ship-cat', name: 'Ship' } });
    const product = await db.product.create({ data: { name: 'Ship', description: 'Ship', price: 5, images: [], categoryId: cat.id, stockQuantity: 2 } });
    const order = await db.order.create({ data: { userId: user.id, status: 'PAID', total: 5 } });
    await db.orderItem.create({ data: { orderId: order.id, productId: product.id, quantity: 1, price: 5 } });
  });
  it('rejects invalid signature', async () => {
    const body = Buffer.from(JSON.stringify({ type: 'shipment.created', data: { orderId: 'nope', trackingNumber: 'T' } }));
    const res = await request(expressApp).post('/webhooks/shipping').set('x-shipping-signature', 'bad').set('content-type','application/json').send(body);
    expect(res.status).toBe(401);
  });
  it('accepts valid signature and updates order', async () => {
    const order = await db.order.findFirst({});
    const payload = Buffer.from(JSON.stringify({ type: 'shipment.created', data: { orderId: order!.id, trackingNumber: 'TN-1' } }));
    const sig = crypto.createHmac('sha256', process.env.SHIP_WEBHOOK_SECRET as string).update(payload).digest('hex');
    const res = await request(expressApp).post('/webhooks/shipping').set('x-shipping-signature', sig).set('content-type','application/json').send(payload);
    expect(res.status).toBe(200);
    const updated = await db.order.findUnique({ where: { id: order!.id } });
    expect(updated?.status).toBe('SHIPPED');
  });
});

