import request from 'supertest'
import { expressApp } from '../index'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests'
const token = jwt.sign({ userId: 'admin-e2e', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET)

describe('Payment Gateways CRUD', () => {
  it('create -> list -> update -> delete', async () => {
    const agent = request(expressApp)
    const create = await agent.post('/api/admin/payments/gateways').set('Authorization', `Bearer ${token}`).send({ name: 'COD', provider: 'cod', mode: 'TEST', isActive: true })
    expect(create.status).toBeLessThan(500)
    const id = create.body?.gateway?.id
    expect(id).toBeTruthy()
    const list = await agent.get('/api/admin/payments/gateways').set('Authorization', `Bearer ${token}`)
    expect(list.status).toBe(200)
    const upd = await agent.put(`/api/admin/payments/gateways/${id}`).set('Authorization', `Bearer ${token}`).send({ sortOrder: 1 })
    expect(upd.status).toBeLessThan(500)
    const del = await agent.delete(`/api/admin/payments/gateways/${id}`).set('Authorization', `Bearer ${token}`)
    expect(del.status).toBe(200)
  })
})

