/* eslint-disable */
/* global describe, it, expect */
declare const describe: any; declare const it: any; declare const expect: any;
import fetch from 'node-fetch';

describe('Realtime sessions endpoint (smoke)', () => {
  const API = process.env.API_BASE || 'http://localhost:4000';
  it('returns sessions list', async () => {
    const url = `${API}/api/admin/analytics/realtime/sessions?windowMin=1`;
    const r = await fetch(url);
    const j: any = await r.json();
    expect(r.ok).toBeTruthy();
    expect(j.ok).toBeTruthy();
    expect(Array.isArray(j.sessions)).toBeTruthy();
  });
});


