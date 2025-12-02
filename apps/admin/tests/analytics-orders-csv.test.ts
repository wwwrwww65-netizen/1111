/* eslint-disable */
/* global describe, it, expect */
declare const describe: any; declare const it: any; declare const expect: any;
import fetch from 'node-fetch';

describe('Orders series CSV export (smoke)', () => {
  const API = process.env.API_BASE || 'http://localhost:4000';
  it('responds 200 and text content', async () => {
    const url = `${API}/api/admin/analytics/orders-series?csv=1`;
    const r = await fetch(url);
    const t = await r.text();
    expect(r.ok).toBeTruthy();
    expect(t.startsWith('day,orders,revenue')).toBeTruthy();
  });
});


