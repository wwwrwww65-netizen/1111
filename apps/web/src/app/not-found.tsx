export default function NotFound(): JSX.Element {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-bold">الصفحة غير موجودة</h1>
      <p className="text-gray-600 mt-2">تحقق من الرابط أو عُد إلى الصفحة الرئيسية.</p>
      <a href="/" className="mt-4 px-4 py-2 bg-black text-white rounded">العودة للرئيسية</a>
    </main>
  );
}

