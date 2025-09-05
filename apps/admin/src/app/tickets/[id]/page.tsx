"use client";
import React from "react";

export default function TicketDetailsPage({ params }: { params: { id: string } }): JSX.Element {
  const { id } = params;
  const [ticket, setTicket] = React.useState<any>(null);
  const [assignee, setAssignee] = React.useState("");
  const [comment, setComment] = React.useState("");
  const apiBase = React.useMemo(()=> (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window!=="undefined" ? window.location.origin.replace('jeeey-manger','jeeeyai') : 'http://localhost:4000'), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  },[]);
  async function load(){ const j = await (await fetch(`${apiBase}/api/admin/tickets/${id}`, { credentials:'include', headers:{ ...authHeaders() } })).json(); setTicket(j.ticket); }
  React.useEffect(()=>{ load(); },[id, apiBase]);
  async function assign(){ await fetch(`${apiBase}/api/admin/tickets/${id}/assign`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ userId: assignee }) }); setAssignee(""); await load(); }
  async function addComment(){ await fetch(`${apiBase}/api/admin/tickets/${id}/comment`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ message: comment }) }); setComment(""); await load(); }
  async function close(){ await fetch(`${apiBase}/api/admin/tickets/${id}/close`, { method:'POST', headers:{ ...authHeaders() }, credentials:'include' }); await load(); }
  if (!ticket) return <main>Loading…</main>;
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>تذكرة: {ticket.subject}</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        <div style={{ padding:12, border:'1px solid #1c2333', borderRadius:8 }}>
          <div>الحالة: {ticket.status}</div>
          <div>الأولوية: {ticket.priority}</div>
          <div>المستخدم: {ticket.user?.email||'-'}</div>
          <div>المسند إليه: {ticket.assignee?.email||'-'}</div>
          <div>الطلب: {ticket.orderId||'-'}</div>
          <button onClick={close} style={{ marginTop:12, padding:'8px 12px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>إغلاق</button>
        </div>
        <div style={{ padding:12, border:'1px solid #1c2333', borderRadius:8 }}>
          <h3 style={{ marginBottom:8 }}>إسناد</h3>
          <div style={{ display:'flex', gap:8 }}>
            <input value={assignee} onChange={(e)=>setAssignee(e.target.value)} placeholder="userId" style={{ flex:1, padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            <button onClick={assign} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>إسناد</button>
          </div>
        </div>
      </div>
      <div style={{ padding:12, border:'1px solid #1c2333', borderRadius:8, marginBottom:12 }}>
        <h3 style={{ marginBottom:8 }}>إضافة تعليق</h3>
        <div style={{ display:'flex', gap:8 }}>
          <input value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="اكتب تعليق..." style={{ flex:1, padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          <button onClick={addComment} style={{ padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>إرسال</button>
        </div>
      </div>
      <div style={{ padding:12, border:'1px solid #1c2333', borderRadius:8 }}>
        <h3 style={{ marginBottom:8 }}>المحادثة</h3>
        <ul>
          {(ticket.messages||[]).map((m: any, idx: number)=> (
            <li key={idx} style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{m.at} — {m.message}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}

