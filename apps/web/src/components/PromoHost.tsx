"use client";
import React from "react";

type CampaignItem = {
  id: string;
  name: string;
  priority: number;
  status: string;
  variantKey: "A"|"B";
  variant: any;
  rewardId?: string|null;
  schedule?: any;
  targeting?: any;
  freq?: any;
};

export function PromoHost(): JSX.Element {
  const [queue, setQueue] = React.useState<CampaignItem[]>([]);
  const [current, setCurrent] = React.useState<CampaignItem|null>(null);
  const timeouts = React.useRef<number[]>([]);

  function lcGet(key:string){ try{ return window.localStorage.getItem(key) }catch{ return null } }
  function lcSet(key:string,v:string){ try{ window.localStorage.setItem(key,v) }catch{} }
  function ssGet(key:string){ try{ return window.sessionStorage.getItem(key) }catch{ return null } }
  function ssSet(key:string,v:string){ try{ window.sessionStorage.setItem(key,v) }catch{} }

  function freqKey(c:CampaignItem){ return `promo_seen:${c.id}` }
  function markSeen(c:CampaignItem){
    const cap = (c?.freq?.cap)||'session';
    const now = Date.now();
    const days = Number(c?.freq?.days||0);
    const until = cap==='daily' ? now + 86400000 : cap==='weekly'? now + 7*86400000 : cap==='custom' ? now + Math.max(1, days)*86400000 : now + 3600000;
    const val = JSON.stringify({ until });
    if (cap==='session') ssSet(freqKey(c), val); else lcSet(freqKey(c), val);
  }
  function isCapped(c:CampaignItem){
    const cap = (c?.freq?.cap)||'session';
    const raw = cap==='session' ? ssGet(freqKey(c)) : lcGet(freqKey(c));
    if (!raw) return false;
    try{ const j = JSON.parse(raw); return (j?.until && Date.now() < Number(j.until)) }catch{ return false }
  }

  async function fetchCampaigns(){
    try{
      const params = new URLSearchParams();
      params.set("path", location.pathname + location.search);
      const lang = document.documentElement.lang || "";
      if (lang) params.set("lang", lang);
      params.set("site","web");
      try{
        const sp = new URLSearchParams(location.search);
        const previewId = sp.get("previewCampaignId")||"";
        if (previewId) params.set("previewCampaignId", previewId);
      }catch{}
      const r = await fetch(`/api/popups?${params.toString()}`, { credentials:'include', cache:'no-store' });
      const j = await r.json();
      const items: CampaignItem[] = Array.isArray(j?.items)? j.items : [];
      const isPreview = !!(typeof location!=='undefined' && location.search.includes('previewCampaignId='));
      if (isPreview){
        setQueue(items);
        if (items[0]) { setCurrent(items[0]); markSeen(items[0]); track("impression", items[0]); }
        return;
      }
      const eligible = items.filter(it=> {
        try{ if (window.localStorage.getItem(`promo_dontshow:${it.id}`)==='1') return false }catch{}
        return !isCapped(it) && it?.variant;
      });
      const ordered = eligible.sort((a,b)=> (b.priority||0) - (a.priority||0));
      setQueue(ordered);
      scheduleNext(ordered, null);
    }catch{}
  }

  function scheduleNext(list: CampaignItem[], cur: CampaignItem|null){
    if (cur) return;
    const next = list[0];
    if (!next) return;
    const tr = (next?.variant?.triggers)||{};
    if (tr.on==='time'){
      const t = window.setTimeout(()=> open(next), Math.max(0, Number(tr.delaySeconds||0))*1000);
      timeouts.current.push(t as any);
      return;
    }
    // default and first_visit/others: open immediately
    open(next);
  }

  function open(c: CampaignItem){
    setCurrent(c);
    markSeen(c);
    track("impression", c);
    // pop from queue
    setQueue(q=> q.filter(x=> x.id!==c.id));
  }

  function handleClose(reason: string){
    if (!current) return;
    track('close', current, { reason });
    setCurrent(null);
    setTimeout(()=> scheduleNext(queue, null), 0);
  }

  function dontShow(){
    try{ window.localStorage.setItem(`promo_dontshow:${current?.id}`,'1') }catch{}
    handleClose('dont_show_again');
  }

  function ctaClick(b:any){
    if (!current) return;
    track('click', current, { href:b.href, label:b.label });
    if (b.href) window.location.assign(b.href);
  }

  async function track(type:string, c:CampaignItem, meta?:any){
    try{ fetch('/api/promotions/events', { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ type, campaignId: c.id, variantKey: c.variantKey, meta: meta||{} }) }).catch(()=>{}) }catch{}
    try{ (window as any).gtag?.('event', 'promo_'+type, { campaign_id: c.id, variant: c.variantKey }) }catch{}
    try{ const fbq = (window as any).fbq; if (typeof fbq==='function') fbq('trackCustom','Promo'+type.charAt(0).toUpperCase()+type.slice(1), { campaign_id: c.id, variant: c.variantKey }) }catch{}
  }

  React.useEffect(()=>{
    fetchCampaigns();
    return ()=> { timeouts.current.forEach(t=> { try{ clearTimeout(t as any) }catch{} }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!current) return <></>;
  const v = current?.variant||{};
  const content = v?.content||{};
  const design = v?.design||{};
  const maxW = Number(design?.maxWidth||480);
  const radius = Number(design?.radius||12);
  const bg = design?.colors?.background || '#fff';
  const color = design?.colors?.text || '#111827';
  const shadow = design?.shadow||'lg';
  const primary = design?.colors?.primary || '#0B5FFF';
  const medias: string[] = Array.isArray(content?.gallery)? content.gallery : (content?.media?.src? [content.media.src] : []);
  const ctas: any[] = Array.isArray(content?.ctas)? content.ctas : [];
  const couponCode = content?.couponCode||'';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'grid', placeItems:'center', zIndex:10000 }} onClick={()=> handleClose('overlay')}>
      <div role="dialog" aria-modal="true" aria-label={current?.name||'Promo'} tabIndex={-1} onClick={(e)=> e.stopPropagation()} style={{
        width:'94vw', maxWidth: maxW, padding:16, position:'relative', background:bg, color, borderRadius: radius,
        boxShadow: shadow==='none'? 'none' : shadow==='sm'? '0 4px 10px rgba(0,0,0,.1)' : shadow==='md'? '0 8px 20px rgba(0,0,0,.15)' : '0 12px 28px rgba(0,0,0,.2)'
      }}>
        <button aria-label="إغلاق" onClick={()=> handleClose('x')} style={{ position:'absolute', top:8, left:8, border:0, background:'transparent', fontSize:22, cursor:'pointer' }}>×</button>
        {!!medias.length && (
          <div style={{ width:'100%', overflow:'hidden', borderRadius:12 }}>
            <img src={medias[0]} alt={content?.title||'promo'} style={{ width:'100%', display:'block' }} loading="lazy" />
          </div>
        )}
        {!!content?.title && (<h3 style={{ margin:'8px 0', fontWeight:800, fontSize:18, textAlign: design?.textAlign||'start' }}>{content.title}</h3>)}
        {!!content?.subtitle && (<p style={{ margin:'4px 0', color:'#4b5563', textAlign: design?.textAlign||'start' }}>{content.subtitle}</p>)}
        {!!content?.description && (<p style={{ margin:'8px 0', color:'#374151', lineHeight:1.6, textAlign: design?.textAlign||'start' }}>{content.description}</p>)}
        {!!couponCode && (
          <div style={{ display:'flex', gap:8, alignItems:'center', margin:'8px 0' }}>
            <code style={{ background:'#f3f4f6', borderRadius:8, padding:'8px 10px' }}>{couponCode}</code>
            <button className="btn" onClick={async()=>{ try{ await navigator.clipboard.writeText(String(couponCode)); track('coupon_copied', current) }catch{} }} style={{ background:'#111827', color:'#fff', border:0, borderRadius:10, padding:'10px 14px', cursor:'pointer' }}>نسخ</button>
          </div>
        )}
        {!!ctas.length && (
          <div style={{ marginTop:12 }}>
            {ctas.map((b, i)=> (
              <a key={i} href={b.href||'#'} onClick={(e)=>{ e.preventDefault(); ctaClick(b); }} style={{ display:'block', width:'100%', textAlign:'center', background:primary, color:'#fff', borderRadius:10, padding:'12px 16px', textDecoration:'none', marginTop: i===0? 0 : 8 }}>
                {b.label||'CTA'}
              </a>
            ))}
          </div>
        )}
        <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:10 }}>
          <button style={{ background:'transparent', border:0, color:'#6b7280', cursor:'pointer', textDecoration:'underline' }} onClick={()=> handleClose('not_now')}>لا الآن</button>
          <button style={{ background:'transparent', border:0, color:'#6b7280', cursor:'pointer', textDecoration:'underline' }} onClick={dontShow}>لا تظهر مرة أخرى</button>
        </div>
      </div>
    </div>
  );
}


