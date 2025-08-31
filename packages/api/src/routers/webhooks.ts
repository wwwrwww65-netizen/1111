import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '@repo/db';

const router = express.Router();

// Shipping webhook with simple HMAC verification
router.post('/shipping', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  try {
    const secret = process.env.SHIP_WEBHOOK_SECRET;
    if (!secret) return res.status(500).json({ error: 'shipping_secret_not_configured' });
    const sig = req.headers['x-shipping-signature'] as string | undefined;
    if (!sig) return res.status(400).json({ error: 'missing_signature' });
    const hmac = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
    if (hmac !== sig) return res.status(401).json({ error: 'invalid_signature' });

    const payload = JSON.parse(req.body.toString('utf8'));
    // Example: mark order shipped if event says so
    if (payload?.type === 'shipment.created' && payload?.data?.orderId) {
      await db.order.update({ where: { id: payload.data.orderId }, data: { status: 'SHIPPED', trackingNumber: payload.data.trackingNumber ?? null } });
    }
    return res.json({ received: true });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;

