'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { accountTypeDef } from '@/lib/roles';
import AccountPage from '@/app/account/page';
import { FollowUpSummary } from '@/components/FollowUpSummary';
import { SiteSection } from '@/components/admin/SiteSection';
import { ListingsSection } from '@/components/admin/ListingsSection';
import { MarketSection } from '@/components/admin/MarketSection';

type Tab = 'profile' | 'site' | 'listings' | 'market';

const TABS: { key: Tab; label: string; icon: string; section?: 'site' | 'listings' | 'market' }[] = [
  { key: 'profile', label: 'الملف الشخصي', icon: '👤' },
  { key: 'site', label: 'تجهيزات الموقع', icon: '⚙️', section: 'site' },
  { key: 'listings', label: 'ترتيب الإعلانات', icon: '📋', section: 'listings' },
  { key: 'market', label: 'المستخدمون وحركة السوق', icon: '⚖️', section: 'market' },
];

// لوحة الإدارة — صفحة واحدة بأربعة تبويبات ثلاثية الأبعاد، كل تبويب يستدعي محتواه خلفه.
// الافتراضي «الملف الشخصي»، وتظهر التبويبات بحسب صلاحيات الدور.
export default function AdminHub() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const [acct, setAcct] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    api<any>('/users/me').then((r) => setAcct(r.accountType)).catch(() => {});
    api<any>('/admin/stats').then((r) => setStats(r.stats)).catch(() => {});
  }, [user]);

  if (!ready) return null;
  if (!user) return (
    <div className="mx-auto max-w-md text-center"><div className="card p-8">
      <p className="mb-4 text-5xl">🛡️</p><p className="mb-4 text-lg">لوحة الإدارة — سجّل الدخول</p>
      <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
    </div></div>
  );

  // اشتقاق مبدئي من صلاحية الجلسة حتى لا تختفي التبويبات قبل تحميل /users/me
  const role = acct || (user.role === 'ADMIN' ? 'ADMIN' : user.role === 'BROKER' ? 'BROKER' : 'SHOPPER');
  const def = accountTypeDef(role);
  const visible = TABS.filter((t) => t.key === 'profile' || (t.section && can(role, t.section, 'view')));
  const badge: Record<string, number | undefined> = {
    listings: stats?.pending,
    market: (stats?.disputes ?? 0) + (stats?.reports ?? 0) + (stats?.verifications ?? 0),
  };

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-engrave">🛡️ لوحة الإدارة</h1>
        <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-extrabold text-brand-dark">{def.emoji} {def.label}</span>
      </div>

      {/* التبويبات — أزرار ثلاثية الأبعاد، كل زرّ يستدعي محتواه خلفه */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {visible.map((t) => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`float-box relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center transition active:scale-95 ${
                active ? 'text-white ring-2 ring-white/60' : 'bg-white text-gray-700 ring-1 ring-black/[0.05] hover:-translate-y-0.5'}`}
              style={active ? { backgroundImage: 'linear-gradient(135deg, #1aa893, #0a5246)' } : undefined}>
              {!!badge[t.key] && badge[t.key]! > 0 && (
                <span className="absolute left-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{badge[t.key]}</span>
              )}
              <span className="text-2xl drop-shadow-sm">{t.icon}</span>
              <span className="text-[12px] font-extrabold leading-tight">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* محتوى التبويب النشط — بورقتين خلفيّتين توحيان بصفحات متراكمة (ثلاثي الأبعاد) */}
      <div className="relative mt-3">
        <div className="pointer-events-none absolute -top-2.5 left-4 right-4 h-5 rounded-2xl bg-black/[0.05]" />
        <div className="pointer-events-none absolute -top-1.5 left-2 right-2 h-5 rounded-2xl bg-black/[0.08]" />
        <div className="relative rounded-3xl bg-white/40 p-3 shadow-lift ring-1 ring-black/[0.05]">
          {tab === 'profile' && <><FollowUpSummary /><AccountPage /></>}
          {tab === 'site' && can(role, 'site', 'view') && <SiteSection embedded />}
          {tab === 'listings' && can(role, 'listings', 'view') && <ListingsSection embedded />}
          {tab === 'market' && can(role, 'market', 'view') && <MarketSection embedded />}
        </div>
      </div>
    </div>
  );
}
