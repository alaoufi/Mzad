'use client';

import { useRouter } from 'next/navigation';

interface Guide { id: string; icon: string; tab: string; goal: string; steps: string[] }

const GUIDE: Guide[] = [
  {
    id: 'home', icon: '🏠', tab: 'الرئيسية والتصفّح',
    goal: 'تصفّح العروض والمزادات حسب ما يهمّك، وكل نوع بهويته الخاصة.',
    steps: [
      'اختر اهتماماتك أول دخول، أو «تصفّح الكل».',
      'من الصفّ العلوي: قائمة نوع البيع (🏷️ العروض / 🔨 المزادات / ✨ الكل).',
      'قائمة «التصنيفات» متعددة الاختيار لتصفية ما يظهر لك.',
      'الترتيب الافتراضي (الأحدث/السعر…) تضبطه من ملفك الشخصي.',
    ],
  },
  {
    id: 'interests', icon: '⭐', tab: 'الاهتمامات',
    goal: 'أن تظهر لك إعلانات ما يخصّك فقط (حلال ومستلزمات).',
    steps: [
      'حسابي ← بطاقة «اهتماماتي» ← زر اختيار/تعديل.',
      'اختر الأنواع أو الألوان أو السلالات، ومن المستلزمات ما تريد.',
      'تُحفظ، وتظهر إعلاناتها فقط في موجزك على كل أجهزتك.',
    ],
  },
  {
    id: 'sell', icon: '➕', tab: 'إضافة إعلان',
    goal: 'عرض ماشيتك للبيع المباشر أو المزاد أو على السوم.',
    steps: [
      'اضغط زر ＋ في الأسفل.',
      'اختر التصنيف من القائمة المنسدلة (نوع ← صنف ← سلالة).',
      'حدّد الموقع: المنطقة والمدينة، أو موقعك بدقّة (GPS).',
      'اكتب العنوان والوصف، وأرفق صوراً واضحة، وبيّن الحالة الصحية.',
      'اختر السعر (بيع مباشر) أو إعدادات المزاد أو «على السوم».',
      'انشر — وقد ينتظر موافقة الإدارة قبل ظهوره.',
    ],
  },
  {
    id: 'listing', icon: '📋', tab: 'تفاصيل الإعلان والشراء',
    goal: 'معاينة الإعلان والتواصل مع صاحبه والشراء.',
    steps: [
      'افتح الإعلان لرؤية الصور والمواصفات والحالة الصحية.',
      'اضغط «🛒 اطلب الشراء» لإرسال طلبك، أو «💬 مراسلة خاصة» أو «📱 واتساب».',
      '⚠️ تذكّر: لا تشترِ حتى ترى بعينك أو من تثق به.',
    ],
  },
  {
    id: 'auction', icon: '🔨', tab: 'المزادات وعلى السوم',
    goal: 'المزايدة على مزاد مؤقّت أو المساومة المفتوحة.',
    steps: [
      'في المزاد: أدخل مزايدتك (أعلى من الحالية) وتابع العدّاد التنازلي.',
      '«على السوم»: مساومة مفتوحة بلا وقت محدّد — قدّم عرضك.',
    ],
  },
  {
    id: 'favorites', icon: '❤️', tab: 'المفضلة',
    goal: 'حفظ الإعلانات التي تهمّك للرجوع إليها.',
    steps: ['اضغط ❤️ على أي إعلان أو بطاقة.', 'راجعها من تبويب «المفضلة» في الأسفل.'],
  },
  {
    id: 'messages', icon: '💬', tab: 'الرسائل',
    goal: 'التواصل الخاص مع الطرف الآخر داخل المنصة (موثّق).',
    steps: ['من الإعلان اضغط «مراسلة خاصة».', 'تابع محادثاتك من تبويب «رسائلي».'],
  },
  {
    id: 'notifications', icon: '🔔', tab: 'الإشعارات',
    goal: 'تنبيهك بالمزايدات والردود والنزاعات والتوثيق.',
    steps: ['اضغط أيقونة الجرس 🔔 أعلى الصفحة لعرض إشعاراتك.'],
  },
  {
    id: 'account', icon: '👤', tab: 'حسابي والإحصائيات',
    goal: 'بياناتك الشخصية وسجلّك الكامل في السوق.',
    steps: [
      'حسابي ← «✏️ تعديل بياناتي»: الاسم، الموقع، التعريف، الخبرة، البيانات البنكية.',
      'تابع إحصائياتك: مبيعات، مشتريات، مزايدات، عروض.',
      'اضبط «ترتيب العرض الافتراضي» للرئيسية.',
    ],
  },
  {
    id: 'verify', icon: '🛡️', tab: 'توثيق الهوية',
    goal: 'الحصول على شارة «موثّق» لزيادة ثقة المتعاملين بك.',
    steps: ['حسابي ← بطاقة التوثيق ← «اطلب التوثيق».', 'تراجع الإدارة طلبك ويصلك إشعار بالنتيجة.'],
  },
  {
    id: 'wallet', icon: '👛', tab: 'المحفظة',
    goal: 'إدارة رصيدك وعملياتك المالية.',
    steps: ['حسابي ← «المحفظة» لعرض الرصيد والسجل المالي والشحن.'],
  },
  {
    id: 'supplies', icon: '🛒', tab: 'سوق المستلزمات',
    goal: 'أعلاف وأدوية ومستلزمات الحلال.',
    steps: ['إن اخترت المستلزمات ضمن اهتماماتك ظهرت في موجزك.', 'أو ادخلها من زرّ 🛒 في الأعلى.'],
  },
  {
    id: 'disputes', icon: '⚖️', tab: 'النزاعات وحفظ الحقوق',
    goal: 'توثيق الشكاوى والأدلة وتنظيمها لعرضها على الإدارة أو الجهات المختصة. المنصة جهة توثيق محايدة.',
    steps: [
      'من صفحة الإعلان اضغط «فتح نزاع».',
      'إن كنت بائعاً: حدّد المشتري محل النزاع. وإن كنت مشترياً: صاحب الإعلان معروف تلقائياً.',
      'اختر نوع الشكوى، المبلغ، تاريخ الواقعة، المطلوب، وأرفق الأدلّة (صور).',
      'يتلقّى الطرف الآخر إشعاراً ويقدّم إفادته وأدلّته من «نزاعاتي».',
      'تفصل الإدارة أو تكتفي بالتوثيق، ويمكن تسليم الملف للجهات المختصة.',
    ],
  },
  {
    id: 'admin', icon: '🛡️', tab: 'لوحة الإدارة (للمصرّح لهم)',
    goal: 'إدارة الموقع عبر أربعة أقسام مستقلّة حسب صلاحية دورك.',
    steps: [
      '👤 الملف الشخصي · ⚙️ تجهيزات الموقع · 📋 إدارة الإعلانات · ⚖️ السوق والمستخدمون والنزاعات.',
      'تظهر لك الأقسام المصرّح لك باطلاعها فقط (اطلاع/إضافة/تعديل/حذف).',
    ],
  },
  {
    id: 'support', icon: '🆘', tab: 'الدعم',
    goal: 'مساعدتك في أي استفسار أو مشكلة.',
    steps: ['حسابي ← زر «الدعم» للتواصل معنا مباشرة.'],
  },
];

