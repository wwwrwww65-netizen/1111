"use client";
import React from 'react';

export default function DriversPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [nationalId, setNationalId] = React.useState('');
  const [vehicleType, setVehicleType] = React.useState<'دراجة نارية'|'دباب نقل'|''>('');
  const [ownership, setOwnership] = React.useState<'company'|'driver'|''>('');
  const [notes, setNotes] = React.useState('');
  const apiBase = React.useMemo(()=>{
    return (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window !== 'undefined' ? (window.location.origin.replace('jeeey-manger','jeeeyai')) : 'http://localhost:4000');
  }, []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  }, []);

  async function load(){ const j = await (await fetch(`${apiBase}/api/admin/drivers`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json(); setRows(j.drivers||[]); }
  React.useEffect(()=>{ load(); },[apiBase]);

  async function add(){
    if (!name.trim()) return;
    const payload: any = { name, phone, address: address||undefined, nationalId: nationalId||undefined, vehicleType: vehicleType||undefined, ownership: ownership||undefined, notes: notes||undefined };
    await fetch(`${apiBase}/api/admin/drivers`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify(payload) });
    setName(''); setPhone(''); setAddress(''); setNationalId(''); setVehicleType(''); setOwnership(''); setNotes('');
    await load();
  }

  return (
    <main className="panel">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h1 style={{ margin:0 }}>السائقون</h1>
      </div>

      <div className="grid" style={{ gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
        <input className="input" placeholder="اسم السائق" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="input" placeholder="رقم الهاتف" value={phone} onChange={(e)=>setPhone(e.target.value)} />
        <input className="input" placeholder="عنوان السكن" value={address} onChange={(e)=>setAddress(e.target.value)} />
        <input className="input" placeholder="البطاقة الشخصية" value={nationalId} onChange={(e)=>setNationalId(e.target.value)} />
        <select className="select" value={vehicleType} onChange={(e)=> setVehicleType(e.target.value as any)}>
          <option value="">نوع المركبة</option>
          <option value="دراجة نارية">دراجة نارية</option>
          <option value="دباب نقل">دباب نقل</option>
        </select>
        <select className="select" value={ownership} onChange={(e)=> setOwnership(e.target.value as any)}>
          <option value="">ملكية المركبة</option>
          <option value="company">ملك الشركة</option>
          <option value="driver">ملك السائق</option>
        </select>
        <input className="input" placeholder="ملاحظات" value={notes} onChange={(e)=>setNotes(e.target.value)} />
        <button className="btn" onClick={add}>إضافة</button>
      </div>

      <div style={{ overflowX:'auto' }}>
        <table className="table">
          <thead><tr>
            <th>الاسم</th>
            <th>الهاتف</th>
            <th>النوع</th>
            <th>الملكية</th>
            <th>الحالة</th>
            <th>إجراءات</th>
          </tr></thead>
          <tbody>
            {rows.map((d:any)=> (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.phone||'-'}</td>
                <td>{d.vehicleType||'-'}</td>
                <td>{d.ownership==='company'?'ملك الشركة': d.ownership==='driver'?'ملك السائق':'-'}</td>
                <td><span className="badge">{d.status}</span></td>
                <td>
                  <a href={`/drivers/${d.id}`} className="btn btn-outline">عرض</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

