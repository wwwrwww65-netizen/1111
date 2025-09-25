export default function MobileUsers(): JSX.Element {
  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>المستخدمون</div>
        <input className="input" placeholder="بحث بالاسم أو الهاتف" />
      </div>
      <div className="panel" style={{ color:'var(--sub)' }}>ستظهر بطاقات المستخدمين هنا بتصميم محمول.</div>
    </div>
  );
}