// صورة توضيحية مبسّطة (محاكاة شاشة) لكل خدمة — بلون مميّز وأيقونتها
const SHOT_COLORS = ['#0f7b6c', '#b9852b', '#3b5bdb', '#c2410c', '#7c3aed', '#0e7490', '#be123c', '#15803d', '#a16207', '#1d4ed8', '#0d9488', '#9333ea', '#dc2626', '#334155', '#0891b2'];

function GuideShot({ icon, color }: { icon: string; color: string }) {
  return (
    <div className="mb-3 overflow-hidden rounded-2xl ring-1 ring-black/[0.06] shadow-sm">
      <svg viewBox="0 0 320 168" className="block w-full" role="img" aria-label="صورة توضيحية">
        <rect width="320" height="168" fill="#f7f5f0" />
        <rect width="320" height="44" fill={color} />
        <text x="298" y="29" fontSize="20" textAnchor="middle">{icon}</text>
        <rect x="120" y="15" width="150" height="13" rx="6.5" fill="#ffffff" fillOpacity="0.9" />
        <g>
          <rect x="16" y="60" width="140" height="92" rx="12" fill="#ffffff" stroke="#ececec" />
          <rect x="28" y="72" width="116" height="48" rx="8" fill={color} fillOpacity="0.14" />
          <text x="86" y="104" fontSize="26" textAnchor="middle">{icon}</text>
          <rect x="28" y="128" width="86" height="8" rx="4" fill="#e2e0da" />
          <rect x="28" y="140" width="54" height="7" rx="3.5" fill={color} fillOpacity="0.5" />
        </g>
        <g>
          <rect x="164" y="60" width="140" height="92" rx="12" fill="#ffffff" stroke="#ececec" />
          <rect x="176" y="72" width="116" height="48" rx="8" fill={color} fillOpacity="0.14" />
          <text x="234" y="104" fontSize="26" textAnchor="middle">{icon}</text>
          <rect x="176" y="128" width="86" height="8" rx="4" fill="#e2e0da" />
          <rect x="176" y="140" width="54" height="7" rx="3.5" fill={color} fillOpacity="0.5" />
        </g>
      </svg>
    </div>
  );
}

