"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function CountriesPage(): JSX.Element {
  const router = useRouter();
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 1600);
  };

  const [code, setCode] = React.useState("SA");
  const [name, setName] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/geo/countries", { credentials: "include" });
      const j = await r.json();
      if (r.ok) setRows(j.countries || []);
      else setError(j.error || "failed");
    } catch {
      setError("network");
    } finally {
      setLoading(false);
    }
  }
  React.useEffect(() => {
    load();
  }, []);

  function reset() {
    setEditing(null);
    setCode("SA");
    setName("");
    setIsActive(true);
  }
  function openCreate() {
    reset();
    setShowForm(true);
  }
  function openEdit(r: any) {
    setEditing(r);
    setCode(r.code || "");
    setName(r.name || "");
    setIsActive(Boolean(r.isActive));
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const payload: any = { code: code || undefined, name, isActive };
      let r: Response;
      if (editing)
        r = await fetch(`/api/admin/geo/countries/${editing.id}`,
          { method: "PUT", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
      else
        r = await fetch("/api/admin/geo/countries",
          { method: "POST", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "failed");
      setShowForm(false);
      reset();
      await load();
      showToast("تم الحفظ");
    } catch (err: any) {
      setError(err.message || "failed");
    }
  }
  async function remove(id: string) {
    if (!confirm("حذف الدولة؟")) return;
    const r = await fetch(`/api/admin/geo/countries/${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) await load();
  }

  return (
    <div className="container">
      <main className="panel" style={{ padding: 16 }}>
        {toast && (<div className="toast ok" style={{ marginBottom: 8 }}>{toast}</div>)}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h1 style={{ margin: 0 }}>الدول</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn danger" onClick={async () => {
              const ids = Object.keys(selected).filter(id => selected[id]); if (!ids.length) return;
              for (const id of ids) { try { await fetch(`/api/admin/geo/countries/${id}`, { method: "DELETE", credentials: "include" }); } catch { }
              }
              setSelected({}); setAllChecked(false); await load(); showToast("تم حذف المحدد");
            }}>حذف المحدد</button>
            <button onClick={openCreate} className="btn">إضافة دولة</button>
          </div>
        </div>
        {loading ? <div role="status" aria-busy="true" className="skeleton" style={{ height: 180 }} /> : error ? <div className="error" aria-live="assertive">فشل: {error}</div> : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" role="table" aria-label="قائمة الدول">
              <thead><tr><th><input type="checkbox" checked={allChecked} onChange={(e) => { const v = e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map((r: any) => [r.id, v]))); }} /></th><th>الرمز</th><th>الاسم</th><th>مفعّلة</th><th></th></tr></thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id}><td><input type="checkbox" checked={!!selected[r.id]} onChange={() => setSelected(s => ({ ...s, [r.id]: !s[r.id] }))} /></td><td>{r.code || '-'}</td><td>{r.name}</td><td>{r.isActive ? 'نعم' : 'لا'}</td><td>
                    <button aria-label={`تعديل ${r.name}`} onClick={() => router.push(`/system/geo/countries/${r.id}`)} className="btn btn-outline" style={{ marginInlineEnd: 6 }}>تعديل</button>
                    <button aria-label={`حذف ${r.name}`} onClick={() => remove(r.id)} className="btn btn-danger">حذف</button>
                  </td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="panel" style={{ marginTop: 16, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>{editing ? 'تعديل دولة' : 'إضافة دولة'}</h2>
            <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>رمز ISO (اختياري)<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="input" placeholder="SA" maxLength={3} /></label>
              <label>الاسم<input value={name} onChange={(e) => setName(e.target.value)} required className="input" /></label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> مفعّلة</label>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="submit" className="btn">حفظ</button>
                <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn btn-outline">إلغاء</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
