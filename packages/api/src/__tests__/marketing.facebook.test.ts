import request from 'supertest';
import { expressApp } from '../index';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests';
const token = jwt.sign({ userId: 'admin-e2e', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET);

describe('Marketing Facebook', () => {
  it('save settings -> fetch analytics/recs -> fetch catalog', async () => {
    const site = 'web';
    const feedToken = 'test_token_123';
    const put = await request(expressApp).put('/api/admin/marketing/facebook/settings').set('Authorization', `Bearer ${token}`).send({ site, settings: { pixelId:'PX1', accessToken:'AT', catalogId:'CAT', feedToken, eventsEnabled:true, advancedMatching:true } });
    expect(put.status).toBe(200);

    const getS = await request(expressApp).get(`/api/admin/marketing/facebook/settings?site=${site}`).set('Authorization', `Bearer ${token}`);
    expect(getS.status).toBe(200);

    const a = await request(expressApp).get(`/api/admin/marketing/facebook/analytics?site=${site}`).set('Authorization', `Bearer ${token}`);
    expect(a.status).toBe(200);

    const r = await request(expressApp).get(`/api/admin/marketing/facebook/recommendations?site=${site}`).set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);

    const feed = await request(expressApp).get(`/api/marketing/facebook/catalog.xml?site=${site}&token=${feedToken}`);
    expect(feed.status).toBe(200);
    expect(feed.text).toContain('<rss');
    expect(feed.text).toContain('<item>');
  });
});
