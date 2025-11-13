import request from 'supertest';
import { expressApp } from '../index';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests';
const token = jwt.sign({ userId: 'admin-carts-test', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET);

describe('Admin Carts API', () => {
  let testUserId: string;
  let testCartId: string;
  let testGuestCartId: string;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { db } = require('@repo/db');
    
    // Create test admin user
    const admin = await db.user.upsert({ 
      where: { email: 'admin-carts@example.com' }, 
      update: {}, 
      create: { 
        id: 'admin-carts-test', 
        email: 'admin-carts@example.com', 
        name: 'Admin Carts', 
        password: '$2a$12$abcdefghijklmnopqrstuv', 
        role: 'ADMIN', 
        isVerified: true 
      } 
    });
    testUserId = admin.id;

    // Create test user and cart
    const user = await db.user.upsert({ 
      where: { email: 'cart-user@example.com' }, 
      update: {}, 
      create: { 
        id: 'cart-user-test', 
        email: 'cart-user@example.com', 
        name: 'Cart User', 
        password: '$2a$12$abcdefghijklmnopqrstuv', 
        role: 'USER', 
        isVerified: true 
      } 
    });

    // Create test category and product
    const cat = await db.category.upsert({ 
      where: { id: 'carts-test-cat' }, 
      update: {}, 
      create: { id: 'carts-test-cat', name: 'Carts Test' } 
    });
    
    const product = await db.product.create({ 
      data: { 
        name: 'Test Product', 
        description: 'Test', 
        price: 100, 
        images: ['https://example.com/image.jpg'], 
        categoryId: cat.id, 
        stockQuantity: 10 
      } 
    });

    // Create test cart with items
    const cart = await db.cart.create({ 
      data: { 
        userId: user.id 
      } 
    });
    testCartId = cart.id;

    await db.cartItem.create({ 
      data: { 
        cartId: cart.id, 
        productId: product.id, 
        quantity: 2 
      } 
    });

    // Create guest cart
    const guestCart = await db.guestCart.create({ 
      data: { 
        sessionId: 'test-session-123',
        userAgent: 'Test User Agent',
        ip: '127.0.0.1'
      } 
    });
    testGuestCartId = guestCart.id;

    await db.guestCartItem.create({ 
      data: { 
        cartId: guestCart.id, 
        productId: product.id, 
        quantity: 1 
      } 
    });
  });

  describe('GET /api/admin/carts', () => {
    it('should require authentication', async () => {
      const res = await request(expressApp).get('/api/admin/carts');
      expect(res.status).toBe(401);
    });

    it('should return user and guest carts with auth', async () => {
      const res = await request(expressApp)
        .get('/api/admin/carts')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('userCarts');
      expect(res.body).toHaveProperty('guestCarts');
      expect(Array.isArray(res.body.userCarts)).toBe(true);
      expect(Array.isArray(res.body.guestCarts)).toBe(true);
      
      // Verify cart structure
      if (res.body.userCarts.length > 0) {
        const cart = res.body.userCarts[0];
        expect(cart).toHaveProperty('id');
        expect(cart).toHaveProperty('user');
        expect(cart).toHaveProperty('items');
      }
      
      if (res.body.guestCarts.length > 0) {
        const guestCart = res.body.guestCarts[0];
        expect(guestCart).toHaveProperty('id');
        expect(guestCart).toHaveProperty('sessionId');
        expect(guestCart).toHaveProperty('items');
      }
    });

    it('should filter carts by since parameter', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow
      const res = await request(expressApp)
        .get(`/api/admin/carts?since=${encodeURIComponent(futureDate)}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body.userCarts.length).toBe(0);
      expect(res.body.guestCarts.length).toBe(0);
    });
  });

  describe('POST /api/admin/carts/notify', () => {
    it('should require authentication', async () => {
      const res = await request(expressApp)
        .post('/api/admin/carts/notify')
        .send({
          targets: [{ userId: testUserId }],
          title: 'Test',
          body: 'Test notification'
        });
      expect(res.status).toBe(401);
    });

    it('should validate request body', async () => {
      const res = await request(expressApp)
        .post('/api/admin/carts/notify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targets: [],
          title: 'Test',
          body: 'Test'
        });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('ok', false);
    });

    it('should send notification to users', async () => {
      const res = await request(expressApp)
        .post('/api/admin/carts/notify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targets: [{ userId: testUserId }],
          title: 'Test Notification',
          body: 'This is a test notification'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('sent');
      expect(res.body.sent).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('channel');
    });

    it('should send notification to guests', async () => {
      const res = await request(expressApp)
        .post('/api/admin/carts/notify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targets: [{ guestSessionId: 'test-session-123' }],
          title: 'Guest Notification',
          body: 'This is a guest notification'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body.sent).toBeGreaterThan(0);
    });

    it('should handle mixed targets (users and guests)', async () => {
      const res = await request(expressApp)
        .post('/api/admin/carts/notify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targets: [
            { userId: testUserId },
            { guestSessionId: 'test-session-123' }
          ],
          title: 'Mixed Notification',
          body: 'This is a mixed notification'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body.sent).toBeGreaterThan(0);
    });
  });
});
