/* eslint-disable @next/next/no-img-element */
"use client";
import React from "react";
import { Button } from "../../components/ui/button";

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

const TABS = [
  { id: 'overview', label: 'نظرة عامة' },
  { id: 'rules', label: 'قواعد الكاش' },
  { id: 'entries', label: 'فحص الكاش' },
  { id: 'settings', label: 'الإعدادات والسجلات' },
] as const;

export default function CachePage(): JSX.Element {
  const [domainSel, setDomainSel] = React.useState<"WEB"|"MWEB"|"BOTH">("WEB");
  const [activeTab, setActiveTab] = React.useState<typeof TABS[number]['id']>('overview');
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
  const [showCreateModal, setShowCreateModal] = React.useState(false);
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
    try {
      const res = await fetch("/api/admin/cache/stats", { credentials: "include" });
      if (res.ok) setStats(await res.json());
    } catch {}
  }
  async function loadRules() {
    try {
      const res = await fetch("/api/admin/cache/rules?limit=100", { credentials: "include" });
      if (res.ok) {
        const j = await res.json();
        setRules(j.items || []);
      }
    } catch {}
  }
  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/cache/settings", { credentials: "include" });
      const j = await res.json();
      setSettings(j.settings || { staffDirectPublish:false, hitRateAlertPct:50, storageAlertPct:80, maxJobFailures:5 });
    } catch { setSettings({ staffDirectPublish:false, hitRateAlertPct:50, storageAlertPct:80, maxJobFailures:5 }); }
  }
  async function loadEntries() {
    try {
      const url = new URL(window.location.origin + "/api/admin/cache/entries");
      url.searchParams.set("page", String(entriesPage));
      url.searchParams.set("limit", String(entriesLimit));
      if (domainSel) url.searchParams.set("domain", domainSel);
      const res = await fetch(url.toString(), { credentials: "include" });
      const j = await res.json();
      setEntries(j.items || []);
    } catch {}
  }
  
  React.useEffect(()=>{ loadStats().catch(()=>null); loadRules().catch(()=>null); loadSettings().catch(()=>null); },[]);
  React.useEffect(()=>{ (async ()=>{ try{ const j = await (await fetch('/api/admin/audit-logs?page=1&limit=50',{credentials:'include'})).json(); setLogs((j.items||[]).filter((x:any)=> x.module==='cache')); }catch{} })(); },[]);
  React.useEffect(()=>{ if (activeTab === 'entries') loadEntries().catch(()=>null); },[domainSel, entriesPage, entriesLimit, activeTab]);

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
      setShowCreateModal(false);
      await loadRules();
    } catch (e:any) { setErr(e?.message || "خطأ غير متوقع"); }
    setBusy(false);
  }

  async function purgeRule(rule: Rule) {
    setBusy(true);
    try{
      await fetch("/api/admin/cache/purge", { method:"POST", headers:{ "content-type":"application/json" }, credentials:"include", body: JSON.stringify({ tags:[rule.pattern], domain: rule.domain }) });
      if (activeTab === 'entries') await loadEntries();
    } finally { setBusy(false); }
  }
  async function warmUrls(urls: string[], d: "WEB"|"MWEB"|"BOTH") {
    setBusy(true);
    try{
      await fetch("/api/admin/cache/warm", { method:"POST", headers:{ "content-type":"application/json" }, credentials:"include", body: JSON.stringify({ urls, domain:d }) });
      if (activeTab === 'entries') await loadEntries();
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
      {/* Header */}
      <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
            ⚡
          </div>
          <div>
            <h1 className="text-xl font-bold">التخزين المؤقت (Cache)</h1>
            <p className="text-sm opacity-60">إدارة وتخصيص سياسات الكاش وتسريع الأداء</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-black/20 p-2 rounded-lg">
          <label className="text-sm font-medium px-2">النطاق:</label>
          <select className="bg-transparent border border-white/10 rounded h-9 px-3 text-sm focus:border-blue-500 focus:outline-none" 
            value={domainSel} onChange={(e)=> setDomainSel(e.target.value as any)}>
            <option value="WEB">jeeey.com</option>
            <option value="MWEB">m.jeeey.com</option>
            <option value="BOTH">كلاهما</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        
        {/* TAB: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard 
                title="إجمالي حجم الكاش" 
                value={stats ? (domainSel === 'MWEB' ? bytes(stats?.mweb?.totalBytes||0) : bytes(stats?.web?.totalBytes||0)) : '...'}
                icon="💾"
                subtext="المساحة المستهلكة حالياً"
              />
              <StatsCard 
                title="نسبة الـ Hit Rate" 
                value={stats ? (domainSel === 'MWEB' ? (stats?.mweb?.hitRate||0) : (stats?.web?.hitRate||0)) + '%' : '...'}
                icon="🎯"
                subtext="كفاءة الاستجابة من الذاكرة"
                alert={settings && stats && ((domainSel==='MWEB'? (stats?.mweb?.hitRate||0) : (stats?.web?.hitRate||0)) < settings.hitRateAlertPct)}
              />
              <StatsCard 
                title="متوسط زمن الاستجابة" 
                value="12ms" // Placeholder
                icon="⚡"
                subtext="تقديري للطلبات المخدمة"
              />
              <StatsCard 
                title="الوظائف الفاشلة" 
                value={stats ? stats?.jobs?.failedLastDay || 0 : 0}
                icon="⚠️"
                subtext="آخر 24 ساعة"
                color="text-red-400"
              />
            </div>
            
            {/* Recent Logs Preview */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4">آخر النشاطات</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/40 border-b border-white/10">
                      <th className="text-right py-3 px-4">الوحدة</th>
                      <th className="text-right py-3 px-4">الإجراء</th>
                      <th className="text-right py-3 px-4">الوقت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 5).map((l)=> (
                      <tr key={l.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">{l.module}</td>
                        <td className="py-3 px-4">{l.action}</td>
                        <td className="py-3 px-4 dir-ltr text-right">{new Date(l.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {!logs.length && <tr><td colSpan={3} className="py-8 text-center opacity-50">لا توجد سجلات حديثة</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Rules */}
        {activeTab === 'rules' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">قواعد وسياسات الكاش</h2>
              <Button onClick={() => setShowCreateModal(true)}>+ إضافة قاعدة جديدة</Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <table className="w-full text-sm">
                <thead className="bg-black/20">
                  <tr>
                    <th className="text-right py-4 px-4">النطاق</th>
                    <th className="text-right py-4 px-4">الاسم / النمط</th>
                    <th className="text-right py-4 px-4">السياسة</th>
                    <th className="text-right py-4 px-4">TTL</th>
                    <th className="text-right py-4 px-4">Auto-Purge</th>
                    <th className="text-right py-4 px-4 w-[200px]">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r)=> (
                    <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${r.domain === 'BOTH' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                          {r.domain==='MWEB'?'Mobile':(r.domain==='WEB'?'Web':'All')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{r.name}</div>
                        <code className="text-xs bg-black/30 px-1 rounded text-yellow-200/70">{r.pattern}</code>
                      </td>
                      <td className="py-3 px-4 text-white/80">{r.policy}</td>
                      <td className="py-3 px-4 text-white/60">{r.ttlSeconds? `${Math.round((r.ttlSeconds||0)/3600)}h` : '∞'}</td>
                      <td className="py-3 px-4">
                        {r.autoPurge 
                          ? <span className="text-green-400 text-xs flex items-center gap-1">✓ مفعل</span>
                          : <span className="text-red-400 text-xs">✕ معطل</span>
                        }
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button className="p-1 hover:bg-white/10 rounded text-blue-400" title="تعديل" onClick={()=> openEdit(r)}>✎</button>
                          <button className="p-1 hover:bg-white/10 rounded text-red-400" title="حذف (Purge)" onClick={()=> purgeRule(r)}>🗑️</button>
                          <button className="p-1 hover:bg-white/10 rounded text-orange-400" title="تسخين (Warm)" onClick={()=> warmUrls([r.pattern], r.domain)}>🔥</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rules.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center opacity-50">لم يتم إنشاء أي قواعد بعد</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Entries */}
        {activeTab === 'entries' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">محتويات الذاكرة (Entries)</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-60">عدد النتائج:</span>
                <select className="bg-white/5 border border-white/10 rounded h-8 px-2 text-sm" value={entriesLimit} onChange={(e)=> setEntriesLimit(Number(e.target.value))}>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <table className="w-full text-sm">
                <thead className="bg-black/20">
                  <tr>
                    <th className="text-right py-3 px-4">المفتاح (Key)</th>
                    <th className="text-right py-3 px-4">النوع</th>
                    <th className="text-right py-3 px-4">الحجم</th>
                    <th className="text-right py-3 px-4">تاريخ الإنشاء</th>
                    <th className="text-right py-3 px-4">Hits</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e)=> (
                    <tr key={e.key} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4 max-w-[300px] truncate font-mono text-xs" dir="ltr">{e.key}</td>
                      <td className="py-3 px-4">{e.type}</td>
                      <td className="py-3 px-4 font-mono">{bytes(e.sizeBytes)}</td>
                      <td className="py-3 px-4 text-white/60" dir="ltr">{new Date(e.createdAt).toLocaleString()}</td>
                      <td className="py-3 px-4">{e.hitCount}</td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center opacity-50">الذاكرة فارغة أو لا توجد نتائج</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <Button variant="secondary" size="sm" onClick={()=> setEntriesPage(Math.max(1, entriesPage-1))} disabled={entriesPage<=1}>السابق</Button>
              <span className="flex items-center px-4 bg-white/5 rounded">صفحة {entriesPage}</span>
              <Button variant="secondary" size="sm" onClick={()=> setEntriesPage(entriesPage+1)} disabled={entries.length < entriesLimit}>التالي</Button>
            </div>
          </div>
        )}

        {/* TAB: Settings */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">إعدادات النظام</h3>
                {settings && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">السماح للموظفين بالنشر المباشر</label>
                      <input type="checkbox" className="toggle" checked={settings.staffDirectPublish} onChange={(e)=> setSettings({ ...(settings||{}), staffDirectPublish: e.target.checked })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/70">تنبيه عند انخفاض Hit Rate عن (%)</label>
                      <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2" type="number" min={0} max={100} value={settings.hitRateAlertPct} onChange={(e)=> setSettings({ ...(settings||{}), hitRateAlertPct: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/70">تنبيه امتلاء التخزين عند (%)</label>
                      <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2" type="number" min={0} max={100} value={settings.storageAlertPct} onChange={(e)=> setSettings({ ...(settings||{}), storageAlertPct: Number(e.target.value) })} />
                    </div>
                    <div className="pt-4">
                      <Button onClick={saveSettings} disabled={busy} className="w-full">حفظ الإعدادات</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 h-full">
                <h3 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">سجل العمليات الكامل</h3>
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/40">
                        <th className="text-right pb-2">الحدث</th>
                        <th className="text-right pb-2">التفاصيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((l)=> (
                        <tr key={l.id} className="border-t border-white/5">
                          <td className="py-2 align-top">
                            <div className="font-medium">{l.action}</div>
                            <div className="text-xs text-white/50">{new Date(l.createdAt).toLocaleTimeString()}</div>
                          </td>
                          <td className="py-2 align-top text-xs font-mono text-white/70 break-all">
                            {JSON.stringify(l.details)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl p-6 m-4">
            <h2 className="text-xl font-bold mb-6">إنشاء قاعدة جديدة</h2>
            <form onSubmit={createRule} className="space-y-4">
              {err && <div className="bg-red-500/10 text-red-400 p-3 rounded text-sm">{err}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-white/70">الاسم التعريفي</label>
                  <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 focus:border-blue-500 outline-none" 
                    value={name} onChange={(e)=> setName(e.target.value)} placeholder="مثال: صفحات المنتجات" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-white/70">النطاق</label>
                  <select className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 outline-none" 
                    value={domainSel} onChange={(e)=> setDomainSel(e.target.value as any)}>
                    <option value="WEB">jeeey.com</option>
                    <option value="MWEB">m.jeeey.com</option>
                    <option value="BOTH">كلاهما</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-white/70">النمط (Pattern)</label>
                <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 font-mono text-sm focus:border-blue-500 outline-none" 
                  value={pattern} onChange={(e)=> setPattern(e.target.value)} placeholder="product-*, /category/*" />
                <p className="text-xs text-white/40 mt-1">يمكن استخدام * للمطابقة الجزئية</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-white/70">نوع الهدف</label>
                  <select className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 outline-none" 
                    value={targetType} onChange={(e)=> setTargetType(e.target.value)}>
                    <option>Page</option>
                    <option>Tab</option>
                    <option>Category</option>
                    <option>Banner</option>
                    <option>All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-white/70">السياسة</label>
                  <select className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 outline-none" 
                    value={policy} onChange={(e)=> setPolicy(e.target.value)}>
                    <option value="Immediate">فوري (Immediate)</option>
                    <option value="Wait">انتظار (Wait)</option>
                    <option value="Delay">تأخير (Delay)</option>
                    <option value="Pending">مراجعة (Pending)</option>
                  </select>
                </div>
              </div>

              {policy === "Delay" && (
                 <div>
                    <label className="block text-sm mb-1 text-white/70">ساعات التأخير</label>
                    <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2" type="number" min={1} max={168} value={delayHours as any} onChange={(e)=> setDelayHours(Number(e.target.value))} />
                 </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="modalAutoPurge" className="w-4 h-4" checked={autoPurge} onChange={(e)=> setAutoPurge(e.target.checked)} />
                <label htmlFor="modalAutoPurge" className="text-sm cursor-pointer select-none">تنظيف تلقائي عند التحديث (Auto-Purge)</label>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
                <Button type="submit" disabled={busy}>{busy ? 'جاري الإنشاء...' : 'إنشاء القاعدة'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showEditId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl p-6 m-4">
            <h3 className="text-xl font-bold mb-6">تعديل القاعدة</h3>
            {err && <div className="text-red-400 text-sm mb-2">{err}</div>}
            <form onSubmit={submitEdit} className="space-y-4">
               {/* Simplified Edit Form - similar to create but bound to editDraft */}
               <div>
                  <label className="block text-sm mb-1 text-white/70">الاسم</label>
                  <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 outline-none" value={editDraft.name||''} onChange={(e)=> setEditDraft(s=>({ ...s, name: e.target.value }))} />
               </div>
               <div>
                  <label className="block text-sm mb-1 text-white/70">النمط</label>
                  <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 outline-none font-mono" value={editDraft.pattern||''} onChange={(e)=> setEditDraft(s=>({ ...s, pattern: e.target.value }))} />
               </div>
               <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={()=> setShowEditId(undefined)}>إلغاء</Button>
                <Button type="submit" disabled={busy}>حفظ التعديلات</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function StatsCard({ title, value, icon, subtext, alert, color }: { title: string; value: string|number; icon: string; subtext?: string; alert?: boolean; color?: string }) {
  return (
    <div className={`relative p-5 rounded-2xl border ${alert ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10 bg-white/5'} flex flex-col justify-between h-32 transition-all hover:bg-white/[0.07]`}>
      <div className="flex justify-between items-start">
        <span className="text-sm text-white/60">{title}</span>
        <span className="text-xl opacity-80">{icon}</span>
      </div>
      <div>
        <div className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</div>
        {subtext && <div className="text-xs text-white/40 mt-1">{subtext}</div>}
      </div>
      {alert && <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />}
    </div>
  );
}
