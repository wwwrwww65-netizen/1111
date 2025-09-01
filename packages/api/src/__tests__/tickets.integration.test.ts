import request from 'supertest';
import { expressApp } from '../index';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests';
const token = jwt.sign({ userId: 'admin-e2e', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET);

describe('Tickets flow', () => {
  it('create -> assign -> comment -> close', async () => {
    // ensure assignee exists
    const { db } = require('@repo/db');
    await db.user.upsert({ where: { id: 'admin-e2e' }, update: {}, create: { id: 'admin-e2e', email: 'admin@example.com', name: 'Admin', password: '$2a$12$abcdefghijklmnopqrstuv', role: 'ADMIN', isVerified: true } });
    const created = await request(expressApp).post('/api/admin/tickets').set('Authorization', `Bearer ${token}`).send({ subject: 'Help needed', priority: 'HIGH' });
    expect(created.status).toBe(200);
    const id = created.body.ticket.id as string;
    const assign = await request(expressApp).post(`/api/admin/tickets/${id}/assign`).set('Authorization', `Bearer ${token}`).send({ userId: 'admin-e2e' });
    expect(assign.status).toBe(200);
    const comment = await request(expressApp).post(`/api/admin/tickets/${id}/comment`).set('Authorization', `Bearer ${token}`).send({ message: 'We are on it.' });
    expect(comment.status).toBe(200);
    const close = await request(expressApp).post(`/api/admin/tickets/${id}/close`).set('Authorization', `Bearer ${token}`);
    expect(close.status).toBe(200);
  });
});

