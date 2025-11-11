/* eslint-disable */
/* global describe, it, expect */
declare const describe: any; declare const it: any; declare const expect: any;
import fetch from 'node-fetch';

describe('IA CSV exports (smoke)', () => {
  const API = process.env.API_BASE || 'http://localhost:4000';
  it('pages csv responds', async () => {
    const url = `${API}/api/admin/analytics/ia/pages?csv=1`;
    const r = await fetch(url, { headers: { 'accept':'text/csv' } });
    const t = await r.text();
    expect(r.ok).toBeTruthy();
    expect(t.startsWith('url,name,views,visitors,sessions')).toBeTruthy();
  });
});


