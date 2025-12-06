"use client";
import React from "react";

export type Mini = { id: string; slug?: string; name: string; image?: string; parentId?: string };

export function CategoriesPicker({ open, onClose, onSelectMany, initial }: { open: boolean; onClose: () => void; onSelectMany: (items: Mini[]) => void; initial?: Mini[] }): JSX.Element | null {
  const [rows, setRows] = React.useState<Mini[]>(initial || []);
  const [all, setAll] = React.useState<Mini[]>([]);
  const [search, setSearch] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return; (async () => {
      try {
        setBusy(true);
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
        const r = await fetch(`${API_BASE}/api/categories?limit=1000`, { credentials: 'omit' });
        const j = await r.json();
        const list: Array<any> = Array.isArray(j?.categories) ? j.categories : [];
        // Map API response to Mini
        const mapped: Mini[] = list.map((c: any) => ({ id: c.id, slug: c.slug, name: c.name, image: c.image, parentId: c.parentId }));
        setAll(mapped);

        // Hydrate initial/rows if they are missing slugs/data but match by ID
        setRows(prev => {
          if (!prev.length) {
            if (initial?.length) return initial;
            return [];
          }
          return prev;
        });
      } catch { }
      finally { setBusy(false) }
    })()
  }, [open]);

  // Separate effect to hydrate rows from 'all' when 'all' loads
  React.useEffect(() => {
    if (!all.length) return;
    setRows(prev => {
      if (!prev.length && initial?.length) {
        // First load from initial
        return initial.map(InitItem => {
          // Try finding by UUID
          const found = all.find(a => a.id === InitItem.id);
          if (found) return { ...InitItem, ...found }; // Hydrate
          // Try finding by Slug (if InitItem.id was a slug)
          const foundBySlug = all.find(a => a.slug === InitItem.id);
          if (foundBySlug) return { ...foundBySlug };
          return InitItem;
        });
      } else if (prev.length) {
        // Re-hydrate existing rows (e.g. to fill in missing slugs or fix Slug-as-ID)
        return prev.map(row => {
          let found = all.find(a => a.id === row.id);
          if (!found) found = all.find(a => a.slug === row.id); // Fallback: matched by slug

          if (found) return { ...row, ...found };
          return row;
        });
      }
      return prev;
    });
  }, [all, initial]);

  const filtered = React.useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return all;

    // 1. Find parents that match
    const matchedParents = all.filter(c => (c.name || '').toLowerCase().includes(t)).map(c => c.id);

    // 2. Filter: Match name OR ID OR Slug OR Parent Name/ID matches
    return all.filter(c =>
      (c.name || '').toLowerCase().includes(t) ||
      (c.id || '').toLowerCase().includes(t) ||
      (c.slug || '').toLowerCase().includes(t) ||
      (c.parentId && matchedParents.includes(c.parentId))
    );
  }, [all, search]);

  if (!open) return null;

  // Resolve parent name helper
  const getParentName = (pid?: string) => {
    if (!pid) return '';
    const p = all.find(x => x.id === pid);
    return p ? p.name : '';
  };

  const toggle = (it: Mini) => {
    setRows((cur) => {
      const exists = cur.find(x => x.id === it.id);
      if (exists) return cur.filter(x => x.id !== it.id);
      return [...cur, it];
    });
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }}>
      <div style={{ width: 'min(1100px, 98vw)', height: '90vh', display: 'flex', flexDirection: 'column', background: '#0b0e14', border: '1px solid #1c2333', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c2333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f3f4f6' }}>اختيار الفئات {busy ? '…' : ''}</h3>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>إغلاق</button>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>

          {/* Main Grid Area */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #1c2333' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #1c2333', background: '#0b0e14' }}>
              <input value={search} onChange={(e) => setSearch((e.target as HTMLInputElement).value)} placeholder="بحث عن فئة..." style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', fontSize: 15, outline: 'none' }} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {filtered.map((c) => {
                  const on = !!rows.find(r => r.id === c.id);
                  const parentName = getParentName(c.parentId);
                  return (
                    <button key={c.id} onClick={() => toggle(c)} style={{
                      position: 'relative',
                      aspectRatio: '16/10',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: on ? '2px solid #3b82f6' : '1px solid #374151',
                      textAlign: 'start',
                      transition: 'transform 0.1s',
                      transform: on ? 'scale(0.98)' : 'scale(1)'
                    }}>
                      {/* Background Image */}
                      {c.image ? (
                        <img src={c.image} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, background: '#1f2937' }} />
                      )}

                      {/* Gradient Overlay */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)' }} />

                      {/* Checkbox Indicator */}
                      <div style={{ position: 'absolute', bottom: 12, left: 12, width: 20, height: 20, borderRadius: 4, border: '2px solid rgba(255,255,255,0.7)', background: on ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {on && <div style={{ width: 10, height: 10, background: '#fff', borderRadius: 2 }} />}
                      </div>

                      {/* Text Content */}
                      <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: 12, paddingLeft: 40 }}>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, textShadow: '0 1px 2px rgba(0,0,0,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                        {parentName ? (
                          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{parentName}</div>
                        ) : (
                          <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>قسم رئيسي</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar (Selected) */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#111827' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f2937' }}>
              <h4 style={{ margin: 0, color: '#e5e7eb' }}>المحددة ({rows.length})</h4>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <div style={{ display: 'grid', gap: 8 }}>
                {rows.map((c) => {
                  const parentName = getParentName(c.parentId || all.find(a => a.id === c.id)?.parentId);
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: 8 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                        {c.image ? (<img src={c.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : null}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                        <div style={{ color: '#94a3b8', fontSize: 11 }}>{parentName || 'قسم رئيسي'}</div>
                        {c.slug && <div style={{ color: '#059669', fontSize: 10, fontFamily: 'monospace' }}>{c.slug}</div>}
                      </div>
                      <button onClick={() => setRows(rs => rs.filter(x => x.id !== c.id))} style={{ padding: '4px 8px', background: '#7f1d1d', color: '#fecaca', borderRadius: 6, fontSize: 12 }}>حذف</button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #1f2937', background: '#111827' }}>
              <button onClick={() => {
                // Final safety check
                const freshRows = rows.map(r => {
                  // 1. Try finding by UUID
                  let fresh = all.find(a => a.id === r.id);
                  // 2. If not found, r.id might be a slug (legacy/corrupted). Try matching against slug.
                  if (!fresh) fresh = all.find(a => a.slug === r.id);

                  // If found fresh data (which has correct UUID), use it.
                  return fresh ? { ...r, ...fresh } : r;
                });
                onSelectMany(freshRows);
                onClose();
              }} style={{ width: '100%', padding: '12px', background: '#059669', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>تأكيد الاختيار ({rows.length})</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
