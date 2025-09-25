export default function MobileOrders(): JSX.Element {
  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>الطلبات</div>
        <input className="input" placeholder="بحث بالرقم أو الاسم" />
      </div>
      <div className="panel" style={{ color:'var(--sub)' }}>سيتم ربط القائمة بالـ API وعرضها كبطاقات.</div>
    </div>
  );
}

