export default function NotFound(): JSX.Element {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: 18 }}>الصفحة غير موجودة</h1>
      <p style={{ opacity: 0.8 }}>لم نتمكن من العثور على المحتوى المطلوب.</p>
      <a className="btn btn-md" href="/" style={{ display: 'inline-block', marginTop: 12 }}>العودة للرئيسية</a>
    </main>
  );
}

