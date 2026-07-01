'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SECTIONS: { icon: string; title: string; body: string[] }[] = [
  {
    icon: '⚖️', title: 'إخلاء مسؤولية المنصة',
    body: [
      'منصة «مزاد» وسيط إلكتروني فقط لعرض المواشي والمزايدة عليها، وليست طرفاً في عمليات البيع أو الشراء.',
      'لا تضمن المنصة صحة المعلومات المقدَّمة من المستخدمين، ولا جودة أو صحة أو ملكية المواشي المعروضة.',
      'يتحمّل المستخدم كامل مسؤولية التحقّق من المواشي ومعاينتها قبل الشراء.',
      'لا تتحمّل المنصة أي خسائر مالية أو قانونية أو تشغيلية ناتجة عن التعامل بين المستخدمين.',
      'دور المنصة في النزاعات هو التوثيق والتنظيم فقط، ولا تُصدر حكماً قضائياً ولا تُلزِم أي طرف.',
    ],
  },
  {
    icon: '📜', title: 'شروط الاستخدام',
    body: [
      'يلتزم المستخدم بتقديم معلومات صحيحة عن نفسه وعن إعلاناته.',
      'يُمنع نشر محتوى مضلّل أو مخالف للأنظمة أو انتحال شخصية الغير.',
      'يحق للمنصة إيقاف الحسابات المخالفة أو الاحتيالية دون تعويض.',
      'يحق للمنصة تجميد الحساب مؤقتاً أثناء التحقيق في نزاع أو بلاغ.',
    ],
  },
  {
    icon: '🛡️', title: 'سياسة النزاعات',
    body: [
      'يمكن لأي طرف فتح نزاع مع تحديد الإعلان والطرف الآخر وتقديم الأدلّة.',
      'يُشعَر الطرف الآخر ويُمنح مهلة لتقديم إفادته وأدلّته، ويُوثَّق عدم تجاوبه إن لم يردّ.',
      'تُجمَّع أدلّة الطرفين في ملف قضية موثّق يمكن تسليمه للطرفين أو للجهات المختصة.',
      'المنصة تُنظّم وتوثّق ولا تُصدر أحكاماً؛ الفصل النهائي للجهات المختصة عند التصعيد.',
    ],
  },
  {
    icon: '🔐', title: 'سياسة الخصوصية واستخدام البيانات',
    body: [
      'تُحفظ بيانات الحساب والإعلانات والمحادثات وسجلّات الاستخدام لأغراض التشغيل والتوثيق.',
      'يوافق المستخدم على استخدام بياناته وسجلّاته عند وجود نزاع.',
      'يحق للمنصة مشاركة المعلومات مع الجهات المختصة عند الطلب الرسمي.',
      'تُحفظ السجلّات المتعلّقة بالصفقات والنزاعات لمدة لا تقل عن خمس سنوات.',
    ],
  },
  {
    icon: '🚨', title: 'سياسة مكافحة الاحتيال',
    body: [
      'يُمنع التلاعب في المزادات أو المزايدات الوهمية أو تعدّد الحسابات للشخص الواحد.',
      'يُنصح بعدم الدفع قبل المعاينة، واستخدام وسائل موثّقة، والاحتفاظ بإثباتات الدفع.',
      'الإبلاغ عن أي سلوك مشبوه متاح من صفحة الإعلان أو الدعم.',
    ],
  },
  {
    icon: '✔', title: 'سياسة التوثيق',
    body: [
      'توثيق رقم الجوال أساسي لكل حساب.',
      'يُتاح توثيق الهوية لرفع الثقة ومنح شارة «موثّق».',
      'الحسابات الموثّقة تحظى بأولوية ثقة أعلى لدى المتعاملين.',
    ],
  },
];

export default function PoliciesPage() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-dark shadow-sm ring-1 ring-sand-200">→ رجوع</button>
        <h1 className="text-2xl font-extrabold text-engrave">📋 السياسات والأحكام</h1>
      </div>
      <p className="text-sm text-gray-500">تنظّم هذه السياسات العلاقة بين المستخدمين والمنصة. باستخدامك المنصة فأنت موافق عليها.</p>

      <div className="space-y-2">
        {SECTIONS.map((s, i) => (
          <div key={i} className="card overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center gap-2 p-4 text-right">
              <span className="text-xl">{s.icon}</span>
              <span className="flex-1 font-extrabold text-engrave">{s.title}</span>
              <span className={`text-gray-400 transition ${open === i ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {open === i && (
              <ul className="space-y-2 px-4 pb-4">
                {s.body.map((b, k) => (
                  <li key={k} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
