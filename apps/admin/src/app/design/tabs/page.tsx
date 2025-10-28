"use client";
import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = 'force-dynamic';

function useApiBase(){
  return React.useMemo(()=> (typeof window!=='undefined' ? '' : ''), []);
}

type TabPage = {
  id: string;
  slug: string;
  label: string;
  device: 'MOBILE'|'DESKTOP';
  status: 'DRAFT'|'SCHEDULED'|'PUBLISHED'|'ARCHIVED';
  updatedAt: string;
};

export default function TabPagesList(): JSX.Element {
  const [items, setItems] = React.useState<TabPage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string|undefined>();
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [status, setStatus] = React.useState<string>('');
  const [device, setDevice] = React.useState<string>('');
  const apiBase = useApiBase();

  const fetchList = React.useCallback(()=>{
    setLoading(true); setError(undefined);
    const qs = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) qs.set('status', status);
    if (device) qs.set('device', device);
    fetch(`${apiBase}/api/admin/tabs/pages?`+qs.toString(), { credentials:'include' })
      .then(r=> r.ok ? r.json() : r.json().then(j=> Promise.reject(j)))
      .then(j=>{ setItems(j.pages||[]); setTotalPages(j.pagination?.totalPages||1); })
      .catch(e=> setError(e?.error||'failed'))
      .finally(()=> setLoading(false));
  },[apiBase,page,status,device]);

  React.useEffect(()=>{ fetch(`${apiBase}/api/admin/tabs/ensure-perms`, { method:'POST', credentials:'include' }); },[apiBase]);
  React.useEffect(()=>{ fetchList(); },[fetchList]);

  function createDraft(){
    const slug = prompt('Slug (مثال: women)') || '';
    const label = prompt('Label (مثال: نساء)') || '';
    if (!slug || !label) return;
    fetch(`${apiBase}/api/admin/tabs/pages`, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ slug, label, device: 'MOBILE' }) })
      .then(r=> r.ok ? r.json() : r.json().then(j=> Promise.reject(j)))
      .then(()=> fetchList());
  }

  async function duplicateTab(id: string){
    try{
      const slug = prompt('Slug للنسخة (مثال: women-copy)') || '';
      const label = prompt('Label للنسخة (مثال: نساء - نسخة)') || '';
      if (!slug || !label) return;
      // Fetch latest version content of source
      const vers = await fetch(`${apiBase}/api/admin/tabs/pages/${id}/versions`, { credentials:'include' }).then(r=> r.json());
      const latest = Array.isArray(vers.versions) ? vers.versions[0] : null;
      // Create new page
      const created = await fetch(`${apiBase}/api/admin/tabs/pages`, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ slug, label, device: 'MOBILE' }) }).then(r=> r.json());
      const newId = created?.page?.id;
      if (newId && latest){
        await fetch(`${apiBase}/api/admin/tabs/pages/${newId}/versions`, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ title: latest.title||'Copy', notes: 'Duplicated', content: latest.content||{ sections: [] } }) });
      }
      fetchList();
    }catch(e){ /* noop */ }
  }

  async function deleteTab(id: string){
    if (!confirm('حذف هذا التبويب نهائياً؟')) return;
    await fetch(`${apiBase}/api/admin/tabs/pages/${id}`, { method:'DELETE', credentials:'include' });
    fetchList();
  }

  function StatusBadge({s}:{s:TabPage['status']}){
    const map: Record<string,string> = { DRAFT:'bg-gray-100 text-gray-700', SCHEDULED:'bg-amber-100 text-amber-800', PUBLISHED:'bg-green-100 text-green-700', ARCHIVED:'bg-slate-100 text-slate-600' };
    const cls = map[s] || 'bg-gray-100 text-gray-700';
    return <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${cls}`}>{s}</span>
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">مدير تبويبات الصفحة</h1>
        <button onClick={createDraft} className="px-3 py-1.5 rounded bg-black text-white text-sm">إنشاء تبويب جديد</button>
      </div>
      <div className="flex gap-2 mb-3">
        <select value={status} onChange={e=> setStatus(e.target.value)} className="border px-2 py-1 rounded text-sm">
          <option value="">كل الحالات</option>
          <option value="DRAFT">مسودة</option>
          <option value="SCHEDULED">مجدول</option>
          <option value="PUBLISHED">منشور</option>
          <option value="ARCHIVED">أرشيف</option>
        </select>
        <select value={device} onChange={e=> setDevice(e.target.value)} className="border px-2 py-1 rounded text-sm">
          <option value="">كل الأجهزة</option>
          <option value="MOBILE">موبايل</option>
          <option value="DESKTOP">ديسكتوب</option>
        </select>
        <button onClick={()=> setPage(1)} className="border px-2 py-1 rounded text-sm">تطبيق</button>
      </div>
      {loading? <div>جار التحميل…</div> : error? <div className="text-red-600">{error}</div> : (
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="text-right p-2 border">Slug</th>
              <th className="text-right p-2 border">Label</th>
              <th className="text-right p-2 border">Status</th>
              <th className="text-right p-2 border">Device</th>
              <th className="text-right p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it=> (
              <tr key={it.id}>
                <td className="p-2 border font-mono">{it.slug}</td>
                <td className="p-2 border">{it.label}</td>
                <td className="p-2 border"><StatusBadge s={it.status} /></td>
                <td className="p-2 border">{it.device}</td>
                <td className="p-2 border">
                  <div className="flex items-center gap-3">
                    <Link href={`/design/tabs/${it.id}`} className="text-blue-600">تحرير</Link>
                    <button onClick={()=> duplicateTab(it.id)} className="text-amber-600">نسخ</button>
                    <button onClick={()=> deleteTab(it.id)} className="text-red-600">حذف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-3 flex items-center gap-2">
        <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))} className="border px-2 py-1 rounded text-sm disabled:opacity-50">السابق</button>
        <div className="text-sm">صفحة {page} من {totalPages}</div>
        <button disabled={page>=totalPages} onClick={()=> setPage(p=> p+1)} className="border px-2 py-1 rounded text-sm disabled:opacity-50">التالي</button>
      </div>
    </div>
  );
}


