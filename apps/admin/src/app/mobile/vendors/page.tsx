export default function MobileVendors(): JSX.Element {
  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>البائعون</div>
        <input className="input" placeholder="بحث بالاسم" />
      </div>
      <div className="panel" style={{ color:'var(--sub)' }}>ستظهر بطاقات البائعين هنا بتصميم محمول.</div>
    </div>
  );
}

