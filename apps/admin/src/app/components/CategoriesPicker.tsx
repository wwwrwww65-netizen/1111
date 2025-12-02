"use client";
import React from "react";

export type Mini = { id: string; name: string; image?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectMany: (items: Mini[]) => void;
};

function useAuthHeaders() {
  return React.useCallback(() => {
    if (typeof document === "undefined") return {} as Record<string, string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : "";
    try {
      token = decodeURIComponent(token);
    } catch {}
    return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : ({} as Record<string, string>);
  }, []);
}

export function CategoriesPicker({ open, onClose, onSelectMany }: Props): JSX.Element | null {
  const authHeaders = useAuthHeaders();
  const [items, setItems] = React.useState<Mini[]>([]);
  const [selected, setSelected] = React.useState<Record<string, Mini>>({});
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(`/api/admin/categories`, location.origin);
      url.searchParams.set("limit", "200");
      if (q.trim()) url.searchParams.set("search", q.trim());
      const r = await fetch(url.toString(), { credentials: "include", cache: "no-store", headers: { ...authHeaders() } });
      const j = await r.json();
      const list = Array.isArray(j?.categories)
        ? j.categories.map((c: any) => ({ id: String(c.id || c.slug || c.name), name: String(c.name || c.title || ""), image: String(c.image || "") }))
        : [];
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q, authHeaders]);

  React.useEffect(() => {
    if (open) load().catch(() => {});
  }, [open, load]);

  if (!open) return null;

  const toggle = (m: Mini) => {
    setSelected((s) => {
      const next = { ...s };
      if (next[m.id]) delete next[m.id];
      else next[m.id] = m;
      return next;
    });
  };

  const confirm = () => {
    try {
      const arr = Object.values(selected);
      onSelectMany(arr);
    } finally {
      onClose();
    }
  };

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 1100 }} onClick={onClose}>
      <div style={{ width: "min(900px,96vw)", maxHeight: "90vh", overflow: "auto", background: "var(--panel,#0b0e14)", border: "1px solid #1c2333", borderRadius: 12, padding: 12 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input className="input" placeholder="بحث عن فئة" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn" onClick={load}>
            بحث
          </button>
          <div style={{ marginInlineStart: "auto" }}>
            <button className="btn" onClick={confirm}>
              تأكيد
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div className="skeleton" style={{ height: 180 }} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 10 }}>
              {items.map((c) => {
                const checked = !!selected[c.id];
                return (
                  <label key={c.id} className="panel" style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid #1c2333", borderRadius: 8, padding: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(c)} />
                    <img src={c.image || "https://via.placeholder.com/64x64?text=CAT"} alt={c.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
                    <div style={{ display: "grid" }}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ color: "#94a3b8", fontSize: 12, direction: "ltr", textAlign: "start" }}>{c.id}</div>
                    </div>
                  </label>
                );
              })}
              {!items.length && <div style={{ color: "#94a3b8" }}>لا توجد عناصر</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


