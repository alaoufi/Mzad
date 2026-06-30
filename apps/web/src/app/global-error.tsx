'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem 1.5rem', textAlign: 'center', background: '#fbf9f4' }}>
        <p style={{ fontSize: 56 }}>😕</p>
        <h1 style={{ fontWeight: 800, fontSize: 22 }}>حدث خطأ غير متوقّع</h1>
        <p style={{ color: '#6b7280', marginTop: 6 }}>نعتذر — جرّب إعادة التحميل.</p>
        <button onClick={() => reset()} style={{ marginTop: 16, padding: '12px 24px', borderRadius: 16, background: '#0f7b6c', color: '#fff', fontWeight: 700, border: 'none' }}>
          ↻ إعادة المحاولة
        </button>
      </body>
    </html>
  );
}
