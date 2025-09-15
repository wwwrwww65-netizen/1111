"use client";
import React from 'react';
import { resolveApiBase } from "./lib/apiBase";

export const dynamic = 'force-dynamic';

export default function AdminHome(): JSX.Element {
  const [kpis, setKpis] = React.useState<{users?:number;orders?:number;revenue?:number}>({});
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [recentTickets, setRecentTickets] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(false);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  }, []);
  React.useEffect(()=>{
    (async ()=>{
      try{ setBusy(true);
        const [ak, ao, at] = await Promise.all([
          fetch(`${apiBase}/api/admin/analytics`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' }).then(r=>r.json()).catch(()=>({kpis:{}})),
          fetch(`${apiBase}/api/admin/orders/list?page=1&limit=5`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' }).then(r=>r.json()).catch(()=>({orders:[]})),
          fetch(`${apiBase}/api/admin/tickets?page=1&limit=5`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' }).then(r=>r.json()).catch(()=>({tickets:[]})),
        ]);
        setKpis(ak.kpis||{});
        setRecentOrders(ao.orders||[]);
        setRecentTickets(at.tickets||[]);
      } finally { setBusy(false); }
    })();
  },[apiBase]);
  return (
    <div className="grid" style={{gap:16}}>
      <div style={{
        padding:'14px 16px',
        border:'1px solid #1c2333',
        borderRadius:12,
        background:'linear-gradient(90deg,#0f1420 0%, #101939 100%)',
        color:'#e2e8f0',
        boxShadow:'0 2px 12px rgba(0,0,0,0.25)'
      }}>
        <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>مرحباً بك أيها المدير 👋</div>
        <div style={{opacity:0.85}}>نتمنى لك يوماً مليئاً بالإنجاز. يمكنك البدء من الإجراءات السريعة أو استعراض آخر الأنشطة أدناه.</div>
      </div>
      <div className="grid cols-3">
        <div className="card"><div style={{color:'var(--sub)'}}>المستخدمون</div><div style={{fontSize:28,fontWeight:800}}>{kpis.users ?? (busy?'…':'-')}</div></div>
        <div className="card"><div style={{color:'var(--sub)'}}>الطلبات</div><div style={{fontSize:28,fontWeight:800}}>{kpis.orders ?? (busy?'…':'-')}</div></div>
        <div className="card"><div style={{color:'var(--sub)'}}>الإيرادات</div><div style={{fontSize:28,fontWeight:800}}>{typeof kpis.revenue==='number'? kpis.revenue.toLocaleString() : (busy?'…':'-')}</div></div>
      </div>
      <div className="panel">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{margin:0}}>إجراءات سريعة</h3>
        </div>
        <div className="grid cols-3">
          <a href="/products/new" className="btn" style={{textAlign:'center'}}>إضافة منتج</a>
          <a href="/coupons" className="btn" style={{textAlign:'center'}}>إنشاء كوبون</a>
          <a href="/vendors" className="btn" style={{textAlign:'center'}}>إضافة مورد</a>
        </div>
      </div>
      <div className="grid cols-2">
        <div className="panel">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{margin:0}}>آخر الطلبات</h3>
            <a href="/orders" className="btn">عرض الكل</a>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
              <thead><tr>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>المعرف</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>المستخدم</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>الحالة</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>الإجمالي</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>التاريخ</th>
              </tr></thead>
              <tbody>
                {recentOrders.map((o:any, idx:number)=> (
                  <tr key={o.id} style={{background: idx%2? '#0a0e17':'transparent'}}>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{o.id}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{o.user?.email||'-'}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{o.status}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{o.total}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {!recentOrders.length && (
                  <tr><td colSpan={5} style={{padding:10,color:'var(--sub)'}}>{busy?'...':'لا توجد بيانات'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{margin:0}}>أحدث التذاكر</h3>
            <a href="/tickets" className="btn">عرض الكل</a>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
              <thead><tr>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>رقم</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>الموضوع</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>الحالة</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>الأولوية</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>المستخدم</th>
              </tr></thead>
              <tbody>
                {recentTickets.map((t:any, idx:number)=> (
                  <tr key={t.id} style={{background: idx%2? '#0a0e17':'transparent'}}>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{t.id}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{t.subject}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{t.status}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{t.priority}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{t.user?.email||'-'}</td>
                  </tr>
                ))}
                {!recentTickets.length && (
                  <tr><td colSpan={5} style={{padding:10,color:'var(--sub)'}}>{busy?'...':'لا توجد بيانات'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}