import { Router, Request, Response } from 'express';
import { verifyToken, readTokenFromRequest } from '../middleware/auth';

const adminRest = Router();

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

// Placeholder endpoints for acceptance modules; to be filled progressively
adminRest.get('/health', (_req, res) => res.json({ ok: true }));
adminRest.get('/inventory', (_req, res) => res.json({ items: [] }));
adminRest.get('/orders', (_req, res) => res.json({ orders: [] }));
adminRest.get('/payments', (_req, res) => res.json({ payments: [] }));
adminRest.get('/users', (_req, res) => res.json({ users: [] }));
adminRest.get('/coupons', (_req, res) => res.json({ coupons: [] }));
adminRest.get('/analytics', (_req, res) => res.json({ kpis: {} }));
adminRest.get('/media', (_req, res) => res.json({ assets: [] }));
adminRest.get('/settings', (_req, res) => res.json({ settings: {} }));

export default adminRest;