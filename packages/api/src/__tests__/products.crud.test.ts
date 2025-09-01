import request from 'supertest';
import { expressApp } from '../index';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests';
const token = jwt.sign({ userId: 'admin-e2e', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET);

describe('Products CRUD', () => {
  it('list -> create -> detail -> update -> delete', async () => {
    const { db } = require('@repo/db');
    const cat = await db.category.upsert({ where: { id: 'cat-test' }, update: {}, create: { id: 'cat-test', name: 'TestCat' } });
    const list0 = await request(expressApp).get('/api/admin/products').set('Authorization', `Bearer ${token}`);
    expect(list0.status).toBe(200);
    const created = await request(expressApp).post('/api/admin/products').set('Authorization', `Bearer ${token}`).send({ name:'P1', description:'D', price:10, images:[], categoryId:'cat-test', stockQuantity:0, isActive:true });
    expect(created.status).toBe(200);
    const id = created.body.product.id as string;
    const detail = await request(expressApp).get(`/api/admin/products/${id}`).set('Authorization', `Bearer ${token}`);
    expect(detail.status).toBe(200);
    const upd = await request(expressApp).patch(`/api/admin/products/${id}`).set('Authorization', `Bearer ${token}`).send({ price: 12 });
    expect(upd.status).toBe(200);
    const del = await request(expressApp).delete(`/api/admin/products/${id}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
  });
});

