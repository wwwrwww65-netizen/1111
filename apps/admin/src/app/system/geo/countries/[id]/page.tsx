"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";

export default function CountryDetailPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const countryId = (params?.id as string) || "";

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [toast, setToast] = React.useState("");
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1600); };

  const [country, setCountry] = React.useState<any|null>(null);
  const [cities, setCities] = React.useState<any[]>([]);

  // Add City modal state
  const [addOpen, setAddOpen] = React.useState(false);
  const [cityName, setCityName] = React.useState("");
  const [cityRegion, setCityRegion] = React.useState("");
  const [cityActive, setCityActive] = React.useState(true);

  async function loadCountry() {
    try {
      setError("");
      const r = await fetch("/api/admin/geo/countries", { credentials: "include" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "failed");
      const c = (j.countries || []).find((x: any) => x.id === countryId) || null;
      setCountry(c);
    } catch (err: any) {
      setError(err.message || "failed");
    }
  }
  async function loadCities() {
    if (!countryId) { setCities([]); return; }
    try {
      const r = await fetch(`/api/admin/geo/cities?countryId=${encodeURIComponent(countryId)}`, { credentials: "include" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "failed");
      setCities(j.cities || []);
    } catch (err: any) {
      setError(err.message || "failed");
    }
  }

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      await loadCountry();
      await loadCities();
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId]);

  async function addCity(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try {
      if (!countryId) throw new Error("الدولة غير معروفة");
      const payload: any = { countryId, name: cityName, region: cityRegion || undefined, isActive: cityActive };
      const r = await fetch("/api/admin/geo/cities", { method: "POST", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "failed");
      setAddOpen(false); setCityName(""); setCityRegion(""); setCityActive(true);
      await loadCities(); showToast("تمت إضافة المدينة");
    } catch (err: any) { setError(err.message || "failed"); }
  }

  async function toggleCityActive(id: string, next: boolean) {
    try {
      const r = await fetch(`/api/admin/geo/cities/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ isActive: next }) });
      if (!r.ok) throw 0; await loadCities();
    } catch { showToast("فشل التحديث"); }
  }
  async function removeCity(id: string) {
    try {
      if (!confirm("حذف المدينة؟")) return;
      const r = await fetch(`/api/admin/geo/cities/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw 0; await loadCities(); showToast("تم الحذف");
    } catch { showToast("فشل الحذف"); }
  }

  return (
    <div className="container">
      <main className="panel" style={{ padding: 16 }}>
        {toast && (<div className="toast ok" style={{ marginBottom: 8 }}>{toast}</div>)}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div>
            <h1 style={{ margin: 0 }}>إدارة الدولة</h1>
            {country && (
              <div style={{ color: "#666", marginTop: 4 }}>
                <span>الدولة: {country.name} {country.code ? `(${country.code})` : ""}</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" onClick={() => router.push("/system/geo/countries")}>رجوع</button>
            <button className="btn" onClick={() => setAddOpen(true)}>إضافة مدينة</button>
          </div>
        </div>

        {loading ? (<div role="status" aria-busy="true" className="skeleton" style={{ height: 180, marginTop: 12 }} />)
          : error ? (<div className="error" aria-live="assertive">فشل: {error}</div>)
          : (
            <>
              {/* Cities as cards */}
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {cities.map((c: any) => (
                  <div key={c.id} className="panel" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>{c.region ? `الإقليم: ${c.region}` : ""}</div>
                      </div>
                      <span style={{ fontSize: 12, color: c.isActive ? "#16a34a" : "#dc2626" }}>{c.isActive ? "مفعّلة" : "معطّلة"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="btn btn-outline" onClick={() => router.push(`/system/geo/cities/${c.id}`)}>إدارة</button>
                      <button className="btn" onClick={() => toggleCityActive(c.id, !c.isActive)}>{c.isActive ? "تعطيل" : "تفعيل"}</button>
                      <button className="btn btn-danger" onClick={() => removeCity(c.id)}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>

              {addOpen && (
                <div className="panel" style={{ marginTop: 16, padding: 16 }}>
                  <h2 style={{ marginTop: 0 }}>إضافة مدينة</h2>
                  <form onSubmit={addCity} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label>الاسم<input value={cityName} onChange={(e) => setCityName(e.target.value)} required className="input" /></label>
                    <label>الإقليم/المنطقة (اختياري)<input value={cityRegion} onChange={(e) => setCityRegion(e.target.value)} className="input" placeholder="الرياض/مكة/الشرقية..." /></label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={cityActive} onChange={(e) => setCityActive(e.target.checked)} /> مفعّلة</label>
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
