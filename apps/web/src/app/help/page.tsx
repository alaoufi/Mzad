'use client';

import { useRouter } from 'next/navigation';

const STEPS = [
  {
    title: 'كيف أشتري؟',
    icon: '🛒',
    steps: [
      'اختر النوع من الأعلى (إبل، غنم، خيل).',
      'تصفّح الإعلانات واضغط على ما يعجبك.',
      'تواصل مع صاحب الإعلان عبر زر «تواصل».',
    ],
  },
  {
    title: 'كيف أبيع؟',
    icon: '🏷️',
    steps: [
      'اضغط زر «＋» في الأسفل لإضافة إعلان.',
      'اتبع الخطوات: التصنيف ← العنوان ← الصور ← التفاصيل ← الصحة ← السعر.',
      'انشر الإعلان، ويمكنك تعديله خلال ساعتين.',
    ],
  },
  {
    title: 'كيف أزايد في مزاد؟',
    icon: '🔨',
    steps: [
      'افتح إعلان المزاد.',
      'اضغط «زايد» وأدخل مبلغك (أعلى من الحالي).',
      'تابع العدّاد — يفوز أعلى مبلغ عند انتهاء الوقت.',
    ],
  },
  {
    title: 'ما معنى «على السوم»؟',
    icon: '🤝',
    steps: [
      'مساومة مفتوحة بلا وقت محدّد.',
      'يضيف المشترون مبالغهم، ويقبل البائع متى شاء.',
    ],
  },
];

export default function HelpPage() {
  const router = useRouter();
  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">❓ كيف يعمل الموقع</h1>
        <button onClick={() => router.push('/account')} className="text-sm font-bold text-brand">← حسابي</button>
      </div>
      <p className="text-gray-500">شرح بسيط بالخطوات. أي استفسار آخر تواصل مع الدعم.</p>

      <div className="space-y-3">
        {STEPS.map((s) => (
          <div key={s.title} className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-brand-dark">
              <span className="text-2xl">{s.icon}</span> {s.title}
            </h2>
            <ol className="space-y-2">
              {s.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
                  <span className="pt-0.5 text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push('/sell')} className="btn-primary">＋ أضف إعلان الآن</button>
        <a href="https://wa.me/9665000000" target="_blank" rel="noopener noreferrer"
          className="btn-outline flex items-center justify-center gap-2 !text-green-700">💬 تواصل مع الدعم</a>
      </div>
    </div>
  );
}
