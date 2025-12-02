"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

type Campaign = { id:string; name:string; status:string; priority:number; rewardId?:string|null };
type Reward = { id:string; name:string; type:string };

export default function PromotionsManager(): JSX.Element {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [rewards, setRewards] = React.useState<Reward[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const load = React.useCallback(async()=>{
    setLoading(true); setMsg("");
    try{
      const api = resolveApiBase();
      const [c, r] = await Promise.all([
        fetch(`${api}/api/admin/promotions/campaigns`, { credentials:'include' }).then(x=>x.json()),
        fetch(`${api}/api/admin/promotions/rewards`, { credentials:'include' }).then(x=>x.json()),
      ]);
      setCampaigns(Array.isArray(c?.campaigns)? c.campaigns : []);
      setRewards(Array.isArray(r?.rewards)? r.rewards : []);
    }catch(e:any){ setMsg(e?.message||'failed'); }
    finally{ setLoading(false); }
  },[]);
  React.useEffect(()=>{ load(); },[load]);

  async function createReward(){
    const name = prompt('اسم المكافأة')||''; if(!name.trim()) return;
    const type = prompt('النوع (COUPON|FREE_SHIPPING|POINTS|WALLET_CREDIT)','COUPON')||'COUPON';
    try{
      const api = resolveApiBase();
      await fetch(`${api}/api/admin/promotions/rewards`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ name, type, config:{} }) });
      await load();
    }catch{ alert('فشل إنشاء المكافأة'); }
  }
  async function createCampaign(){
    const name = prompt('اسم الحملة')||''; if(!name.trim()) return;
    const priority = Number(prompt('الأولوية (رقم أكبر = أولوية أعلى)','0')||'0')||0;
    const rewardId = (rewards[0]?.id)||null;
    try{
      const api = resolveApiBase();
      await fetch(`${api}/api/admin/promotions/campaigns`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ name, priority, status:'DRAFT', rewardId }) });
      await load();
    }catch{ alert('فشل إنشاء الحملة'); }
  }
  async function setStatus(id:string, status:string){
    try{ const api = resolveApiBase(); await fetch(`${api}/api/admin/promotions/campaigns/${id}`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ status }) }); await load(); }
    catch{ alert('فشل التحديث'); }
  }
  async function removeCampaign(id:string){
    const ok = confirm('حذف الحملة؟'); if(!ok) return;
    try{ const api = resolveApiBase(); await fetch(`${api}/api/admin/promotions/campaigns/${id}`, { method:'DELETE', credentials:'include' }); await load(); }
    catch{ alert('فشل الحذف'); }
  }

  return (
    <div className="container centered">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h1 className="h1">مدير العروض والنوافذ الترويجية</h1>
            <div className="muted">إدارة الحملات والمكافآت (نسخة أولية)</div>
          </div>
          <div className="actions" style={{display:'flex', gap:8}}>
            <button className="btn btn-outline" onClick={load}>تحديث</button>
            <button className="btn btn-outline" onClick={createReward}>+ مكافأة</button>
            <button className="btn" onClick={createCampaign}>+ حملة</button>
          </div>
        </div>
        {msg && (<div className={`toast ${/فشل|failed/.test(msg)? 'err':'ok'}`}>{msg}</div>)}
      </div>

      <div className="grid cols-2">
        <div className="panel">
          <div className="toolbar" style={{marginBottom:0}}><div className="muted">الحملات</div></div>
          {loading? (<div className="skeleton-table-row" />) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>الاسم</th><th>الحالة</th><th>الأولوية</th><th>المكافأة</th><th>إجراءات</th></tr></thead>
                <tbody>
                  {campaigns.map(c=> (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.status}</td>
                      <td>{c.priority}</td>
                      <td>{(rewards.find(r=> r.id===c.rewardId)?.name)||'—'}</td>
                      <td>
                        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                          <button className="btn btn-outline btn-sm" onClick={()=> setStatus(c.id, c.status==='LIVE'?'PAUSED':'LIVE')}>{c.status==='LIVE'?'إيقاف':'تشغيل'}</button>
                          <button className="btn btn-outline btn-sm" onClick={()=> removeCampaign(c.id)}>حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!campaigns.length && (<tr><td colSpan={5}><div className="muted">— لا توجد حملات</div></td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="panel">
          <div className="toolbar" style={{marginBottom:0}}><div className="muted">المكافآت</div></div>
          <div style={{display:'grid', gap:8}}>
            {rewards.map(r=> (
              <div key={r.id} className="panel" style={{ display:'flex', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontWeight:700 }}>{r.name}</div>
                  <div className="muted">{r.type}</div>
                </div>
              </div>
            ))}
            {!rewards.length && <div className="muted">— لا مكافآت</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
