import { Router, Request, Response } from 'express';
import { verifyToken, readTokenFromRequest } from '../middleware/auth';
import { db } from '@repo/db';
import { Parser as CsvParser } from 'json2csv';
import rateLimit from 'express-rate-limit';

const adminRest = Router();

const can = async (userId: string, permKey: string): Promise<boolean> => {
  const roleLinks = await db.userRoleLink.findMany({ where: { userId }, include: { role: { include: { permissions: { include: { permission: true } } } } } });
  for (const rl of roleLinks) {
    for (const rp of rl.role.permissions) {
      if (rp.permission.key === permKey) return true;
    }
  }
  return false;
};

const audit = async (req: Request, module: string, action: string, details?: any) => {
  try {
    const user = (req as any).user as { userId: string } | undefined;
    await db.auditLog.create({ data: { userId: user?.userId, module, action, details, ip: req.ip, userAgent: req.headers['user-agent'] as string | undefined } });
  } catch {}
};

adminRest.use((req: Request, res: Response, next) => {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const payload = verifyToken(token);
    if (payload.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
    (req as any).user = payload;
    next();
  } catch (e: any) {
    return res.status(401).json({ error: e.message || 'Unauthorized' });
  }
});

// Optional 2FA enforcement: if user has 2FA enabled, require X-2FA-Code header (placeholder validation)
adminRest.use(async (req: Request, res: Response, next) => {
  try {
    const user = (req as any).user as { userId: string } | undefined;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const dbUser = await db.user.findUnique({ where: { id: user.userId }, select: { twoFactorEnabled: true } });
    if (dbUser?.twoFactorEnabled) {
      const code = req.headers['x-2fa-code'];
      if (!code) return res.status(401).json({ error: '2FA code required' });
      // TODO: integrate TOTP; placeholder accepts any non-empty code
    }
    return next();
  } catch (e: any) {
    return res.status(401).json({ error: '2FA check failed' });
  }
});

// Rate limit admin REST globally
adminRest.use(rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));

// Placeholder endpoints for acceptance modules; to be filled progressively
adminRest.get('/health', (_req, res) => res.json({ ok: true }));
adminRest.get('/inventory', (_req, res) => res.json({ items: [] }));
adminRest.get('/inventory/list', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!(await can(user.userId, 'inventory.read'))) return res.status(403).json({ error: 'forbidden' });
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const search = (req.query.search as string | undefined) ?? undefined;
    const categoryId = (req.query.categoryId as string | undefined) ?? undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: { category: true, variants: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    await audit(req, 'inventory', 'list', { page, limit });
    res.json({
      items: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'inventory_list_failed' });
  }
});

adminRest.post('/inventory/adjust', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!(await can(user.userId, 'inventory.write'))) return res.status(403).json({ error: 'forbidden' });
    const { productId, delta, variantId } = req.body || {};
    if (!productId && !variantId) return res.status(400).json({ error: 'productId_or_variantId_required' });
    const changeBy = Number(delta ?? 0);
    if (!Number.isFinite(changeBy) || changeBy === 0) return res.status(400).json({ error: 'invalid_delta' });

    if (variantId) {
      const updated = await db.productVariant.update({
        where: { id: variantId },
        data: { stockQuantity: { increment: changeBy } },
      });
      return res.json({ success: true, variant: updated });
    }

    const updated = await db.product.update({
      where: { id: productId },
      data: { stockQuantity: { increment: changeBy } },
    });
    await audit(req, 'inventory', 'adjust', { productId, variantId, delta: changeBy });
    return res.json({ success: true, product: updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'inventory_adjust_failed' });
  }
});

