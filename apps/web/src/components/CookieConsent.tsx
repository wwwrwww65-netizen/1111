"use client";
import React from "react";

export function CookieConsent(): JSX.Element | null {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(()=>{
    try {
      const saved = localStorage.getItem("cookie_consent_v1");
      if (!saved) setVisible(true);
    } catch {}
  },[]);
  if (!visible) return null;
  return (
    <div style={{ position:'fixed', insetInline:0, insetBlockEnd:0, zIndex:60, background:'#0f172a', color:'#e2e8f0', padding:'12px 16px', boxShadow:'0 -2px 12px rgba(0,0,0,0.25)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'space-between', flexWrap:'wrap' }}>
        <div style={{ maxWidth:680, fontSize:14, lineHeight:1.5 }}>
          نستخدم ملفات تعريف الارتباط لتحسين تجربتك وقياس الأداء. يمكنك قبول جميع الأغراض أو تخصيص الموافقة.
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-sm" onClick={()=>{
            try { localStorage.setItem('cookie_consent_v1', JSON.stringify({ necessary:true, analytics:true, marketing:true, at: Date.now() })); } catch {}
            try { (window as any).dataLayer = (window as any).dataLayer || []; (window as any).dataLayer.push({event:'cookie_consent', analytics:true, marketing:true}); } catch {}
            setVisible(false);
          }}>موافقة الكل</button>
          <button className="btn btn-sm btn-outline" onClick={()=>{
            try { localStorage.setItem('cookie_consent_v1', JSON.stringify({ necessary:true, analytics:true, marketing:false, at: Date.now() })); } catch {}
            try { (window as any).dataLayer = (window as any).dataLayer || []; (window as any).dataLayer.push({event:'cookie_consent', analytics:true, marketing:false}); } catch {}
            setVisible(false);
          }}>تحليلات فقط</button>
          <button className="btn btn-sm btn-outline" onClick={()=>{
            try { localStorage.setItem('cookie_consent_v1', JSON.stringify({ necessary:true, analytics:false, marketing:false, at: Date.now() })); } catch {}
            try { (window as any).dataLayer = (window as any).dataLayer || []; (window as any).dataLayer.push({event:'cookie_consent', analytics:false, marketing:false}); } catch {}
            setVisible(false);
          }}>رفض غير الضروري</button>
        </div>
      </div>
    </div>
  );
}

