import request from 'supertest'
import app from '../server'

describe('Currencies CRUD', () => {
  it('should list, create, update and delete a currency', async () => {
    const agent = request(app)
    // List
    const list1 = await agent.get('/api/admin/currencies')
    expect(list1.status).toBeLessThan(500)

    // Create SAR
    const create = await agent.post('/api/admin/currencies').send({
      code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', precision: 2, rateToBase: 1, isBase: true, isActive: true,
    })
    expect(create.status).toBeLessThan(500)

    const id = create.body?.currency?.id
    expect(id).toBeTruthy()

    // Update rate
    const upd = await agent.put(`/api/admin/currencies/${id}`).send({ rateToBase: 1 })
    expect(upd.status).toBeLessThan(500)

    // Delete
    const del = await agent.delete(`/api/admin/currencies/${id}`)
    expect(del.status).toBeLessThan(500)
  })
})

