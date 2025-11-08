/* eslint-disable */
/* global describe, it, expect */
declare const describe: any; declare const it: any; declare const expect: any;
import fetch from 'node-fetch';

describe('Admin Analytics KPI (smoke)', () => {
  const API = process.env.API_BASE || 'http://localhost:4000';
  it('returns kpis for today', async () => {
    const today = new Date().toISOString().slice(0,10);
    const url = new URL(`${API}/api/admin/analytics`);
    url.searchParams.set('from', `${today}T00:00`);
    url.searchParams.set('to', `${today}T23:59`);
    const r = await fetch(url.toString(), { headers: { 'accept':'application/json' } });
    const j: any = await r.json();
    expect(r.ok).toBeTruthy();
    expect(typeof j.kpis).toBe('object');
  });
});