export default function GuidePage() {
  const router = useRouter();
  return (
    <div className="animate-fadeup space-y-5">
      {/* ترويسة ثلاثية الأبعاد */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark to-brand-light p-6 text-white shadow-xl float-box" style={{ boxShadow: '0 24px 48px -22px rgba(10,92,80,0.5)' }}>
        <div className="pointer-events-none absolute -left-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 right-6 h-28 w-28 rounded-full bg-white/10" />
        <h1 className="relative text-2xl font-extrabold text-emboss-light">📖 دليل الاستخدام</h1>
        <p className="relative mt-1 text-white/85">كل خدمة: هدفها وطريقة استخدامها. اضغط أي عنوان للانتقال إليه.</p>
      </div>

      {/* الفهرس ثلاثي الأبعاد — روابط */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {GUIDE.map((g) => (
          <a key={g.id} href={`#${g.id}`}
            className="card float-box flex items-center gap-2 p-3 transition active:scale-95">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-lg">{g.icon}</span>
            <span className="min-w-0 truncate text-sm font-extrabold text-engrave">{g.tab}</span>
          </a>
        ))}
      </div>

      {/* الأقسام */}
      <div className="space-y-4">
        {GUIDE.map((g, i) => (
          <section key={g.id} id={g.id} className="card float-box scroll-mt-20 p-4">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-engrave">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xl">{g.icon}</span>
              {g.tab}
            </h2>
            <GuideShot icon={g.icon} color={SHOT_COLORS[i % SHOT_COLORS.length]} />
            <div className="mt-3 rounded-2xl bg-brand/[0.06] p-3">
              <div className="text-xs font-extrabold text-brand-dark">🎯 الهدف</div>
              <p className="mt-0.5 text-sm text-gray-700">{g.goal}</p>
            </div>
            <div className="mt-2 rounded-2xl bg-sand-50 p-3">
              <div className="mb-1 text-xs font-extrabold text-gray-600">🧭 طريقة الاستخدام</div>
              <ol className="space-y-1.5">
                {g.steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-extrabold text-white">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="mt-3 inline-block text-xs font-bold text-brand">↑ العودة للفهرس</a>
          </section>
        ))}
      </div>

      <button onClick={() => router.push('/account')} className="btn-outline w-full">← العودة لحسابي</button>
    </div>
  );
}