adminRest.get('/inventory/export/csv', async (req, res) => {
  try {
    const items = await db.product.findMany({ include: { variants: true, category: true } });
    const flat = items.flatMap((p) => {
      if (!p.variants.length) {
        return [{
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          category: p.category?.name || '',
          price: p.price,
          purchasePrice: '',
          stockQuantity: p.stockQuantity,
          variant: '',
        }];
      }
      return p.variants.map((v) => ({
        id: p.id,
        name: p.name,
        sku: v.sku || p.sku || '',
        category: p.category?.name || '',
        price: v.price ?? p.price,
        purchasePrice: (v as any).purchasePrice ?? '',
        stockQuantity: v.stockQuantity,
        variant: `${v.name}:${v.value}`,
      }));
    });
    const parser = new CsvParser({ fields: ['id','name','sku','category','price','purchasePrice','stockQuantity','variant'] });
    const csv = parser.parse(flat);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory.csv"');
    res.send(csv);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'inventory_export_failed' });
  }
});
adminRest.get('/orders', (_req, res) => res.json({ orders: [] }));
adminRest.get('/orders/list', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!(await can(user.userId, 'orders.manage'))) return res.status(403).json({ error: 'forbidden' });
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const search = (req.query.search as string | undefined) ?? undefined;
    const status = (req.query.status as string | undefined) ?? undefined;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: { user: { select: { email: true } }, items: true, payment: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.order.count({ where }),
    ]);
    await audit(req, 'orders', 'list', { page, limit, status });
    res.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'orders_list_failed' });
  }
});
adminRest.post('/orders/ship', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!(await can(user.userId, 'orders.manage'))) return res.status(403).json({ error: 'forbidden' });
    const { orderId, trackingNumber } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId_required' });
    const order = await db.order.update({ where: { id: orderId }, data: { status: 'SHIPPED', trackingNumber } });
    await audit(req, 'orders', 'ship', { orderId, trackingNumber });
    res.json({ success: true, order });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'ship_failed' });
  }
});
adminRest.get('/payments', (_req, res) => res.json({ payments: [] }));
adminRest.get('/payments/list', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!(await can(user.userId, 'payments.manage'))) return res.status(403).json({ error: 'forbidden' });
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      db.payment.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit, include: { order: true } }),
      db.payment.count(),
    ]);
    await audit(req, 'payments', 'list', { page, limit });
    res.json({ payments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'payments_list_failed' });
  }
});
adminRest.post('/payments/refund', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!(await can(user.userId, 'payments.manage'))) return res.status(403).json({ error: 'forbidden' });
    const { orderId, amount } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId_required' });
    const payment = await db.payment.findUnique({ where: { orderId } });
    if (!payment) return res.status(404).json({ error: 'payment_not_found' });
    // Placeholder: process refund via provider
    await db.payment.update({ where: { orderId }, data: { status: 'REFUNDED' } });
    await audit(req, 'payments', 'refund', { orderId, amount });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'refund_failed' });
  }
});
adminRest.get('/users', (_req, res) => res.json({ users: [] }));
adminRest.get('/users/list', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!(await can(user.userId, 'users.manage'))) return res.status(403).json({ error: 'forbidden' });
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const search = (req.query.search as string | undefined) ?? undefined;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) where.OR = [{ email: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }];
    const [users, total] = await Promise.all([
      db.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, select: { id: true, email: true, name: true, role: true, createdAt: true } }),
      db.user.count({ where }),
    ]);
    await audit(req, 'users', 'list', { page, limit });
    res.json({ users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'users_list_failed' });
  }
});
adminRest.post('/users/assign-role', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!(await can(user.userId, 'users.manage'))) return res.status(403).json({ error: 'forbidden' });
    const { userId, roleName } = req.body || {};
    if (!userId || !roleName) return res.status(400).json({ error: 'userId_and_roleName_required' });
    const role = await db.role.upsert({ where: { name: roleName }, update: {}, create: { name: roleName } });
    await db.userRoleLink.upsert({ where: { userId_roleId: { userId, roleId: role.id } }, update: {}, create: { userId, roleId: role.id } });
    await audit(req, 'users', 'assign_role', { userId, roleName });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'assign_role_failed' });
  }
});
adminRest.get('/coupons', (_req, res) => res.json({ coupons: [] }));
adminRest.get('/coupons/list', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!(await can(user.userId, 'coupons.manage'))) return res.status(403).json({ error: 'forbidden' });
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      db.coupon.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      db.coupon.count(),
    ]);
    await audit(req, 'coupons', 'list', { page, limit });
    res.json({ coupons, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'coupons_list_failed' });
  }
});
adminRest.post('/coupons', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!(await can(user.userId, 'coupons.manage'))) return res.status(403).json({ error: 'forbidden' });
    const { code, discountType, discountValue, validFrom, validUntil } = req.body || {};
    const coupon = await db.coupon.create({ data: { code, discountType, discountValue, validFrom, validUntil, isActive: true } });
    await audit(req, 'coupons', 'create', { code });
    res.json({ coupon });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'coupon_create_failed' });
  }
});
adminRest.get('/analytics', (_req, res) => res.json({ kpis: {} }));
adminRest.get('/media', (_req, res) => res.json({ assets: [] }));
adminRest.get('/settings', (_req, res) => res.json({ settings: {} }));
adminRest.post('/settings', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!(await can(user.userId, 'settings.manage'))) return res.status(403).json({ error: 'forbidden' });
    const { key, value } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key_required' });
    const setting = await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    await audit(req, 'settings', 'upsert', { key });
    res.json({ setting });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'settings_failed' });
  }
});
adminRest.get('/tickets', async (_req, res) => {
  const tickets = await db.supportTicket.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ tickets });
});
adminRest.post('/tickets', async (req, res) => {
  const { subject, userId, priority } = req.body || {};
  const t = await db.supportTicket.create({ data: { subject, userId, priority } });
  res.json({ ticket: t });
});
adminRest.post('/returns', async (req, res) => {
  const { orderId, reason } = req.body || {};
  const r = await db.returnRequest.create({ data: { orderId, reason } });
  res.json({ return: r });
});
adminRest.post('/loyalty/add', async (req, res) => {
  const { userId, points, reason } = req.body || {};
  const p = await db.loyaltyPoint.create({ data: { userId, points, reason } });
  res.json({ points: p });
});
adminRest.post('/cms/pages', async (req, res) => {
  const { slug, title, content, published } = req.body || {};
  const page = await db.cMSPage.upsert({ where: { slug }, update: { title, content, published }, create: { slug, title, content, published: !!published } });
  res.json({ page });
});
adminRest.post('/vendors', async (req, res) => {
  const { name, contactEmail, phone } = req.body || {};
  const vendor = await db.vendor.upsert({ where: { name }, update: { contactEmail, phone }, create: { name, contactEmail, phone } });
  res.json({ vendor });
});
adminRest.post('/integrations', async (req, res) => {
  const { provider, config } = req.body || {};
  const integ = await db.integration.create({ data: { provider, config } });
  res.json({ integration: integ });
});
adminRest.post('/events', async (req, res) => {
  const { name, userId, properties } = req.body || {};
  const ev = await db.event.create({ data: { name, userId, properties } });
  res.json({ event: ev });
});
adminRest.post('/backups/run', async (_req, res) => {
  const b = await db.backupJob.create({ data: { status: 'PENDING' } });
  res.json({ backup: b });
});

export default adminRest;