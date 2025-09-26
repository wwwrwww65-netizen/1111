import request from 'supertest'
import { expressApp } from '../index'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests'
const token = jwt.sign({ userId: 'admin-e2e', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET)

describe('Shipping Zones & Rates CRUD', () => {
  it('zone create -> list -> rate create -> delete', async () => {
    const agent = request(expressApp)
    const zc = await agent.post('/api/admin/shipping/zones').set('Authorization', `Bearer ${token}`).send({ name:'Z-Test', countryCodes:['SA'], isActive:true })
    expect(zc.status).toBeLessThan(500)
    const zoneId = zc.body?.zone?.id
    expect(zoneId).toBeTruthy()

    const zl = await agent.get('/api/admin/shipping/zones').set('Authorization', `Bearer ${token}`)
    expect(zl.status).toBe(200)

    const rc = await agent.post('/api/admin/shipping/rates').set('Authorization', `Bearer ${token}`).send({ zoneId, baseFee: 10, perKgFee: 2, etaMinHours: 24, etaMaxHours: 72, isActive:true })
    expect(rc.status).toBe(200)
    let rateId = rc.body?.rate?.id as string | undefined
    if (!rateId) {
      const rl = await agent.get(`/api/admin/shipping/rates`).set('Authorization', `Bearer ${token}`)
      expect(rl.status).toBeLessThan(500)
      rateId = rl.body?.rates?.find?.((r:any)=> r.zoneId===zoneId)?.id || rl.body?.rates?.[0]?.id
    }
    expect(rateId).toBeTruthy()

    const rd = await agent.delete(`/api/admin/shipping/rates/${rateId}`).set('Authorization', `Bearer ${token}`)
    expect(rd.status).toBe(200)
    const zd = await agent.delete(`/api/admin/shipping/zones/${zoneId}`).set('Authorization', `Bearer ${token}`)
    expect(zd.status).toBe(200)
  })
})

