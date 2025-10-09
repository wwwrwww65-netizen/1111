"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";

export default function CityDetailPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const cityId = (params?.id as string) || "";

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [toast, setToast] = React.useState("");
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1600); };

  const [city, setCity] = React.useState<any|null>(null);
  const [areas, setAreas] = React.useState<any[]>([]);

  // Add Area modal state
  const [addOpen, setAddOpen] = React.useState(false);
  const [areaName, setAreaName] = React.useState("");
  const [areaActive, setAreaActive] = React.useState(true);

  async function loadCity() {
    try {
      setError("");
      const r = await fetch(`/api/admin/geo/cities`, { credentials: "include" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "failed");
      const c = (j.cities || []).find((x: any) => x.id === cityId) || null;
      setCity(c);
    } catch (err: any) {
      setError(err.message || "failed");
    }
  }
  async function loadAreas() {
    if (!cityId) { setAreas([]); return; }
    try {
      const r = await fetch(`/api/admin/geo/areas?cityId=${encodeURIComponent(cityId)}`, { credentials: "include" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "failed");
      setAreas(j.areas || []);
    } catch (err: any) {
      setError(err.message || "failed");
    }
  }

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      await loadCity();
      await loadAreas();
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  async function addArea(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try {
      if (!cityId) throw new Error("المدينة غير معروفة");
      const payload: any = { cityId, name: areaName, isActive: areaActive };
      const r = await fetch("/api/admin/geo/areas", { method: "POST", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "failed");
      setAddOpen(false); setAreaName(""); setAreaActive(true);
      await loadAreas(); showToast("تمت إضافة المنطقة");
    } catch (err: any) { setError(err.message || "failed"); }
  }

  async function toggleAreaActive(id: string, next: boolean) {
    try {
      const r = await fetch(`/api/admin/geo/areas/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ isActive: next }) });
      if (!r.ok) throw 0; await loadAreas();
    } catch { showToast("فشل التحديث"); }
  }
  async function removeArea(id: string) {
    try {
      if (!confirm("حذف المنطقة؟")) return;
      const r = await fetch(`/api/admin/geo/areas/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw 0; await loadAreas(); showToast("تم الحذف");
    } catch { showToast("فشل الحذف"); }
  }

  return (
    <div className="container">
      <main className="panel" style={{ padding: 16 }}>
        {toast && (<div className="toast ok" style={{ marginBottom: 8 }}>{toast}</div>)}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div>
            <h1 style={{ margin: 0 }}>إدارة المدينة</h1>
            {city && (
              <div style={{ color: "#666", marginTop: 4 }}>
                <span>المدينة: {city.name}</span>
                <span style={{ marginInlineStart: 8, fontSize: 12, color: '#999' }}>{city.region ? `الإقليم: ${city.region}` : ''}</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" onClick={() => router.push("/system/geo/cities")}>رجوع</button>
            <button className="btn" onClick={() => setAddOpen(true)}>إضافة منطقة</button>
          </div>
        </div>

        {loading ? (<div role="status" aria-busy="true" className="skeleton" style={{ height: 180, marginTop: 12 }} />)
          : error ? (<div className="error" aria-live="assertive">فشل: {error}</div>)
          : (
            <>
              {/* Areas as cards */}
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {areas.map((a: any) => (
                  <div key={a.id} className="panel" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.name}</div>
                      </div>
                      <span style={{ fontSize: 12, color: a.isActive ? "#16a34a" : "#dc2626" }}>{a.isActive ? "مفعّلة" : "معطّلة"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="btn" onClick={() => toggleAreaActive(a.id, !a.isActive)}>{a.isActive ? "تعطيل" : "تفعيل"}</button>
                      <button className="btn btn-danger" onClick={() => removeArea(a.id)}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>

              {addOpen && (
                <div className="panel" style={{ marginTop: 16, padding: 16 }}>
                  <h2 style={{ marginTop: 0 }}>إضافة منطقة</h2>
                  <form onSubmit={addArea} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label>الاسم<input value={areaName} onChange={(e) => setAreaName(e.target.value)} required className="input" /></label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={areaActive} onChange={(e) => setAreaActive(e.target.checked)} /> مفعّلة</label>
                    <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button type="submit" className="btn">حفظ</button>
                      <button type="button" onClick={() => setAddOpen(false)} className="btn btn-outline">إلغاء</button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
      </main>
    </div>
  );
}
