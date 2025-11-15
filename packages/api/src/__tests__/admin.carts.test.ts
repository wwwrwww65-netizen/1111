import request from 'supertest'
import { expressApp } from '../index'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests'
const token = jwt.sign({ userId: 'admin-e2e', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET)

describe('Admin Carts API', () => {
  it('should get carts list without since parameter', async () => {
    const agent = request(expressApp)
    const res = await agent
      .get('/api/admin/carts')
      .set('Authorization', `Bearer ${token}`)
    
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('userCarts')
    expect(res.body).toHaveProperty('guestCarts')
    expect(Array.isArray(res.body.userCarts)).toBe(true)
    expect(Array.isArray(res.body.guestCarts)).toBe(true)
  })

  it('should get carts list with since parameter', async () => {
    const agent = request(expressApp)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    const res = await agent
      .get('/api/admin/carts')
      .query({ since })
      .set('Authorization', `Bearer ${token}`)
    
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('userCarts')
    expect(res.body).toHaveProperty('guestCarts')
  })

  it('should handle invalid since parameter gracefully', async () => {
    const agent = request(expressApp)
    const res = await agent
      .get('/api/admin/carts')
      .query({ since: 'invalid-date' })
      .set('Authorization', `Bearer ${token}`)
    
    // Should still return 200 with empty arrays or filtered results
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('userCarts')
    expect(res.body).toHaveProperty('guestCarts')
  })

  it('should validate notify request with missing fields', async () => {
    const agent = request(expressApp)
    
    // Missing all fields
    const res1 = await agent
      .post('/api/admin/carts/notify')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(res1.status).toBe(400)
    expect(res1.body).toHaveProperty('error')

    // Missing title
    const res2 = await agent
      .post('/api/admin/carts/notify')
      .set('Authorization', `Bearer ${token}`)
      .send({ targets: [{ userId: 'test' }], body: 'Test body' })
    expect(res2.status).toBe(400)

    // Missing body
    const res3 = await agent
      .post('/api/admin/carts/notify')
      .set('Authorization', `Bearer ${token}`)
      .send({ targets: [{ userId: 'test' }], title: 'Test title' })
    expect(res3.status).toBe(400)

    // Missing targets
    const res4 = await agent
      .post('/api/admin/carts/notify')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test title', body: 'Test body' })
    expect(res4.status).toBe(400)
  })

  it('should validate notify request with empty targets', async () => {
    const agent = request(expressApp)
    const res = await agent
      .post('/api/admin/carts/notify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targets: [],
        title: 'Test title',
        body: 'Test body'
      })
    
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('should validate notify request with invalid targets', async () => {
    const agent = request(expressApp)
    const res = await agent
      .post('/api/admin/carts/notify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targets: [{ invalid: 'field' }, { another: 'invalid' }],
        title: 'Test title',
        body: 'Test body'
      })
    
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('no_valid_targets')
  })

  it('should accept valid notify request with userId targets', async () => {
    const agent = request(expressApp)
    const res = await agent
      .post('/api/admin/carts/notify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targets: [{ userId: 'user123' }, { userId: 'user456' }],
        title: 'Test notification',
        body: 'You have items in your cart'
      })
    
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok')
    expect(res.body.ok).toBe(true)
  })

  it('should accept valid notify request with guestSessionId targets', async () => {
    const agent = request(expressApp)
    const res = await agent
      .post('/api/admin/carts/notify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targets: [
          { guestSessionId: 'guest123' },
          { guestSessionId: 'guest456' }
        ],
        title: 'Test notification',
        body: 'Complete your purchase'
      })
    
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok')
    expect(res.body.ok).toBe(true)
  })

  it('should accept mixed targets (userId and guestSessionId)', async () => {
    const agent = request(expressApp)
    const res = await agent
      .post('/api/admin/carts/notify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targets: [
          { userId: 'user123' },
          { guestSessionId: 'guest456' },
          { userId: 'user789' }
        ],
        title: 'Mixed notification',
        body: 'Cart reminder'
      })
    
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok')
    expect(res.body.ok).toBe(true)
  })

  it('should require authentication', async () => {
    const agent = request(expressApp)
    
    // Without token
    const res1 = await agent.get('/api/admin/carts')
    expect(res1.status).toBe(401)
    
    const res2 = await agent
      .post('/api/admin/carts/notify')
      .send({
        targets: [{ userId: 'test' }],
        title: 'Test',
        body: 'Test'
      })
    expect(res2.status).toBe(401)
  })
})
