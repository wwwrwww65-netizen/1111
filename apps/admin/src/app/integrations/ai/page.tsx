"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

type AiKey = { key: string; label: string; placeholder?: string };
const AI_KEYS: AiKey[] = [
  { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', placeholder: 'sk-...' },
  { key: 'DEEPSEEK_API_KEY', label: 'DeepSeek API Key' },
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key' },
  { key: 'GEMINI_API_KEY', label: 'Google Gemini API Key' },
  { key: 'CUSTOM_AI_ENDPOINT', label: 'Custom AI Endpoint', placeholder: 'https://api.example.com/v1' },
  { key: 'CUSTOM_AI_KEY', label: 'Custom AI API Key' },
  // Cursor AI specific
  { key: 'CURSOR_AI_ENDPOINT', label: 'Cursor AI Endpoint', placeholder: 'https://api.cursor.sh/v1' },
  { key: 'CURSOR_AI_API_KEY', label: 'Cursor AI API Key' },
  { key: 'CURSOR_AI_MODEL', label: 'Cursor AI Model', placeholder: 'cursor-large' },
  { key: 'CURSOR_AI_TEMPERATURE', label: 'Cursor AI Temperature', placeholder: '0.2' },
  { key: 'CURSOR_AI_MAX_TOKENS', label: 'Cursor AI Max Tokens', placeholder: '4096' },
  { key: 'DEEPSEEK_API_KEY', label: 'DeepSeek API Key' },
  { key: 'DEEPSEEK_MODEL', label: 'DeepSeek Model', placeholder: 'deepseek-chat' },
];

const PLACEMENTS = [
  { key: 'AI_ENABLE_ADMIN_ASSISTANT', label: 'مساعد داخل لوحة التحكم' },
  { key: 'AI_ENABLE_PRODUCT_GENERATOR', label: 'توليد وصف/صور المنتجات' },
  { key: 'AI_ENABLE_CATEGORY_SEO', label: 'توليد SEO للفئات' },
  { key: 'AI_ENABLE_ORDERS_INSIGHTS', label: 'تحليلات الطلبات' },
  { key: 'AI_ENABLE_MWEB_CHAT', label: 'دردشة للموقع/الموبايل' },
  // Cursor AI feature placements
  { key: 'AI_ENABLE_CURSOR_CODE_ASSIST', label: 'Cursor: مساعد برمجي (Code Assist) داخل لوحة التحكم' },
  { key: 'AI_ENABLE_CURSOR_AUTOFIX_CI', label: 'Cursor: إصلاح تلقائي للأخطاء في CI (اقتراحات فقط)' },
  { key: 'AI_ENABLE_CURSOR_DESIGN_SYNC', label: 'Cursor: مزامنة تصميم (Figma → كود) تحت الطلب' },
  { key: 'AI_ENABLE_CURSOR_DOCS_SUMMARY', label: 'Cursor: تلخيص الوثائق وسجلات الأخطاء' },
  { key: 'AI_ENABLE_DEEPSEEK_CORRECTOR', label: 'DeepSeek: مصحّح التحليل بعد القواعد' },
];

export default function AiIntegrations(): JSX.Element {
  const apiBase = resolveApiBase();
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [list, setList] = React.useState<any[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [tMsg, setTMsg] = React.useState('');
  const [tErr, setTErr] = React.useState('');
  const [tLoading, setTLoading] = React.useState(false);

  async function load(){
    const j = await (await fetch(`${apiBase}/api/admin/integrations/list`, { credentials:'include' })).json();
    setList(j.integrations||[]);
    const lastByKey = new Map<string, any>();
    for (const it of (j.integrations||[])){
      if (typeof it.config === 'object') Object.entries(it.config).forEach(([k,v])=> lastByKey.set(k, v as string));
    }
    const next: Record<string,string> = {};
    [...AI_KEYS, ...PLACEMENTS].forEach(r=> next[r.key] = String(lastByKey.get(r.key)||''));
    // Default-enable DeepSeek corrector if a key exists and not explicitly toggled
    if ((next['DEEPSEEK_API_KEY']||'').trim() && !next['AI_ENABLE_DEEPSEEK_CORRECTOR']) {
      next['AI_ENABLE_DEEPSEEK_CORRECTOR'] = 'on';
    }
    setValues(next);
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[]);

  function setVal(k:string, v:string){ setValues(s=> ({ ...s, [k]: v })); }
  function toggle(k:string){ setValues(s=> ({ ...s, [k]: s[k] ? '' : 'on' })); }

  async function save(){
    setSaving(true); setMsg('');
    try {
      const payload: Record<string,string> = {};
      [...AI_KEYS, ...PLACEMENTS].forEach(r=> payload[r.key] = values[r.key] ?? '');
      await fetch(`${apiBase}/api/admin/integrations`, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ provider:'ai', config: payload }) });
      setMsg('تم الحفظ بنجاح');
      await load();
    } finally { setSaving(false); }
  }

  async function testDeepseek(){
    setTErr(''); setTMsg(''); setTLoading(true);
    try{
      const r = await fetch(`${apiBase}/api/admin/integrations/deepseek/health`, { credentials:'include' });
      const j = await r.json().catch(()=>({}));
      if (r.ok && j?.ok){ setTMsg('DeepSeek يعمل بنجاح'); }
      else if (j?.error === 'missing_key'){ setTErr('لم يتم ضبط مفتاح DeepSeek. أدخله ثم احفظ.'); }
      else { setTErr('اختبار فشل'); }
    } catch { setTErr('اختبار فشل'); } finally { setTLoading(false); }
  }

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>تكاملات الذكاء الاصطناعي</h1>
      <p style={{ color: 'var(--sub)', marginBottom: 12 }}>أدخل مفاتيح المزودات واختر أماكن التفعيل. يمكن تعطيل أي عنصر بتركه فارغاً.</p>

      <section style={{ display:'grid', gap: 12 }}>
        {AI_KEYS.map(row => (
          <div key={row.key} style={{ display:'grid', gap:6 }}>
            <label style={{ fontWeight:700 }}>{row.label}</label>
            {row.key === 'DEEPSEEK_MODEL' ? (
              <select value={values[row.key]||''} onChange={e=> setVal(row.key, e.target.value)} style={{ height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }}>
                <option value="">اختر…</option>
                <option value="deepseek-chat">deepseek-chat</option>
                <option value="deepseek-coder">deepseek-coder</option>
                <option value="deepseek-chat-lite">deepseek-chat-lite</option>
              </select>
            ) : (
              <input value={values[row.key]||''} onChange={e=> setVal(row.key, e.target.value)} placeholder={row.placeholder||''} style={{ height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
            )}
          </div>
        ))}
      </section>

      <h2 style={{ fontWeight:800, fontSize:16, marginTop:24, marginBottom:8 }}>Cursor AI (إعدادات متقدمة)</h2>
      <div className="panel" style={{ display:'grid', gap:8 }}>
        <div style={{ display:'grid', gap:6 }}>
          <label style={{ fontWeight:700 }}>اختيار نموذج Cursor</label>
          <select value={values['CURSOR_AI_MODEL']||''} onChange={(e)=> setVal('CURSOR_AI_MODEL', e.target.value)} style={{ height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }}>
            <option value="">اختر…</option>
            <option value="cursor-large">cursor-large</option>
            <option value="cursor-code">cursor-code</option>
            <option value="cursor-chat">cursor-chat</option>
          </select>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div style={{ display:'grid', gap:6 }}>
            <label style={{ fontWeight:700 }}>Temperature</label>
            <input value={values['CURSOR_AI_TEMPERATURE']||''} onChange={(e)=> setVal('CURSOR_AI_TEMPERATURE', e.target.value)} placeholder="0.2" style={{ height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
          </div>
          <div style={{ display:'grid', gap:6 }}>
            <label style={{ fontWeight:700 }}>Max Tokens</label>
            <input value={values['CURSOR_AI_MAX_TOKENS']||''} onChange={(e)=> setVal('CURSOR_AI_MAX_TOKENS', e.target.value)} placeholder="4096" style={{ height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
          </div>
        </div>
        <div style={{ color:'var(--sub)', fontSize:12 }}>اترك القيم فارغة لتعطيل ميزات Cursor. استعمال المفاتيح في الواجهة والـ CI سيكون خاضعاً لصلاحيات RBAC.</div>
      </div>

      <h2 style={{ fontWeight:800, fontSize:16, marginTop:24, marginBottom:8 }}>أماكن التفعيل</h2>
      <div className="panel" style={{ display:'grid', gap:8 }}>
        {PLACEMENTS.map(p=> (
          <div key={p.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid var(--muted2)', borderRadius:12, padding:12 }}>
            <div style={{ fontWeight:700 }}>{p.label}</div>
            <button onClick={()=> toggle(p.key)} className="btn" style={{ background: values[p.key] ? '#16a34a' : '#374151' }}>{values[p.key] ? 'مفعّل' : 'معطّل'}</button>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:16 }}>
        <button onClick={save} disabled={saving} className="btn">{saving? 'يحفظ…' : 'حفظ'}</button>
        <button onClick={testDeepseek} disabled={tLoading} className="btn" style={{ background:'#0ea5e9' }}>{tLoading? 'يختبر…' : 'اختبار DeepSeek'}</button>
        {msg && <span style={{ color:'#22c55e' }}>{msg}</span>}
        {tMsg && <span style={{ color:'#22c55e' }}>{tMsg}</span>}
        {tErr && <span style={{ color:'#ef4444' }}>{tErr}</span>}
      </div>

      <h2 style={{ fontWeight:800, fontSize:16, marginTop:24, marginBottom:8 }}>آخر الإعدادات</h2>
      <div className="panel" style={{ display:'grid', gap:8 }}>
        {list.filter((it:any)=> it.provider==='ai').map((it:any)=> (
          <div key={it.id} style={{ border:'1px solid var(--muted2)', borderRadius:12, padding:12 }}>
            <div style={{ fontWeight:700 }}>{it.provider}</div>
            <pre style={{ margin:0, whiteSpace:'pre-wrap', color:'var(--sub)' }}>{JSON.stringify(it.config,null,2)}</pre>
          </div>
        ))}
      </div>
    </main>
  );
}

