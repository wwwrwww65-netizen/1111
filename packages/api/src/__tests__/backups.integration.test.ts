import request from 'supertest';
import { expressApp } from '../index';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests';
const token = jwt.sign({ userId: 'admin-e2e', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET);

describe('Backups module', () => {
  it('run -> list -> restore flow', async () => {
    const run = await request(expressApp).post('/api/admin/backups/run').set('Authorization', `Bearer ${token}`);
    expect(run.status).toBe(200);
    const list = await request(expressApp).get('/api/admin/backups/list').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    const id = list.body.backups[0].id as string;
    const restore = await request(expressApp).post(`/api/admin/backups/${id}/restore`).set('Authorization', `Bearer ${token}`);
    expect(restore.status).toBe(200);
  });
});

