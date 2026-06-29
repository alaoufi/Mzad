'use client';

// زر دعم عائم متاح في كل الشاشات (لكبار السن)
export function SupportButton() {
  return (
    <a
      href="https://wa.me/9665000000"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full bg-green-600 px-5 py-4 text-white shadow-xl active:scale-95"
      aria-label="اتصل بالدعم"
    >
      <span className="text-2xl">💬</span>
      <span className="font-bold">الدعم</span>
    </a>
  );
}
