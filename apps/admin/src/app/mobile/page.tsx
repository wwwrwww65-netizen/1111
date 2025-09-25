export default function MobileHome(): JSX.Element {
  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:700, marginBottom:4 }}>نظرة سريعة</div>
            <div style={{ color:'var(--sub)' }}>ملخص اليوم</div>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
          <a className="panel" href="/mobile/orders" style={{ textDecoration:'none' }}>
            <div style={{ color:'var(--sub)', marginBottom:6 }}>الطلبات</div>
            <div style={{ fontSize:20, fontWeight:800 }}>—</div>
          </a>
          <a className="panel" href="/mobile/vendors" style={{ textDecoration:'none' }}>
            <div style={{ color:'var(--sub)', marginBottom:6 }}>البائعون</div>
            <div style={{ fontSize:20, fontWeight:800 }}>—</div>
          </a>
        </div>
      </div>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>إجراءات سريعة</div>
        <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <a className="btn" href="/mobile/products/new" style={{ textAlign:'center', lineHeight:'40px' }}>+ منتج جديد</a>
          <a className="btn btn-outline" href="/mobile/orders" style={{ textAlign:'center', lineHeight:'40px' }}>عرض الطلبات</a>
        </div>
      </div>
    </div>
  );
}

