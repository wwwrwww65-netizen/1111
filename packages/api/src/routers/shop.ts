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

// Public: products list (basic)
shop.get('/products', async (_req, res) => {
  try {
    const items = await db.product.findMany({
      select: { id: true, name: true, price: true, images: true },
      orderBy: { createdAt: 'desc' },
      take: 40,
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

export default shop;

