"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function WhatsAppSendPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [phone, setPhone] = React.useState('967777310606');
  const [template, setTemplate] = React.useState('otp_login_code');
  const [lang, setLang] = React.useState('ar');
  const [buttonSubType, setButtonSubType] = React.useState('');
  const [buttonIndex, setButtonIndex] = React.useState('0');
  const [buttonParam, setButtonParam] = React.useState('');
  const [bodyParams, setBodyParams] = React.useState<string>('123456');
  const [headerType, setHeaderType] = React.useState('');
  const [headerParam, setHeaderParam] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [color, setColor] = React.useState('#22c55e');
  const [loading, setLoading] = React.useState(false);
  const [strict, setStrict] = React.useState(true);
  const [details, setDetails] = React.useState<any>(null);
  const [mid, setMid] = React.useState<string>('');

  function authHeaders(): Record<string,string> {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {} as Record<string,string>;
  }

  async function send(){
    setMsg(''); setLoading(true);
    try{
      const body = {
        phone: phone.replace(/\D/g,''),
        template,
        languageCode: lang,
        buttonSubType: buttonSubType || undefined,
        buttonIndex: Number(buttonIndex||0),
        buttonParam: buttonParam || undefined,
        headerType: headerType || undefined,
        headerParam: headerParam || undefined,
        bodyParams: (bodyParams||'').split(',').map(s=>s.trim()).filter(Boolean),
      };
      const r = await fetch(`${apiBase}/api/admin/whatsapp/send-smart`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ ...body, strict }) });
      const text = await r.text();
      let j: any = null; try { j = text ? JSON.parse(text) : null; } catch {}
      if (r.ok){
        const mid = j?.messageId || j?.id || j?.messages?.[0]?.id || '';
        setColor('#22c55e');
        setMsg(`OK ${r.status}${mid? ` | messageId=${mid}`:''}`);
        setDetails(j||text||'');
        setMid(String(mid||''));
      } else {
        const err = j?.error || text || 'error';
        setColor('#ef4444');
        setMsg(`ERR ${r.status}: ${String(err).slice(0,300)}`);
        setDetails(j||text||'');
      }
    } catch(e:any){ setColor('#ef4444'); setMsg(e.message||'network_error'); } finally { setLoading(false); }
  }

  async function checkStatus(){
    if (!mid) { setMsg('لا يوجد messageId'); return; }
    try{
      const r = await fetch(`${apiBase}/api/admin/whatsapp/status?id=${encodeURIComponent(mid)}`, { credentials:'include', headers: { ...authHeaders() } });
      const t = await r.text(); let j:any=null; try{ j = t? JSON.parse(t): null } catch{}
      if (r.ok){ setColor('#22c55e'); setMsg(`STATUS ${r.status}: ${j?.message_status||'unknown'}`); setDetails(j||t||''); }
      else { setColor('#ef4444'); setMsg(`ERR ${r.status}`); setDetails(j||t||''); }
    } catch(e:any){ setColor('#ef4444'); setMsg(e.message||'network_error'); }
  }

  async function diagnoseContact(){
    try{
      const payload = { phone: phone.replace(/\D/g,'') };
      const r = await fetch(`${apiBase}/api/admin/whatsapp/diagnose`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(payload) });
      const t = await r.text(); let j:any=null; try{ j = t? JSON.parse(t): null } catch{}
      if (r.ok){ setColor('#22c55e'); setMsg(`CONTACT OK ${r.status}`); setDetails(j||t||''); }
      else { setColor('#ef4444'); setMsg(`CONTACT ERR ${r.status}`); setDetails(j||t||''); }
    } catch(e:any){ setColor('#ef4444'); setMsg(e.message||'network_error'); }
  }

  return (
    <main style={{ padding:16, display:'grid', gap:12, maxWidth:720 }}>
      <h1 style={{ fontWeight:800, fontSize:20 }}>إرسال واتساب تجريبي</h1>
      {msg && (<div style={{ border:'1px solid #1f2937', borderRadius:12, padding:12, color: color }}>{msg}</div>)}
      {details && (
        <pre style={{ whiteSpace:'pre-wrap', fontSize:12, color:'#94a3b8', border:'1px solid #1f2937', borderRadius:12, padding:12, overflowX:'auto' }}>{JSON.stringify(details, null, 2).slice(0,2000)}</pre>
      )}
      <div style={{ display:'grid', gap:10, gridTemplateColumns:'1fr 1fr' }}>
        <div>
          <label>Phone (E.164)</label>
          <input value={phone} onChange={e=> setPhone(e.target.value)} style={{ width:'100%', height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
        </div>
        <div>
          <label>Template</label>
          <input value={template} onChange={e=> setTemplate(e.target.value)} style={{ width:'100%', height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
        </div>
        <div>
          <label>Language</label>
          <input value={lang} onChange={e=> setLang(e.target.value)} placeholder="ar_SA" style={{ width:'100%', height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
        </div>
        <div>
          <label>Body Params (comma)</label>
          <input value={bodyParams} onChange={e=> setBodyParams(e.target.value)} placeholder="123456" style={{ width:'100%', height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
        </div>
        <div>
          <label>Button Type</label>
          <input value={buttonSubType} onChange={e=> setButtonSubType(e.target.value)} placeholder="url | quick_reply | phone_number" style={{ width:'100%', height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
        </div>
        <div>
          <label>Button Index</label>
          <input value={buttonIndex} onChange={e=> setButtonIndex(e.target.value)} placeholder="0" style={{ width:'100%', height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
        </div>
        <div>
          <label>Button Param</label>
          <input value={buttonParam} onChange={e=> setButtonParam(e.target.value)} placeholder="https://m.jeeey.com/verify" style={{ width:'100%', height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
        </div>
        <div>
          <label>Header Type</label>
          <input value={headerType} onChange={e=> setHeaderType(e.target.value)} placeholder="none | text | image | video | document" style={{ width:'100%', height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
        </div>
        <div>
          <label>Strict (لا fallback لنص)</label>
          <div style={{ display:'flex', alignItems:'center', gap:8, height:44 }}>
            <input type="checkbox" checked={strict} onChange={e=> setStrict(e.target.checked)} />
            <span style={{ fontSize:12, color:'#9ca3af' }}>عند التفعيل، سيفشل الطلب إذا لم يطابق القالب تماماً</span>
          </div>
        </div>
        <div>
          <label>Header Param</label>
          <input value={headerParam} onChange={e=> setHeaderParam(e.target.value)} placeholder="Header text or media URL" style={{ width:'100%', height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
        </div>
      </div>
      <div>
        <button onClick={send} disabled={loading} className="btn">{loading? 'جارٍ الإرسال…' : 'Send'}</button>
        <button onClick={checkStatus} disabled={!mid} className="btn" style={{ marginInlineStart:8, background:'#374151' }}>Check Status</button>
        <button onClick={diagnoseContact} className="btn" style={{ marginInlineStart:8, background:'#0ea5e9' }}>Diagnose Contact</button>
      </div>
    </main>
  );
}

