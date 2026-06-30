'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="card p-8">
        <p className="text-6xl">😕</p>
        <h1 className="mt-3 text-xl font-extrabold text-engrave">حدث خطأ غير متوقّع</h1>
        <p className="mt-1 text-sm text-gray-500">نعتذر عن ذلك — جرّب مرة أخرى.</p>
        <button onClick={() => reset()} className="btn-primary mt-4 w-full">↻ إعادة المحاولة</button>
        <a href="/" className="mt-3 inline-block text-sm font-bold text-brand">العودة للرئيسية</a>
      </div>
    </div>
  );
}
