import { Router } from 'express';
import { db } from '@repo/db';
import { readTokenFromRequest, verifyJwt } from '../utils/jwt';

const shop = Router();

// Helpers
function requireAuth(req: any, res: any, next: any) {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const payload = verifyJwt(token);
    (req as any).user = payload;
    return next();
  } catch (e: any) {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

// Session info (optional auth)
shop.get('/me', async (req: any, res) => {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return res.json({ user: null });
    const payload = verifyJwt(token);
    const user = await db.user.findUnique({ where: { id: payload.userId }, select: { id:true, email:true, name:true, role:true } });
    return res.json({ user });
  } catch {
    return res.json({ user: null });
  }
});

// Public: products list (basic)
shop.get('/products', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit||20)));
    const sort = String(req.query.sort||'new');
    const orderBy: any = sort === 'price_asc' ? { price: 'asc' } : sort === 'price_desc' ? { price: 'desc' } : { createdAt: 'desc' };
    const items = await db.product.findMany({
      select: { id: true, name: true, price: true, images: true },
      orderBy,
      take: limit,
    });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

// Public: product detail
shop.get('/product/:id', async (req, res) => {
  try {
    const p = await db.product.findUnique({
      where: { id: String(req.params.id) },
      include: { category: { select: { id: true, name: true } }, reviews: true },
    });
    if (!p) return res.status(404).json({ error: 'not_found' });
    res.json(p);
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Categories list
shop.get('/categories', async (_req, res) => {
  try {
    const categories = await db.category.findMany({
      select: { id: true, name: true, image: true, slug: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 100,
    });
    res.json({ categories });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Catalog by category slug or id
shop.get('/catalog/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const cat = await db.category.findFirst({ where: { OR: [{ slug }, { id: slug }] }, select: { id: true } });
    if (!cat) return res.json({ items: [] });
    const limit = Math.min(100, Math.max(1, Number(req.query.limit||24)));
    const sort = String(req.query.sort||'reco');
    const orderBy: any = sort === 'price_asc' ? { price: 'asc' } : sort === 'price_desc' ? { price: 'desc' } : { createdAt: 'desc' };
    const items = await db.product.findMany({ where: { categoryId: cat.id }, select: { id:true, name:true, price:true, images:true }, orderBy, take: limit });
    res.json({ items });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Cart endpoints (auth-required)
shop.get('/cart', requireAuth, async (req: any, res) => {
  const userId = req.user.userId;
  const cart = await db.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: { select: { id: true, name: true, price: true, images: true } } } } },
  });
  const subtotal = (cart?.items ?? []).reduce((s, it) => s + it.quantity * (it.product?.price || 0), 0);
  res.json({ cart, subtotal });
});

shop.post('/cart/add', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId required' });
    let cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) cart = await db.cart.create({ data: { userId } });
    const existing = await db.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (existing) await db.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + Number(quantity || 1) } });
    else await db.cartItem.create({ data: { cartId: cart.id, productId, quantity: Number(quantity || 1) } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/cart/update', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body || {};
    if (!productId || typeof quantity !== 'number') return res.status(400).json({ error: 'invalid' });
    const cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) return res.json({ success: true });
    const existing = await db.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (!existing) return res.json({ success: true });
    if (quantity <= 0) await db.cartItem.delete({ where: { id: existing.id } });
    else await db.cartItem.update({ where: { id: existing.id }, data: { quantity } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/cart/remove', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) return res.json({ success: true });
    const existing = await db.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (existing) await db.cartItem.delete({ where: { id: existing.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/cart/clear', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const cart = await db.cart.findUnique({ where: { userId } });
    if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Orders
shop.get('/orders/me', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const orders = await db.order.findMany({
      where: { userId },
      include: { items: { include: { product: { select: { id: true, name: true, images: true } } } }, payment: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map((o) => ({ id: o.id, status: (o.status || 'PENDING').toLowerCase(), total: Number(o.total || 0), date: o.createdAt })));
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/orders', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddressId } = req.body || {};
    const cart = await db.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart is empty' });
    const total = cart.items.reduce((s, it) => s + it.quantity * Number(it.product?.price || 0), 0);
    const order = await db.order.create({
      data: {
        userId,
        status: 'PENDING',
        total,
        shippingAddressId: shippingAddressId || null,
        items: { create: cart.items.map((ci) => ({ productId: ci.productId, quantity: ci.quantity, price: Number(ci.product?.price || 0) })) },
      },
      include: { items: true },
    });
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    res.json({ order });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Order detail
shop.get('/orders/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const id = String(req.params.id);
    const order = await db.order.findFirst({
      where: { id, userId },
      include: { items: { include: { product: { select: { id: true, name: true, images: true, price: true } } } }, payment: true, shippingAddress: true },
    });
    if (!order) return res.status(404).json({ error: 'not_found' });
    res.json(order);
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Pay order (mock finalize)
shop.post('/orders/:id/pay', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const id = String(req.params.id);
    const method = String(req.body?.method || 'CASH_ON_DELIVERY');
    const order = await db.order.findFirst({ where: { id, userId }, include: { payment: true } });
    if (!order) return res.status(404).json({ error: 'not_found' });
    // Upsert payment
    const amount = Number(order.total || 0);
    if (order.payment) {
      await db.payment.update({ where: { orderId: order.id }, data: { status: 'COMPLETED', method } as any });
    } else {
      await db.payment.create({ data: { orderId: order.id, amount, currency: 'SAR', method: method as any, status: 'COMPLETED' } as any });
    }
    await db.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Addresses (single-address per user schema)
shop.get('/addresses', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const a = await db.address.findUnique({ where: { userId } });
    res.json(a ? [a] : []);
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/addresses', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    // Map incoming fields to schema
    const { country, province, city, street, details, postalCode } = req.body || {};
    const payload = {
      country: String(country || 'SA'),
      state: String(province || ''),
      city: String(city || ''),
      postalCode: String(postalCode || ''),
      street: String(street || '') + (details ? ` - ${String(details)}` : ''),
      isDefault: true,
    };
    const exists = await db.address.findUnique({ where: { userId } });
    const addr = exists
      ? await db.address.update({ where: { userId }, data: payload })
      : await db.address.create({ data: { ...payload, userId } });
    res.json({ address: addr });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.delete('/addresses/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const exists = await db.address.findUnique({ where: { userId } });
    if (exists) await db.address.delete({ where: { userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

// Wishlist
shop.get('/wishlist', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const items = await db.wishlistItem.findMany({ where: { userId }, include: { product: { select: { id: true, name: true, price: true, images: true } } } });
    res.json(items.map(w => ({ id: w.productId, title: w.product?.name || '', price: Number(w.product?.price || 0), img: w.product?.images?.[0] })));
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

shop.post('/wishlist/toggle', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const exists = await db.wishlistItem.findUnique({ where: { userId_productId: { userId, productId } } });
    if (exists) {
      await db.wishlistItem.delete({ where: { userId_productId: { userId, productId } } });
      return res.json({ removed: true });
    } else {
      await db.wishlistItem.create({ data: { userId, productId } });
      return res.json({ added: true });
    }
  } catch {
    res.status(500).json({ error: 'failed' });
  }
});

export default shop;

