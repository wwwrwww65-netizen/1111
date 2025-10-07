"use client";
import React from 'react';

function useApiBase(){ return React.useMemo(()=> {
  const base = typeof window!=="undefined" ? (window.location.origin.replace(/\/$/,'') || '') : '';
  return base;
}, []); }
function useAuthHeaders(){ return React.useCallback(()=>{
  if (typeof document==='undefined') return {} as Record<string,string>;
  const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
  let token = m ? m[1] : '';
  try { token = decodeURIComponent(token) } catch {}
  return token ? { Authorization: `Bearer ${token}` } : {};
},[]); }

export default function MetaIntegrationPage(): JSX.Element {
  const apiBase = useApiBase();
  const authHeaders = useAuthHeaders();
  const [site, setSite] = React.useState<'web'|'mweb'>('web');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [toast, setToast] = React.useState<{ type:'ok'|'err'; text:string }|null>(null);
  const showToast = (text:string, type:'ok'|'err'='ok')=>{ setToast({ type, text }); setTimeout(()=> setToast(null), 2400); };

  const [settings, setSettings] = React.useState<any>({
    appId: '',
    appSecret: '',
    pixelId: '',
    conversionsToken: '',
    testEventCode: '',
    catalogId: '',
    systemUserToken: '',
    advancedMatching: true,
    enableServerEvents: true,
  });

  async function load(){
    setError('');
    try{
      const r = await fetch(`${apiBase}/api/admin/integrations/meta/settings?site=${site}`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error||'load_failed');
      setSettings((prev:any)=> ({ ...prev, ...(j?.settings||{}) }));
    } catch (e:any) { setError(e?.message||'failed'); }
  }
  React.useEffect(()=>{ load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [site]);

  async function save(){
    setError(''); setBusy(true);
    try{
      const r = await fetch(`${apiBase}/api/admin/integrations/meta/settings`, {
        method:'PUT', credentials:'include', headers: { 'content-type':'application/json', ...authHeaders() },
        body: JSON.stringify({ site, settings })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error||'save_failed');
      showToast('تم الحفظ');
    } catch (e:any) { setError(e?.message||'failed'); showToast('فشل الحفظ','err'); }
    finally { setBusy(false); }
  }

  async function testPixel(){
    setBusy(true); setError('');
    try{
      const r = await fetch(`${apiBase}/api/admin/integrations/meta/test/pixel`, {
        method:'POST', credentials:'include', headers: { 'content-type':'application/json', ...authHeaders() },
        body: JSON.stringify({ site })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error||'pixel_test_failed');
      showToast(j?.simulated? 'تم اختبار الإرسال (محاكاة)' : 'تم إرسال حدث اختبار');
    }catch(e:any){ setError(e?.message||'failed'); showToast('فشل اختبار البيكسل','err'); }
    finally { setBusy(false); }
  }
  async function testCatalog(){
    setBusy(true); setError('');
    try{
      const r = await fetch(`${apiBase}/api/admin/integrations/meta/test/catalog`, {
        method:'POST', credentials:'include', headers: { 'content-content':'application/json', ...authHeaders() },
        body: JSON.stringify({ site })
      } as any);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error||'catalog_test_failed');
      showToast(j?.simulated? 'تم اختبار الكاتالوج (محاكاة)' : 'تم التحقق من بيانات الكاتالوج');
    }catch(e:any){ setError(e?.message||'failed'); showToast('فشل اختبار الكاتالوج','err'); }
    finally { setBusy(false); }
  }

  return (
    <div className="container">
      <main className="panel" style={{ padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ margin:0 }}>تكامل ميتا (Facebook)</h1>
          <div className="toolbar" style={{ gap:8 }}>
            <select value={site} onChange={(e)=> setSite(e.target.value as any)} className="select">
              <option value="web">موقع الكمبيوتر (jeeey.com)</option>
              <option value="mweb">موقع الجوال (m.jeeey.com)</option>
            </select>
            <button type="button" className="btn" onClick={save} disabled={busy}>{busy? '...' : 'حفظ'}</button>
          </div>
        </div>

        {error && <div style={{ color:'#ef4444', marginBottom:8 }}>{error}</div>}
        <section className="panel" style={{ padding:16, marginBottom:16 }}>
          <h2 style={{ marginTop:0, fontSize:16 }}>المفاتيح والبيانات</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:12 }}>
            <label style={{ gridColumn:'span 6' }}>App ID<input className="input" value={settings.appId||''} onChange={(e)=> setSettings((s:any)=> ({...s, appId: e.target.value}))} /></label>
            <label style={{ gridColumn:'span 6' }}>App Secret<input className="input" value={settings.appSecret||''} onChange={(e)=> setSettings((s:any)=> ({...s, appSecret: e.target.value}))} /></label>
            <label style={{ gridColumn:'span 6' }}>Pixel ID<input className="input" value={settings.pixelId||''} onChange={(e)=> setSettings((s:any)=> ({...s, pixelId: e.target.value}))} /></label>
            <label style={{ gridColumn:'span 6' }}>Conversions Token<input className="input" value={settings.conversionsToken||''} onChange={(e)=> setSettings((s:any)=> ({...s, conversionsToken: e.target.value}))} /></label>
            <label style={{ gridColumn:'span 6' }}>Test Event Code<input className="input" value={settings.testEventCode||''} onChange={(e)=> setSettings((s:any)=> ({...s, testEventCode: e.target.value}))} /></label>
            <label style={{ gridColumn:'span 6' }}>Catalog ID<input className="input" value={settings.catalogId||''} onChange={(e)=> setSettings((s:any)=> ({...s, catalogId: e.target.value}))} /></label>
            <label style={{ gridColumn:'span 6' }}>System User Token<input className="input" value={settings.systemUserToken||''} onChange={(e)=> setSettings((s:any)=> ({...s, systemUserToken: e.target.value}))} /></label>
            <div style={{ gridColumn:'span 6', display:'flex', gap:12, alignItems:'center' }}>
              <label style={{ display:'inline-flex', gap:8, alignItems:'center' }}><input type="checkbox" checked={!!settings.advancedMatching} onChange={(e)=> setSettings((s:any)=> ({...s, advancedMatching: e.target.checked}))} /> Advanced Matching</label>
              <label style={{ display:'inline-flex', gap:8, alignItems:'center' }}><input type="checkbox" checked={!!settings.enableServerEvents} onChange={(e)=> setSettings((s:any)=> ({...s, enableServerEvents: e.target.checked}))} /> تمكين إرسال الخادم (CAPI)</label>
            </div>
          </div>
        </section>

        <section className="panel" style={{ padding:16, marginBottom:16 }}>
          <h2 style={{ marginTop:0, fontSize:16 }}>اختبارات الاتصال</h2>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button type="button" className="btn btn-outline" onClick={testPixel} disabled={busy}>اختبار إرسال PageView (CAPI)</button>
            <button type="button" className="btn btn-outline" onClick={testCatalog} disabled={busy}>اختبار بيانات الكاتالوج</button>
          </div>
          <div style={{ color:'var(--sub)', fontSize:12, marginTop:8 }}>ملاحظة: أثناء CI/البيئات المقيدة يتم إجراء محاكاة بدل الاتصال الخارجي.</div>
        </section>

        <section className="panel" style={{ padding:16 }}>
          <h2 style={{ marginTop:0, fontSize:16 }}>إرشادات الأمن</h2>
          <ul style={{ margin:0, paddingInlineStart:18, color:'var(--sub)' }}>
            <li>لا تشارك رموز الوصول علنًا. احفظها في هذا النموذج فقط.</li>
            <li>فعّل Advanced Matching عند توافر البيانات ووافق المستخدم.</li>
            <li>استخدم Test Event Code للتحقق قبل الإنتاج.</li>
          </ul>
        </section>
        {toast && (<div className={`toast ${toast.type==='ok'?'ok':'err'}`}>{toast.text}</div>)}
      </main>
    </div>
  );
}
