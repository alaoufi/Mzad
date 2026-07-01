'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { SECTIONS, can, canAny } from '@/lib/permissions';
import { accountTypeDef } from '@/lib/roles';
import { AdminNav } from '@/components/AdminNav';

// لوحة الإدارة — موزّعة على أربعة أقسام مستقلّة، كلٌّ في صفحته، بحسب صلاحية الدور
export default function AdminHub() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [me, setMe] = useState<{ accountType?: string } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api<any>('/users/me').then((r) => setMe(r)).catch(() => {});
    api<any>('/admin/stats').then((r) => setStats(r.stats)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [user]);

  if (!ready) return null;
  if (!user) return (
    <div className="mx-auto max-w-md text-center"><div className="card p-8">
      <p className="mb-4 text-5xl">🛡️</p><p className="mb-4 text-lg">لوحة الإدارة — سجّل الدخول بحساب مصرّح</p>
      <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
    </div></div>
  );
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;
  if (error) return (
    <div className="card p-8 text-center"><p className="text-5xl">🚫</p><p className="mt-3 text-lg font-bold">{error}</p>
      <p className="mt-1 text-sm text-gray-500">هذه اللوحة للأدوار المصرّح لها فقط.</p></div>
  );

  // نوع الحساب من الملف، وإلا اشتقاق مبدئي من صلاحية الجلسة (حتى لا تختفي الأقسام قبل تحميل /users/me)
  const acct = me?.accountType || (user.role === 'ADMIN' ? 'ADMIN' : user.role === 'BROKER' ? 'BROKER' : 'SHOPPER');
  const def = accountTypeDef(acct);
  // نُظهر «الملف الشخصي» دائماً، وبقية الأقسام بحسب صلاحية الاطلاع
  const sections = SECTIONS.filter((s) => s.key === 'profile' || canAny(acct, s.key));
  const badge: Record<string, number | undefined> = {
    listings: stats?.pending, market: (stats?.disputes ?? 0) + (stats?.reports ?? 0) + (stats?.verifications ?? 0),
  };

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">🛡️ لوحة الإدارة</h1>
        <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-extrabold text-brand-dark">{def.emoji} {def.label}</span>
      </div>

      {/* تبويبات الأقسام — تنقّل سريع */}
      <AdminNav />

      {/* الأقسام الأربعة — بطاقات مستقلّة */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <button key={s.key} onClick={() => router.push(s.href)}
            className="card float-box relative flex items-center gap-3 p-4 text-right transition active:scale-[0.99]">
            {!!badge[s.key] && badge[s.key]! > 0 && (
              <span className="absolute left-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">{badge[s.key]}</span>
            )}
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-2xl">{s.icon}</span>
            <span className="min-w-0">
              <span className="block font-extrabold text-engrave">{s.label}</span>
              <span className="block text-xs text-gray-500">{s.desc}</span>
            </span>
          </button>
        ))}
      </div>

      {/* لمحة سريعة */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          {[['👥 مستخدمون', stats.users], ['📋 إعلانات', stats.listings], ['⏳ موافقات', stats.pending], ['⚖️ نزاعات', stats.disputes]].map(([l, v]) => (
            <div key={l as string} className="card float-box p-2 text-center">
              <div className="text-lg font-extrabold text-brand-dark text-emboss">{v as number}</div>
              <div className="text-[10px] leading-tight text-gray-500">{l as string}</div>
            </div>
          ))}
        </div>
      )}

      {/* مرجع الصلاحيات */}
      {can(acct, 'site', 'view') && (
        <button onClick={() => router.push('/admin/roles')} className="card float-box flex w-full items-center gap-3 p-3 text-right">
          <span className="text-2xl">🔑</span>
          <span className="min-w-0"><span className="block font-bold">الصلاحيات والأدوار</span>
          <span className="block text-xs text-gray-500">مصفوفة الاطلاع/الإضافة/التعديل/الحذف لكل دور</span></span>
        </button>
      )}
    </div>
  );
}
