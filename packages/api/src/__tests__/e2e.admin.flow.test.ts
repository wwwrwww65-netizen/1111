import request from 'supertest';
import { expressApp } from '../index';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests';
const token = jwt.sign({ userId: 'admin-e2e', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET);

let seededOrderId: string;

describe('Admin E2E flow', () => {
  beforeAll(async () => {
    // seed minimal order/payment
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { db } = require('@repo/db');
    // ensure admin-e2e has permissions via roles if RBAC enforced
    const admin = await db.user.upsert({ where: { email: 'admin@example.com' }, update: {}, create: { id: 'admin-e2e', email: 'admin@example.com', name: 'Admin', password: '$2a$12$abcdefghijklmnopqrstuv', role: 'ADMIN', isVerified: true } });
    const role = await db.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
    await db.userRoleLink.upsert({ where: { userId_roleId: { userId: admin.id, roleId: role.id } }, update: {}, create: { userId: admin.id, roleId: role.id } });
    const user = await db.user.upsert({ where: { email: 'admin@example.com' }, update: {}, create: { email: 'admin@example.com', name: 'Admin', password: '$2a$12$abcdefghijklmnopqrstuv', role: 'ADMIN', isVerified: true } });
    const cat = await db.category.upsert({ where: { id: 'e2e-cat' }, update: {}, create: { id: 'e2e-cat', name: 'E2E' } });
    const product = await db.product.create({ data: { name: 'E2E', description: 'E2E', price: 10, images: [], categoryId: cat.id, stockQuantity: 5 } });
    const order = await db.order.create({ data: { userId: user.id, status: 'PAID', total: 10 } });
    await db.orderItem.create({ data: { orderId: order.id, productId: product.id, quantity: 1, price: 10 } });
    await db.payment.create({ data: { orderId: order.id, amount: 10, currency: 'USD', method: 'STRIPE', status: 'COMPLETED' } });
    seededOrderId = order.id;
  });
  it('inventory list requires auth', async () => {
    const res = await request(expressApp).get('/api/admin/inventory/list');
    expect(res.status).toBe(401);
  });
  it('inventory list OK with token', async () => {
    const res = await request(expressApp).get('/api/admin/inventory/list').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
  it('orders ship and payments refund', async () => {
    expect(seededOrderId).toBeTruthy();
    const ship = await request(expressApp).post('/api/admin/orders/ship').set('Authorization', `Bearer ${token}`).send({ orderId: seededOrderId });
    expect(ship.status).toBe(200);
    const refund = await request(expressApp).post('/api/admin/payments/refund').set('Authorization', `Bearer ${token}`).send({ orderId: seededOrderId });
    expect(refund.status).toBe(200);
  });
});

