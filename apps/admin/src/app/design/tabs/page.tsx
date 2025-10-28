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
    const cls = s==='PUBLISHED' ? 'badge ok' : s==='SCHEDULED' ? 'badge warn' : s==='ARCHIVED' ? 'badge' : 'badge';
    return <span className={cls} style={{height:24}}>{s}</span>
  }

  return (
    <div className="container centered">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h1 className="h1">مدير تبويبات الصفحة</h1>
            <div className="muted">إدارة التبويبات والمنشورات مع فلاتر وأدوات سريعة</div>
          </div>
          <button onClick={createDraft} className="btn btn-md">إنشاء تبويب جديد</button>
        </div>
        <div className="toolbar">
          <label className="search">
            <select value={status} onChange={e=> setStatus(e.target.value)} className="select">
              <option value="">كل الحالات</option>
              <option value="DRAFT">مسودة</option>
              <option value="SCHEDULED">مجدول</option>
              <option value="PUBLISHED">منشور</option>
              <option value="ARCHIVED">أرشيف</option>
            </select>
          </label>
          <label className="search">
            <select value={device} onChange={e=> setDevice(e.target.value)} className="select">
              <option value="">كل الأجهزة</option>
              <option value="MOBILE">موبايل</option>
              <option value="DESKTOP">ديسكتوب</option>
            </select>
          </label>
          <div className="actions">
            <button onClick={()=> setPage(1)} className="btn btn-outline btn-md">تطبيق</button>
          </div>
        </div>
      </div>

      <div className="panel">
        {loading? (
          <div className="skeleton-table-row" />
        ) : error? (
          <div className="toast err">{error}</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Slug</th>
                  <th>Label</th>
                  <th>Status</th>
                  <th>Device</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it=> (
                  <tr key={it.id}>
                    <td><span style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'}}>{it.slug}</span></td>
                    <td>{it.label}</td>
                    <td><StatusBadge s={it.status} /></td>
                    <td>{it.device}</td>
                    <td>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        <Link href={`/design/tabs/${it.id}`} className="btn btn-outline btn-sm">تحرير</Link>
                        <button onClick={()=> duplicateTab(it.id)} className="btn btn-outline btn-sm">نسخ</button>
                        <button onClick={()=> deleteTab(it.id)} className="btn danger btn-sm">حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="toolbar mt-2">
          <div className="muted">صفحة {page} من {totalPages}</div>
          <div className="actions">
            <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))} className="btn btn-outline btn-sm">السابق</button>
            <button disabled={page>=totalPages} onClick={()=> setPage(p=> p+1)} className="btn btn-outline btn-sm">التالي</button>
          </div>
        </div>
      </div>
    </div>
  );
}


