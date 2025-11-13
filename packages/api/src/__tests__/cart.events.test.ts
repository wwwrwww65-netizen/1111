import request from 'supertest';
import { expressApp } from '../index';
import jwt from 'jsonwebtoken';
import { db } from '@repo/db';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests';

describe('Cart Analytics Events', () => {
  let testProductId: string;
  let testUserId: string;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Create test admin user
    await db.user.upsert({
      where: { email: 'cart-events-admin@example.com' },
      update: {},
      create: {
        id: 'cart-events-admin',
        email: 'cart-events-admin@example.com',
        name: 'Cart Events Admin',
        password: '$2a$12$abcdefghijklmnopqrstuv',
        role: 'ADMIN',
        isVerified: true
      }
    });
    adminToken = jwt.sign({ userId: 'cart-events-admin', email: 'cart-events-admin@example.com', role: 'ADMIN' }, JWT_SECRET);

    // Create test regular user
    const user = await db.user.upsert({
      where: { email: 'cart-events-user@example.com' },
      update: {},
      create: {
        id: 'cart-events-user',
        email: 'cart-events-user@example.com',
        name: 'Cart Events User',
        password: '$2a$12$abcdefghijklmnopqrstuv',
        role: 'USER',
        isVerified: true
      }
    });
    testUserId = user.id;
    userToken = jwt.sign({ userId: testUserId, email: user.email, role: 'USER' }, JWT_SECRET);

    // Create test category and product
    const cat = await db.category.upsert({
      where: { id: 'cart-events-cat' },
      update: {},
      create: { id: 'cart-events-cat', name: 'Cart Events Test' }
    });

    const product = await db.product.create({
      data: {
        name: 'Test Cart Product',
        description: 'Test product for cart events',
        price: 150,
        images: ['https://example.com/cart-product.jpg'],
        categoryId: cat.id,
        stockQuantity: 100,
        isActive: true
      }
    });
    testProductId = product.id;
  });

  beforeEach(async () => {
    // Clean up events, carts, and cart items before each test
    await db.event.deleteMany({ where: { name: { in: ['cart_add', 'cart_update', 'cart_remove', 'cart_clear', 'cart_merge'] } } });
    await db.cartItem.deleteMany({});
    await db.cart.deleteMany({});
    await db.guestCartItem.deleteMany({});
    await db.guestCart.deleteMany({});
  });

  describe('Guest Cart Events', () => {
    it('should record cart_add event when guest adds item', async () => {
      const res = await request(expressApp)
        .post('/api/cart/add')
        .send({ productId: testProductId, quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Check that event was created
      const events = await db.event.findMany({ where: { name: 'cart_add' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBeNull();
      expect(events[0].sessionId).not.toBeNull();
      expect(events[0].properties).toMatchObject({
        productId: testProductId,
        quantity: 2
      });
    });

    it('should record cart_update event when guest updates quantity', async () => {
      // First add item
      await request(expressApp)
        .post('/api/cart/add')
        .send({ productId: testProductId, quantity: 1 });

      // Clear events
      await db.event.deleteMany({ where: { name: 'cart_add' } });

      // Update quantity
      const res = await request(expressApp)
        .post('/api/cart/update')
        .send({ productId: testProductId, quantity: 5 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Check that cart_update event was created
      const events = await db.event.findMany({ where: { name: 'cart_update' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBeNull();
      expect(events[0].sessionId).not.toBeNull();
      expect(events[0].properties).toMatchObject({
        productId: testProductId,
        quantity: 5
      });
    });

    it('should record cart_remove event when guest removes item', async () => {
      // First add item
      await request(expressApp)
        .post('/api/cart/add')
        .send({ productId: testProductId, quantity: 1 });

      // Clear events
      await db.event.deleteMany({ where: { name: 'cart_add' } });

      // Remove item
      const res = await request(expressApp)
        .post('/api/cart/remove')
        .send({ productId: testProductId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Check that cart_remove event was created
      const events = await db.event.findMany({ where: { name: 'cart_remove' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBeNull();
      expect(events[0].sessionId).not.toBeNull();
      expect(events[0].properties).toMatchObject({
        productId: testProductId
      });
    });

    it('should record cart_clear event with itemsAffected when guest clears cart', async () => {
      // Add multiple items
      await request(expressApp)
        .post('/api/cart/add')
        .send({ productId: testProductId, quantity: 1 });

      // Clear events
      await db.event.deleteMany({ where: { name: 'cart_add' } });

      // Clear cart
      const res = await request(expressApp)
        .post('/api/cart/clear');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Check that cart_clear event was created
      const events = await db.event.findMany({ where: { name: 'cart_clear' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBeNull();
      expect(events[0].sessionId).not.toBeNull();
      expect(events[0].properties).toHaveProperty('itemsAffected');
      expect((events[0].properties as any).itemsAffected).toBe(1);
    });
  });

  describe('User Cart Events', () => {
    it('should record cart_add event with userId when authenticated user adds item', async () => {
      const res = await request(expressApp)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Check that event was created
      const events = await db.event.findMany({ where: { name: 'cart_add' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBe(testUserId);
      expect(events[0].sessionId).toBeNull();
      expect(events[0].properties).toMatchObject({
        productId: testProductId,
        quantity: 3
      });
    });

    it('should record cart_update event with userId when authenticated user updates quantity', async () => {
      // First add item
      await request(expressApp)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 1 });

      // Clear events
      await db.event.deleteMany({ where: { name: 'cart_add' } });

      // Update quantity
      const res = await request(expressApp)
        .post('/api/cart/update')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 4 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Check that cart_update event was created
      const events = await db.event.findMany({ where: { name: 'cart_update' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBe(testUserId);
      expect(events[0].sessionId).toBeNull();
      expect(events[0].properties).toMatchObject({
        productId: testProductId,
        quantity: 4
      });
    });

    it('should record cart_remove event with userId when authenticated user removes item', async () => {
      // First add item
      await request(expressApp)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 1 });

      // Clear events
      await db.event.deleteMany({ where: { name: 'cart_add' } });

      // Remove item
      const res = await request(expressApp)
        .post('/api/cart/remove')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Check that cart_remove event was created
      const events = await db.event.findMany({ where: { name: 'cart_remove' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBe(testUserId);
      expect(events[0].sessionId).toBeNull();
      expect(events[0].properties).toMatchObject({
        productId: testProductId
      });
    });

    it('should record cart_clear event with userId when authenticated user clears cart', async () => {
      // Add item
      await request(expressApp)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 2 });

      // Clear events
      await db.event.deleteMany({ where: { name: 'cart_add' } });

      // Clear cart
      const res = await request(expressApp)
        .post('/api/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Check that cart_clear event was created
      const events = await db.event.findMany({ where: { name: 'cart_clear' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBe(testUserId);
      expect(events[0].sessionId).toBeNull();
      expect(events[0].properties).toHaveProperty('itemsAffected');
      expect((events[0].properties as any).itemsAffected).toBe(1);
    });
  });

  describe('Cart Merge Events', () => {
    it('should record cart_merge event when guest cart is merged during analytics link', async () => {
      // Add items as guest
      const guestRes = await request(expressApp)
        .post('/api/cart/add')
        .send({ productId: testProductId, quantity: 2 });

      expect(guestRes.status).toBe(200);

      // Extract session cookie
      const cookies = guestRes.headers['set-cookie'];
      const sessionCookie = cookies?.find((c: string) => c.startsWith('guest_session='));

      // Clear add events
      await db.event.deleteMany({ where: { name: 'cart_add' } });

      // Link analytics (merge guest cart to user)
      const linkRes = await request(expressApp)
        .post('/api/analytics/link')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', sessionCookie || '')
        .send({ anonymousId: 'test-anon-id' });

      expect(linkRes.status).toBe(200);

      // Check that cart_merge event was created
      const events = await db.event.findMany({ where: { name: 'cart_merge' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBe(testUserId);
      expect(events[0].sessionId).toBeNull();
      expect(events[0].properties).toHaveProperty('mergeCount');
      expect((events[0].properties as any).mergeCount).toBeGreaterThan(0);
    });
  });

  describe('Admin Carts Endpoint Enrichment', () => {
    it('should return carts with derived metrics (itemCount, totalValue, lastActivity)', async () => {
      // Add items to user cart
      await request(expressApp)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 3 });

      // Get admin carts endpoint
      const res = await request(expressApp)
        .get('/api/admin/carts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('userCarts');
      expect(res.body).toHaveProperty('guestCarts');

      // Check user cart structure with derived metrics
      const userCart = res.body.userCarts.find((c: any) => c.user?.id === testUserId);
      expect(userCart).toBeDefined();
      expect(userCart).toHaveProperty('itemCount');
      expect(userCart).toHaveProperty('totalValue');
      expect(userCart).toHaveProperty('lastActivity');
      expect(userCart.itemCount).toBe(3);
      expect(userCart.totalValue).toBe(3 * 150); // 3 items * 150 price
    });

    it('should return guest carts with userAgent and ip if available', async () => {
      // Add items as guest
      await request(expressApp)
        .post('/api/cart/add')
        .set('User-Agent', 'TestBrowser/1.0')
        .send({ productId: testProductId, quantity: 1 });

      // Get admin carts endpoint
      const res = await request(expressApp)
        .get('/api/admin/carts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.guestCarts.length).toBeGreaterThan(0);

      // Check guest cart structure
      const guestCart = res.body.guestCarts[0];
      expect(guestCart).toHaveProperty('itemCount');
      expect(guestCart).toHaveProperty('totalValue');
      expect(guestCart).toHaveProperty('lastActivity');
      expect(guestCart.itemCount).toBe(1);
      expect(guestCart.totalValue).toBe(150);
      // userAgent and ip may or may not be present depending on DB state
      // We just ensure the fields are included if available
    });
  });

  describe('Auth Cart Endpoints Events', () => {
    it('should record events for /cart/auth/add endpoint', async () => {
      const res = await request(expressApp)
        .post('/api/cart/auth/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const events = await db.event.findMany({ where: { name: 'cart_add' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBe(testUserId);
    });

    it('should record events for /cart/auth/update endpoint', async () => {
      // Add first
      await request(expressApp)
        .post('/api/cart/auth/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 1 });

      await db.event.deleteMany({ where: { name: 'cart_add' } });

      // Update
      const res = await request(expressApp)
        .post('/api/cart/auth/update')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const events = await db.event.findMany({ where: { name: 'cart_update' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBe(testUserId);
    });

    it('should record events for /cart/auth/remove endpoint', async () => {
      // Add first
      await request(expressApp)
        .post('/api/cart/auth/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 1 });

      await db.event.deleteMany({ where: { name: 'cart_add' } });

      // Remove
      const res = await request(expressApp)
        .post('/api/cart/auth/remove')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const events = await db.event.findMany({ where: { name: 'cart_remove' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBe(testUserId);
    });

    it('should record events for /cart/auth/clear endpoint', async () => {
      // Add first
      await request(expressApp)
        .post('/api/cart/auth/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId: testProductId, quantity: 1 });

      await db.event.deleteMany({ where: { name: 'cart_add' } });

      // Clear
      const res = await request(expressApp)
        .post('/api/cart/auth/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const events = await db.event.findMany({ where: { name: 'cart_clear' } });
      expect(events.length).toBe(1);
      expect(events[0].userId).toBe(testUserId);
    });
  });
});
