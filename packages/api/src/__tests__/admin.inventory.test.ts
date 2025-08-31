import request from 'supertest';
import { expressApp } from '../index';

describe('Admin Inventory REST', () => {
  it('should reject without token', async () => {
    const res = await request(expressApp).get('/api/admin/inventory/list');
    expect(res.status).toBe(401);
  });
});

