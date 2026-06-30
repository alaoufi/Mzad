import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="card p-8">
        <p className="text-6xl">🧭</p>
        <h1 className="mt-3 text-xl font-extrabold text-engrave">الصفحة غير موجودة</h1>
        <p className="mt-1 text-sm text-gray-500">الرابط قد يكون قديماً أو غير صحيح.</p>
        <Link href="/" className="btn-primary mt-4 inline-flex w-full justify-center">الرئيسية</Link>
      </div>
    </div>
  );
}
