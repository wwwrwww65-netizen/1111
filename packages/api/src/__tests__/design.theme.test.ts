import request from 'supertest';
import { expressApp } from '../index';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests';
const token = jwt.sign({ userId: 'admin-e2e', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET);

describe('Design Theme CRUD & Publish', () => {
  it('save draft -> get draft -> publish -> get live config', async () => {
    const draft = { colors: { primary:'#123456', secondary:'#222222', bg:'#000000', text:'#ffffff' }, radius: { md: 8, lg: 14 } };
    const put = await request(expressApp).put('/api/admin/design/theme').set('Authorization', `Bearer ${token}`).send({ site:'web', mode:'draft', theme: draft });
    expect(put.status).toBe(200);
    const getDraft = await request(expressApp).get('/api/admin/design/theme?site=web&mode=draft').set('Authorization', `Bearer ${token}`);
    expect(getDraft.status).toBe(200);
    const pub = await request(expressApp).post('/api/admin/design/theme/publish').set('Authorization', `Bearer ${token}`).send({ site:'web' });
    expect(pub.status).toBe(200);
    const getLive = await request(expressApp).get('/api/admin/public/theme/config?site=web');
    expect(getLive.status).toBe(200);
    expect(getLive.body?.theme?.colors?.primary).toBe('#123456');
  });
});
