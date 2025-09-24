"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

type IdAndConfig = { id?: string; config: any };

type GoogleConfig = {
  enabled?: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
};

type FacebookConfig = {
  enabled?: boolean;
  appId?: string;
  appSecret?: string;
  redirectUri?: string;
};

type WhatsAppConfig = {
  enabled?: boolean;
  provider?: string; // meta | twilio | other
  token?: string;    // access token
  phoneId?: string;  // sender/phone id
  template?: string; // template name/id
};

type SmsConfig = {
  enabled?: boolean;
  provider?: string; // twilio | vonage | other
  accountSid?: string;
  authToken?: string;
  sender?: string;    // from number/sender id
  template?: string;
};

const providers = {
  google: 'google_oauth',
  facebook: 'facebook_oauth',
  whatsapp: 'whatsapp',
  sms: 'sms',
} as const;

export default function LoginIntegrationsPage(): JSX.Element {
  const apiBase = resolveApiBase();

  const [loading, setLoading] = React.useState<boolean>(false);
  const [message, setMessage] = React.useState<string>('');

  const [google, setGoogle] = React.useState<IdAndConfig>({ config: { enabled: false } as GoogleConfig });
  const [facebook, setFacebook] = React.useState<IdAndConfig>({ config: { enabled: false } as FacebookConfig });
  const [whatsapp, setWhatsapp] = React.useState<IdAndConfig>({ config: { enabled: false } as WhatsAppConfig });
  const [sms, setSms] = React.useState<IdAndConfig>({ config: { enabled: false } as SmsConfig });

  function setCfg<T extends object>(setter: React.Dispatch<React.SetStateAction<IdAndConfig>>, key: keyof T, value: any){
    setter((s)=> ({ ...s, config: { ...(s.config||{}), [key]: value } }));
  }

  async function load(){
    setLoading(true); setMessage('');
    try{
      const j = await (await fetch(`${apiBase}/api/admin/integrations/list`, { credentials:'include' })).json();
      const list: Array<{ id: string; provider: string; config: any }> = j.integrations || [];
      const latest = new Map<string, { id: string; config: any }>();
      for (const it of list){
        if (!latest.has(it.provider)) latest.set(it.provider, { id: it.id, config: it.config || {} });
      }
      setGoogle({ id: latest.get(providers.google)?.id, config: latest.get(providers.google)?.config || { enabled:false } });
      setFacebook({ id: latest.get(providers.facebook)?.id, config: latest.get(providers.facebook)?.config || { enabled:false } });
      setWhatsapp({ id: latest.get(providers.whatsapp)?.id, config: latest.get(providers.whatsapp)?.config || { enabled:false } });
      setSms({ id: latest.get(providers.sms)?.id, config: latest.get(providers.sms)?.config || { enabled:false } });
    } finally { setLoading(false); }
  }

  React.useEffect(()=>{ load().catch(()=>{}); },[]);

  async function upsert(provider: string, state: IdAndConfig){
    setMessage('');
    const body = JSON.stringify({ provider, config: state.config||{} });
    if (state.id){
      await fetch(`${apiBase}/api/admin/integrations/${state.id}`, { method:'PUT', headers:{ 'content-type':'application/json' }, credentials:'include', body });
    } else {
      await fetch(`${apiBase}/api/admin/integrations`, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body });
    }
    await load();
    setMessage('تم الحفظ بنجاح');
  }

  async function toggle(providerKey: string, state: IdAndConfig, enabled: boolean){
    if (!state.id){
      await upsert(providerKey, { config: { ...(state.config||{}), enabled } });
      return;
    }
    await fetch(`${apiBase}/api/admin/integrations/${state.id}/toggle`, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ enabled }) });
    await load();
    setMessage(enabled? 'تم التفعيل' : 'تم التعطيل');
  }

  async function remove(state: IdAndConfig){
    setMessage('');
    if (!state.id) return;
    await fetch(`${apiBase}/api/admin/integrations/${state.id}`, { method:'DELETE', credentials:'include' });
    await load();
    setMessage('تم الحذف');
  }

  async function test(providerKey: string, state: IdAndConfig){
    setMessage('');
    const r = await fetch(`${apiBase}/api/admin/integrations/test`, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ provider: providerKey, config: state.config||{} }) });
    const ok = r.ok;
    setMessage(ok? 'اختبار ناجح' : 'اختبار فشل');
  }

  function Section({ title, children, actions }:{ title:string; children:React.ReactNode; actions:React.ReactNode }){
    return (
      <section className="panel" style={{ display:'grid', gap:12, border:'1px solid var(--muted2)', borderRadius:12, padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontSize:16, fontWeight:800 }}>{title}</h2>
          <div style={{ display:'flex', gap:8 }}>{actions}</div>
        </div>
        <div style={{ display:'grid', gap:10 }}>{children}</div>
      </section>
    );
  }

  function Field({ label, placeholder, value, onChange, type="text" }:{ label:string; placeholder?:string; value:string; onChange:(v:string)=>void; type?:string }){
    return (
      <div style={{ display:'grid', gap:6 }}>
        <label style={{ fontWeight:700 }}>{label}</label>
        <input
          value={value||''}
          onChange={e=> onChange(e.target.value)}
          placeholder={placeholder||''}
          type={type}
          style={{ height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }}
        />
      </div>
    );
  }

  const gcfg = (google.config||{}) as GoogleConfig;
  const fcfg = (facebook.config||{}) as FacebookConfig;
  const wcfg = (whatsapp.config||{}) as WhatsAppConfig;
  const scfg = (sms.config||{}) as SmsConfig;

  return (
    <main style={{ padding:16, display:'grid', gap:16 }}>
      <h1 style={{ fontWeight:800, fontSize:20 }}>تكامل تسجيل الدخول</h1>
      <p style={{ color:'var(--sub)', marginBottom:4 }}>أدِر مفاتيح الربط لمزوّدي تسجيل الدخول والرسائل (Google/Facebook/WhatsApp/SMS).</p>

      {message && (
        <div className="panel" style={{ border:'1px solid #1f2937', borderRadius:12, padding:12, color:'#22c55e' }}>{message}</div>
      )}

      {loading && <div style={{ color:'var(--sub)' }}>جارِ التحميل…</div>}

      {!loading && (
        <div style={{ display:'grid', gap:16 }}>
          <Section
            title="Google OAuth"
            actions={
              <>
                <button onClick={()=> toggle(providers.google, google, !Boolean(gcfg.enabled))} className="btn btn-outline">{gcfg.enabled? 'تعطيل' : 'تفعيل'}</button>
                <button onClick={()=> test(providers.google, google)} className="btn">اختبار</button>
                <button onClick={()=> upsert(providers.google, google)} className="btn">حفظ</button>
                <button onClick={()=> remove(google)} className="btn btn-danger">حذف</button>
              </>
            }>
            <div style={{ display:'grid', gap:10, gridTemplateColumns:'1fr 1fr' }}>
              <Field label="Client ID" value={gcfg.clientId||''} onChange={(v)=> setCfg<GoogleConfig>(setGoogle, 'clientId', v)} placeholder="xxxxxxxx.apps.googleusercontent.com" />
              <Field label="Client Secret" value={gcfg.clientSecret||''} onChange={(v)=> setCfg<GoogleConfig>(setGoogle, 'clientSecret', v)} placeholder="••••••••" />
              <Field label="Redirect URI" value={gcfg.redirectUri||''} onChange={(v)=> setCfg<GoogleConfig>(setGoogle, 'redirectUri', v)} placeholder="https://admin.example.com/api/admin/auth/sso/callback" />
            </div>
          </Section>

          <Section
            title="Facebook OAuth"
            actions={
              <>
                <button onClick={()=> toggle(providers.facebook, facebook, !Boolean(fcfg.enabled))} className="btn btn-outline">{fcfg.enabled? 'تعطيل' : 'تفعيل'}</button>
                <button onClick={()=> test(providers.facebook, facebook)} className="btn">اختبار</button>
                <button onClick={()=> upsert(providers.facebook, facebook)} className="btn">حفظ</button>
                <button onClick={()=> remove(facebook)} className="btn btn-danger">حذف</button>
              </>
            }>
            <div style={{ display:'grid', gap:10, gridTemplateColumns:'1fr 1fr' }}>
              <Field label="App ID" value={fcfg.appId||''} onChange={(v)=> setCfg<FacebookConfig>(setFacebook, 'appId', v)} placeholder="1234567890" />
              <Field label="App Secret" value={fcfg.appSecret||''} onChange={(v)=> setCfg<FacebookConfig>(setFacebook, 'appSecret', v)} placeholder="••••••••" />
              <Field label="Redirect URI" value={fcfg.redirectUri||''} onChange={(v)=> setCfg<FacebookConfig>(setFacebook, 'redirectUri', v)} placeholder="https://admin.example.com/api/admin/auth/sso/callback" />
            </div>
          </Section>

          <Section
            title="WhatsApp (OTP/رسائل)"
            actions={
              <>
                <button onClick={()=> toggle(providers.whatsapp, whatsapp, !Boolean(wcfg.enabled))} className="btn btn-outline">{wcfg.enabled? 'تعطيل' : 'تفعيل'}</button>
                <button onClick={()=> test(providers.whatsapp, whatsapp)} className="btn">اختبار</button>
                <button onClick={()=> upsert(providers.whatsapp, whatsapp)} className="btn">حفظ</button>
                <button onClick={()=> remove(whatsapp)} className="btn btn-danger">حذف</button>
              </>
            }>
            <div style={{ display:'grid', gap:10, gridTemplateColumns:'1fr 1fr' }}>
              <Field label="Provider" value={wcfg.provider||''} onChange={(v)=> setCfg<WhatsAppConfig>(setWhatsapp, 'provider', v)} placeholder="meta | twilio | other" />
              <Field label="Access Token" value={wcfg.token||''} onChange={(v)=> setCfg<WhatsAppConfig>(setWhatsapp, 'token', v)} placeholder="EAAG..." />
              <Field label="Phone/Sender ID" value={wcfg.phoneId||''} onChange={(v)=> setCfg<WhatsAppConfig>(setWhatsapp, 'phoneId', v)} placeholder="1234567890" />
              <Field label="Template" value={wcfg.template||''} onChange={(v)=> setCfg<WhatsAppConfig>(setWhatsapp, 'template', v)} placeholder="otp_template" />
            </div>
          </Section>

          <Section
            title="SMS (OTP/رسائل)"
            actions={
              <>
                <button onClick={()=> toggle(providers.sms, sms, !Boolean(scfg.enabled))} className="btn btn-outline">{scfg.enabled? 'تعطيل' : 'تفعيل'}</button>
                <button onClick={()=> test(providers.sms, sms)} className="btn">اختبار</button>
                <button onClick={()=> upsert(providers.sms, sms)} className="btn">حفظ</button>
                <button onClick={()=> remove(sms)} className="btn btn-danger">حذف</button>
              </>
            }>
            <div style={{ display:'grid', gap:10, gridTemplateColumns:'1fr 1fr' }}>
              <Field label="Provider" value={scfg.provider||''} onChange={(v)=> setCfg<SmsConfig>(setSms, 'provider', v)} placeholder="twilio | vonage | other" />
              <Field label="Account SID / Key" value={scfg.accountSid||''} onChange={(v)=> setCfg<SmsConfig>(setSms, 'accountSid', v)} placeholder="ACxxxxxxxxxxxxxxxx" />
              <Field label="Auth Token / Secret" value={scfg.authToken||''} onChange={(v)=> setCfg<SmsConfig>(setSms, 'authToken', v)} placeholder="••••••••" />
              <Field label="Sender (From)" value={scfg.sender||''} onChange={(v)=> setCfg<SmsConfig>(setSms, 'sender', v)} placeholder="+15551234567 | SENDERID" />
              <Field label="Template" value={scfg.template||''} onChange={(v)=> setCfg<SmsConfig>(setSms, 'template', v)} placeholder="otp_template" />
            </div>
          </Section>
        </div>
      )}
    </main>
  );
}

