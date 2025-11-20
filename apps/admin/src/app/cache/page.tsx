/* eslint-disable @next/next/no-img-element */
"use client";
import React from "react";

type Rule = {
  id: string;
  name: string;
  domain: "WEB" | "MWEB" | "BOTH";
  pattern: string;
  targetType: string;
  policy: string;
  ttlSeconds?: number | null;
  autoPurge: boolean;
  perEntryLimitBytes?: number | null;
  totalCapBytes?: string | number | null;
  createdBy?: string | null;
  createdAt: string;
};

type Entry = {
  key: string;
  domain: "WEB" | "MWEB" | "BOTH";
  type: string;
  sizeBytes: number;
  createdAt: string;
  expiresAt?: string | null;
  hitCount: number;
  ownerId?: string | null;
};

export default function CachePage(): JSX.Element {
  const [domainSel, setDomainSel] = React.useState<"WEB"|"MWEB"|"BOTH">("WEB");
  const [stats, setStats] = React.useState<any>(null);
  const [rules, setRules] = React.useState<Rule[]>([]);
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [entriesPage, setEntriesPage] = React.useState(1);
  const [entriesLimit, setEntriesLimit] = React.useState(25);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string>("");
  const [logs, setLogs] = React.useState<any[]>([]);
  const [settings, setSettings] = React.useState<{ staffDirectPublish:boolean; hitRateAlertPct:number; storageAlertPct:number; maxJobFailures:number }|null>(null);
  const [showEditId, setShowEditId] = React.useState<string|undefined>(undefined);
  const [editDraft, setEditDraft] = React.useState<Partial<Rule>>({});

  // Form state
  const [name, setName] = React.useState("");
  const [pattern, setPattern] = React.useState("");
  const [targetType, setTargetType] = React.useState("Page");
  const [policy, setPolicy] = React.useState("Immediate");
  const [delayHours, setDelayHours] = React.useState<number | "">("");
  const [autoPurge, setAutoPurge] = React.useState(true);
  const [perEntryMB, setPerEntryMB] = React.useState<number | "">("");
  const [totalCapGB, setTotalCapGB] = React.useState<number | "">("");

  function bytes(n: number): string {
    if (!n) return "0 B";
    const u = ["B","KB","MB","GB","TB"];
    let i = 0; let v = n;
    while (v >= 1024 && i < u.length-1) { v/=1024; i++; }
    return `${v.toFixed(1)} ${u[i]}`;
  }

  async function loadStats() {
    const res = await fetch("/api/admin/cache/stats", { credentials: "include" });
    setStats(await res.json());
  }
  async function loadRules() {
    const res = await fetch("/api/admin/cache/rules?limit=100", { credentials: "include" });
    const j = await res.json();
    setRules(j.items || []);
  }
  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/cache/settings", { credentials: "include" });
      const j = await res.json();
      setSettings(j.settings || { staffDirectPublish:false, hitRateAlertPct:50, storageAlertPct:80, maxJobFailures:5 });
    } catch { setSettings({ staffDirectPublish:false, hitRateAlertPct:50, storageAlertPct:80, maxJobFailures:5 }); }
  }
  async function loadEntries() {
    const url = new URL(window.location.origin + "/api/admin/cache/entries");
    url.searchParams.set("page", String(entriesPage));
    url.searchParams.set("limit", String(entriesLimit));
    if (domainSel) url.searchParams.set("domain", domainSel);
    const res = await fetch(url.toString(), { credentials: "include" });
    const j = await res.json();
    setEntries(j.items || []);
  }
  React.useEffect(()=>{ loadStats().catch(()=>null); loadRules().catch(()=>null); loadSettings().catch(()=>null); },[]);
  React.useEffect(()=>{ (async ()=>{ try{ const j = await (await fetch('/api/admin/audit-logs?page=1&limit=50',{credentials:'include'})).json(); setLogs((j.items||[]).filter((x:any)=> x.module==='cache')); }catch{} })(); },[]);
  React.useEffect(()=>{ loadEntries().catch(()=>null); },[domainSel, entriesPage, entriesLimit]);

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    if (!name || name.length > 100) { setErr("الاسم مطلوب وبحد أقصى 100 حرف"); setBusy(false); return; }
    if (policy === "Delay" && (!delayHours || Number(delayHours) < 1 || Number(delayHours) > 168)) {
      setErr("التأخير يجب أن يكون بين 1 و 168 ساعة"); setBusy(false); return;
    }
    const ttlSeconds = policy === "Delay" ? Number(delayHours) * 3600 : null;
    try{
      const res = await fetch("/api/admin/cache/rules", {
        method: "POST",
        headers: { "content-type":"application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          domain: domainSel,
          pattern,
          targetType,
          policy,
          ttlSeconds,
          autoPurge,
          perEntryLimitBytes: perEntryMB ? Number(perEntryMB) * 1024 * 1024 : null,
          totalCapBytes: totalCapGB ? Number(totalCapGB) * 1024 * 1024 * 1024 : null
        })
      });
      if (!res.ok) throw new Error("فشل إنشاء القاعدة");
      setName(""); setPattern(""); setPolicy("Immediate"); setDelayHours(""); setAutoPurge(true); setPerEntryMB(""); setTotalCapGB("");
      await loadRules();
    } catch (e:any) { setErr(e?.message || "خطأ غير متوقع"); }
    setBusy(false);
  }
  async function purgeRule(rule: Rule) {
    setBusy(true);
    try{
      await fetch("/api/admin/cache/purge", { method:"POST", headers:{ "content-type":"application/json" }, credentials:"include", body: JSON.stringify({ tags:[rule.pattern], domain: rule.domain }) });
      await loadEntries();
    } finally { setBusy(false); }
  }
  async function warmUrls(urls: string[], d: "WEB"|"MWEB"|"BOTH") {
    setBusy(true);
    try{
      await fetch("/api/admin/cache/warm", { method:"POST", headers:{ "content-type":"application/json" }, credentials:"include", body: JSON.stringify({ urls, domain:d }) });
      await loadEntries();
    } finally { setBusy(false); }
  }
  async function saveSettings() {
    if (!settings) return;
    setBusy(true);
    try{
      const res = await fetch("/api/admin/cache/settings", { method:"PUT", headers:{ "content-type":"application/json" }, credentials:"include", body: JSON.stringify(settings) });
      if (!res.ok) throw new Error("فشل حفظ الإعدادات");
    } catch (e:any) { setErr(e?.message || "خطأ غير متوقع"); }
    setBusy(false);
  }
  function openEdit(rule: Rule) {
    setShowEditId(rule.id);
    setEditDraft({ ...rule });
  }
  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!showEditId) return;
    const d = editDraft;
    if (d?.name && d.name.length > 100) { setErr("الاسم ≤ 100 حرف"); return; }
    if (d?.policy === 'Delay' && d?.ttlSeconds && (d.ttlSeconds < 3600 || d.ttlSeconds > 168*3600)) { setErr("التأخير يجب أن يكون بين 1 و 168 ساعة"); return; }
    setBusy(true);
    try{
      const res = await fetch(`/api/admin/cache/rules/${showEditId}`, { method:"PUT", headers:{ "content-type":"application/json" }, credentials:"include", body: JSON.stringify({
        name: d?.name, domain: d?.domain, pattern: d?.pattern, targetType: d?.targetType, policy: d?.policy, ttlSeconds: d?.ttlSeconds, autoPurge: d?.autoPurge, perEntryLimitBytes: d?.perEntryLimitBytes, totalCapBytes: d?.totalCapBytes
      })});
      if (!res.ok) throw new Error("فشل التعديل");
      await loadRules();
      setShowEditId(undefined);
    } catch (e:any) { setErr(e?.message || "تعذر تعديل القاعدة"); }
    setBusy(false);
  }

  return (
    <main className="space-y-6" style={{ direction:'rtl' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">التخزين المؤقت (Cache)</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm">النطاق:</label>
          <select className="select" value={domainSel} onChange={(e)=> setDomainSel(e.target.value as any)}>
            <option value="WEB">jeeey.com</option>
            <option value="MWEB">m.jeeey.com</option>
            <option value="BOTH">كلاهما</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-28 text-xl p-6 rounded-2xl shadow bg-white/5 border border-white/10 flex flex-col justify-center">
          <div className="text-sm opacity-80 mb-1">إجمالي حجم الكاش</div>
          <div className="font-bold">
            {stats ? (domainSel === 'MWEB' ? bytes(stats?.mweb?.totalBytes||0) : bytes(stats?.web?.totalBytes||0)) : '...'}
          </div>
        </div>
        <div className="h-28 text-xl p-6 rounded-2xl shadow bg-white/5 border border-white/10 flex flex-col justify-center">
          <div className="text-sm opacity-80 mb-1">نسبة hit-rate</div>
          <div className="font-bold">
            {stats ? (domainSel === 'MWEB' ? (stats?.mweb?.hitRate||0) : (stats?.web?.hitRate||0)) + '%' : '...'}
          </div>
          {settings && stats && (
            <div className="text-xs mt-1">
              {((domainSel==='MWEB'? (stats?.mweb?.hitRate||0) : (stats?.web?.hitRate||0)) < settings.hitRateAlertPct) && <span className="text-yellow-400">تنبيه: نسبة hit-rate أقل من الحد</span>}
            </div>
          )}
        </div>
        <div className="h-28 text-xl p-6 rounded-2xl shadow bg-white/5 border border-white/10 flex flex-col justify-center">
          <div className="text-sm opacity-80 mb-1">متوسط زمن الاستجابة</div>
          <div className="font-bold">—</div>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-2xl border border-white/10 p-4">
        <h2 className="text-lg mb-3">إعدادات السياسات والتنبيهات</h2>
        {settings && (
          <div className="grid md:grid-cols-4 gap-4 items-end">
            <label className="flex items-center gap-2 md:col-span-1">
              <input type="checkbox" className="checkbox" checked={settings.staffDirectPublish} onChange={(e)=> setSettings({ ...(settings||{}), staffDirectPublish: e.target.checked })} />
              <span className="text-sm">السماح للموظفين بالنشر المباشر</span>
            </label>
            <div className="grid gap-1">
              <label className="text-sm">حد تنبيه hit-rate (%)</label>
              <input className="input" type="number" min={0} max={100} value={settings.hitRateAlertPct} onChange={(e)=> setSettings({ ...(settings||{}), hitRateAlertPct: Math.max(0, Math.min(100, Number(e.target.value)||0)) })} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">حد تنبيه التخزين (%)</label>
              <input className="input" type="number" min={0} max={100} value={settings.storageAlertPct} onChange={(e)=> setSettings({ ...(settings||{}), storageAlertPct: Math.max(0, Math.min(100, Number(e.target.value)||0)) })} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">حد فشل الوظائف</label>
              <input className="input" type="number" min={0} value={settings.maxJobFailures} onChange={(e)=> setSettings({ ...(settings||{}), maxJobFailures: Math.max(0, Number(e.target.value)||0) })} />
            </div>
            <div className="md:col-span-4 flex gap-3">
              <button className="btn" onClick={saveSettings} disabled={busy}>حفظ الإعدادات</button>
              <button className="btn btn-outline" onClick={()=> window.open(`/api/admin/cache/entries.csv?domain=${domainSel}`,'_blank')}>تصدير CSV</button>
            </div>
          </div>
        )}
      </div>

      {/* Split: Rules table (65%) + Create form (35%) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="text-lg mb-3">قواعد الكاش</h2>
          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="h-14 bg-white/5">
                  <th className="text-right px-3 w-[8%]">النطاق</th>
                  <th className="text-right px-3 w-[30%]">التسمية/المفتاح</th>
                  <th className="text-right px-3 w-[15%]">السياسة</th>
                  <th className="text-right px-3 w-[10%]">التأخير/TTL</th>
                  <th className="text-right px-3 w-[10%]">أنشأها</th>
                  <th className="text-right px-3 w-[10%]">الحالة</th>
                  <th className="text-right px-3 w-[17%]">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r)=> (
                  <tr key={r.id} className="h-14 border-t border-white/10">
                    <td className="px-3 align-middle">{r.domain==='MWEB'?'m.jeeey.com':(r.domain==='WEB'?'jeeey.com':'كلاهما')}</td>
                    <td className="px-3 align-middle"><div className="font-semibold">{r.name}</div><div className="opacity-70">{r.pattern}</div></td>
                    <td className="px-3 align-middle">{r.policy}</td>
                    <td className="px-3 align-middle">{r.ttlSeconds? `${Math.round((r.ttlSeconds||0)/3600)}h` : '—'}</td>
                    <td className="px-3 align-middle">{r.createdBy || '—'}</td>
                    <td className="px-3 align-middle">{r.autoPurge? 'مفعل' : 'معطل'}</td>
                    <td className="px-3 align-middle">
                      <div className="flex gap-2">
                        <button className="btn btn-sm" onClick={()=> purgeRule(r)}>Purge</button>
                        <button className="btn btn-sm btn-outline" onClick={()=> warmUrls([r.pattern], r.domain)}>Warm</button>
                        <button className="btn btn-sm btn-outline" onClick={()=> openEdit(r)}>تعديل</button>
                        {/* Placeholder actions */}
                      </div>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center opacity-70">لا توجد قواعد حتى الآن</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="md:col-span-1">
          <h2 className="text-lg mb-3">إنشاء قاعدة جديدة</h2>
          <form onSubmit={createRule} className="space-y-3">
            {err && <div className="text-red-400 text-sm">{err}</div>}
            <div className="grid gap-1">
              <label className="text-sm">النطاق</label>
              <select className="select" value={domainSel} onChange={(e)=> setDomainSel(e.target.value as any)}>
                <option value="WEB">jeeey.com</option>
                <option value="MWEB">m.jeeey.com</option>
                <option value="BOTH">كلاهما</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm">الاسم</label>
              <input className="input" value={name} onChange={(e)=> setName(e.target.value)} placeholder="≤ 100 حرف" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">الوسم/النمط (Tag/Pattern)</label>
              <input className="input" value={pattern} onChange={(e)=> setPattern(e.target.value)} placeholder="product-*, /category/*, regex:..." />
            </div>
            <div className="grid gap-1">
              <label className="text-sm">نوع الاستهداف</label>
              <select className="select" value={targetType} onChange={(e)=> setTargetType(e.target.value)}>
                <option>Page</option>
                <option>Tab</option>
                <option>Category</option>
                <option>Banner</option>
                <option>All</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm">السياسة</label>
              <select className="select" value={policy} onChange={(e)=> setPolicy(e.target.value)}>
                <option value="Immediate">ظهور فوري + Purge ثم Warm</option>
                <option value="Wait">انتظار تنفيذ Purge ثم العرض</option>
                <option value="Delay">تأخير زمني</option>
                <option value="Pending">قيد المراجعة</option>
              </select>
            </div>
            {policy === "Delay" && (
              <div className="grid gap-1">
                <label className="text-sm">ساعات التأخير</label>
                <input className="input" type="number" min={1} max={168} value={delayHours as any} onChange={(e)=> setDelayHours(e.target.value===''? '': Number(e.target.value))} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input id="autoPurge" type="checkbox" className="checkbox" checked={autoPurge} onChange={(e)=> setAutoPurge(e.target.checked)} />
              <label htmlFor="autoPurge" className="text-sm">تنظيف تلقائي (Auto-purge)</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">حد العنصر (MB)</label>
                <input className="input" type="number" min={1} value={perEntryMB as any} onChange={(e)=> setPerEntryMB(e.target.value===''? '': Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm">إجمالي السعة (GB)</label>
                <input className="input" type="number" min={1} value={totalCapGB as any} onChange={(e)=> setTotalCapGB(e.target.value===''? '': Number(e.target.value))} />
              </div>
            </div>
            <button className="btn w-full h-10" disabled={busy}>{busy ? '...':'إنشاء'}</button>
          </form>
        </div>
      </div>

      {/* Entries table */}
      <div>
        <h2 className="text-lg mb-3">محتويات الكاش</h2>
        <div className="flex items-center gap-3 mb-3">
          <label className="text-sm">عرض</label>
          <select className="select" value={entriesLimit} onChange={(e)=> setEntriesLimit(Number(e.target.value))}>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="h-12 bg-white/5">
                <th className="text-right px-3">cache_key</th>
                <th className="text-right px-3">domain</th>
                <th className="text-right px-3">type</th>
                <th className="text-right px-3">size</th>
                <th className="text-right px-3">created_at</th>
                <th className="text-right px-3">expires_at</th>
                <th className="text-right px-3">hit_count</th>
                <th className="text-right px-3">owner</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e)=> (
                <tr key={e.key} className="h-12 border-t border-white/10">
                  <td className="px-3">{e.key}</td>
                  <td className="px-3">{e.domain}</td>
                  <td className="px-3">{e.type}</td>
                  <td className="px-3">{bytes(e.sizeBytes)}</td>
                  <td className="px-3">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="px-3">{e.expiresAt? new Date(e.expiresAt).toLocaleString() : '—'}</td>
                  <td className="px-3">{e.hitCount}</td>
                  <td className="px-3">{e.ownerId || '—'}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center opacity-70">لا توجد عناصر في الكاش</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-3 mt-3">
          <button className="btn btn-sm btn-outline" onClick={()=> setEntriesPage(Math.max(1, entriesPage-1))}>السابق</button>
          <div className="text-sm">صفحة {entriesPage}</div>
          <button className="btn btn-sm btn-outline" onClick={()=> setEntriesPage(entriesPage+1)}>التالي</button>
        </div>
      </div>

      {/* Logs */}
      <div>
        <h2 className="text-lg mb-3">السجلات (Logs)</h2>
        <div className="overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="h-12 bg-white/5">
                <th className="text-right px-3">الوحدة</th>
                <th className="text-right px-3">الإجراء</th>
                <th className="text-right px-3">التفاصيل</th>
                <th className="text-right px-3">الوقت</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l)=> (
                <tr key={l.id} className="h-12 border-t border-white/10">
                  <td className="px-3">{l.module}</td>
                  <td className="px-3">{l.action}</td>
                  <td className="px-3"><code className="text-xs">{JSON.stringify(l.details)}</code></td>
                  <td className="px-3">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-8 text-center opacity-70">لا توجد سجلات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0f172a] rounded-2xl p-6 w-[680px] max-w-[96vw] border border-white/10">
            <h3 className="text-lg mb-3">تعديل القاعدة</h3>
            {err && <div className="text-red-400 text-sm mb-2">{err}</div>}
            <form onSubmit={submitEdit} className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="text-sm">الاسم</label>
                <input className="input" value={editDraft.name||''} onChange={(e)=> setEditDraft(s=>({ ...s, name: e.target.value }))} />
              </div>
              <div className="col-span-1">
                <label className="text-sm">النطاق</label>
                <select className="select" value={editDraft.domain||'WEB'} onChange={(e)=> setEditDraft(s=>({ ...s, domain: e.target.value as any }))}>
                  <option value="WEB">jeeey.com</option>
                  <option value="MWEB">m.jeeey.com</option>
                  <option value="BOTH">كلاهما</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm">الوسم/النمط</label>
                <input className="input" value={editDraft.pattern||''} onChange={(e)=> setEditDraft(s=>({ ...s, pattern: e.target.value }))} />
              </div>
              <div className="col-span-1">
                <label className="text-sm">نوع الاستهداف</label>
                <select className="select" value={editDraft.targetType||'Page'} onChange={(e)=> setEditDraft(s=>({ ...s, targetType: e.target.value }))}>
                  <option>Page</option>
                  <option>Tab</option>
                  <option>Category</option>
                  <option>Banner</option>
                  <option>All</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-sm">السياسة</label>
                <select className="select" value={editDraft.policy||'Immediate'} onChange={(e)=> setEditDraft(s=>({ ...s, policy: e.target.value }))}>
                  <option value="Immediate">ظهور فوري</option>
                  <option value="Wait">انتظار التطهير</option>
                  <option value="Delay">تأخير</option>
                  <option value="Pending">قيد المراجعة</option>
                </select>
              </div>
              {editDraft.policy === 'Delay' && (
                <div className="col-span-2">
                  <label className="text-sm">ساعات التأخير</label>
                  <input className="input" type="number" min={1} max={168}
                    value={editDraft.ttlSeconds ? Math.round((editDraft.ttlSeconds||0)/3600) : '' as any}
                    onChange={(e)=> {
                      const v = e.target.value===''? undefined : Number(e.target.value)*3600;
                      setEditDraft(s=>({ ...s, ttlSeconds: v as any }));
                    }} />
                </div>
              )}
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" className="checkbox" checked={!!editDraft.autoPurge} onChange={(e)=> setEditDraft(s=>({ ...s, autoPurge: e.target.checked }))} />
                <span className="text-sm">تنظيف تلقائي</span>
              </div>
              <div className="col-span-1">
                <label className="text-sm">حد العنصر (MB)</label>
                <input className="input" type="number" min={1}
                  value={editDraft.perEntryLimitBytes ? Math.round((editDraft.perEntryLimitBytes||0)/1024/1024) : '' as any}
                  onChange={(e)=> setEditDraft(s=>({ ...s, perEntryLimitBytes: e.target.value===''? undefined : Number(e.target.value)*1024*1024 }))} />
              </div>
              <div className="col-span-1">
                <label className="text-sm">إجمالي السعة (GB)</label>
                <input className="input" type="number" min={1}
                  value={editDraft.totalCapBytes ? Math.round(Number(editDraft.totalCapBytes||0)/1024/1024/1024) : '' as any}
                  onChange={(e)=> setEditDraft(s=>({ ...s, totalCapBytes: e.target.value===''? undefined : Number(e.target.value)*1024*1024*1024 }))} />
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" className="btn btn-outline" onClick={()=> setShowEditId(undefined)}>إلغاء</button>
                <button className="btn" disabled={busy}>حفظ التعديل</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}


