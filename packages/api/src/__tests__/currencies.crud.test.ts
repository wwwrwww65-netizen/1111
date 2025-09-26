import request from 'supertest'
import { expressApp } from '../index'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests'
const token = jwt.sign({ userId: 'admin-e2e', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET)

describe('Currencies CRUD', () => {
  it('should list, create, update and delete a currency', async () => {
    const agent = request(expressApp)
    // List
    const list1 = await agent.get('/api/admin/currencies').set('Authorization', `Bearer ${token}`)
    expect(list1.status).toBeLessThan(500)

    // Create SAR
    const create = await agent.post('/api/admin/currencies').set('Authorization', `Bearer ${token}`).send({
      code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', precision: 2, rateToBase: 1, isBase: true, isActive: true,
    })
    expect(create.status).toBeLessThan(500)

    const id = create.body?.currency?.id
    expect(id).toBeTruthy()

    // Update rate
    const upd = await agent.put(`/api/admin/currencies/${id}`).set('Authorization', `Bearer ${token}`).send({ rateToBase: 1 })
    expect(upd.status).toBeLessThan(500)

    // Delete
    const del = await agent.delete(`/api/admin/currencies/${id}`).set('Authorization', `Bearer ${token}`)
    expect(del.status).toBeLessThan(500)
  })
})

