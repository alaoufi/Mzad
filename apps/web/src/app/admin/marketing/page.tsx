'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface AType { id: string; name: string; icon?: string | null; description?: string | null; commissionPct: number; requiresDeposit: boolean; active: boolean; }
interface Ad { id: string; title: string; placement: string; status: string; link?: string | null; advertiser?: string | null; impressions: number; clicks: number; }

const PLACEMENTS = ['HOME_TOP', 'HOME_MID', 'MARKET_TOP', 'SUPPLIES_TOP', 'LISTING_DETAIL'];

export default function MarketingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'types' | 'ads'>('types');
  const [types, setTypes] = useState<AType[] | null>(null);
  const [ads, setAds] = useState<Ad[] | null>(null);
  const [warn, setWarn] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setWarn('');
    try { const r = await api<{ types: AType[] }>('/admin/auction-types'); setTypes(r.types); }
    catch (e: any) { setWarn(e.message); setTypes([]); }
    try { const r = await api<{ ads: Ad[] }>('/admin/ads'); setAds(r.ads); }
    catch { setAds([]); }
    setLoading(false);
  };
  useEffect(() => { if (!user) { setLoading(false); return; } load(); }, [user]);

  const run = async (fn: () => Promise<any>) => { try { await fn(); load(); } catch (e: any) { alert(e.message); } };

  const addType = () => {
    const name = prompt('اسم نوع المزاد (مثل: مزاد فوري):'); if (!name?.trim()) return;
    const icon = prompt('أيقونة (رمز تعبيري، اختياري مثل ⚡):', '') || '';
    const commissionPct = Number(prompt('نسبة العمولة %:', '2.5') || 0);
    const requiresDeposit = confirm('يتطلب عربوناً؟ (موافق=نعم)');
    run(() => api('/admin/auction-types', { method: 'POST', body: JSON.stringify({ name, icon, commissionPct, requiresDeposit }) }));
  };
  const setTypeIcon = (t: AType) => {
    const icon = prompt('الأيقونة (رمز تعبيري، فارغ للحذف):', t.icon ?? '');
    if (icon === null) return;
    run(() => api(`/admin/auction-types/${t.id}`, { method: 'PATCH', body: JSON.stringify({ icon }) }));
  };
  const addAd = () => {
    const title = prompt('عنوان الإعلان:'); if (!title?.trim()) return;
    const placement = prompt(`الموضع (${PLACEMENTS.join(' / ')}):`, 'HOME_TOP') || 'HOME_TOP';
    const link = prompt('الرابط (داخلي مثل /sell أو خارجي https://...):', '/') || '/';
    const imageUrl = prompt('رابط صورة (اختياري):', '') || '';
    const advertiser = prompt('اسم المُعلِن (اختياري):', '') || '';
    run(() => api('/admin/ads', { method: 'POST', body: JSON.stringify({ title, placement, link, imageUrl, advertiser, type: 'BANNER' }) }));
  };

  if (!user) return <Center>سجّل الدخول بحساب مشرف</Center>;
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">📣 التسويق</h1>
        <button onClick={() => router.push('/admin')} className="text-sm font-bold text-brand">← اللوحة</button>
      </div>

      {warn && (
        <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ {warn}<br />يعني التعديل على قاعدة البيانات لم يُطبّق بعد (تأكّد أن رابط Neon مباشر، ثم أعد النشر).
        </div>
      )}

      <div className="flex gap-2">
        <Tab on={tab === 'types'} onClick={() => setTab('types')}>أنواع المزادات</Tab>
        <Tab on={tab === 'ads'} onClick={() => setTab('ads')}>الإعلانات</Tab>
      </div>

      {tab === 'types' && (
        <div className="space-y-2">
          <button onClick={addType} className="btn-primary w-full">＋ نوع مزاد جديد</button>
          {(types ?? []).length === 0 && <p className="py-6 text-center text-gray-400">لا توجد أنواع بعد</p>}
          {(types ?? []).map((t) => (
            <div key={t.id} className={`card flex items-center gap-2 p-3 ${!t.active ? 'opacity-50' : ''}`}>
              <span className="text-2xl">{t.icon || '🔨'}</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{t.name}</div>
                <div className="text-xs text-gray-500">عمولة {t.commissionPct}% {t.requiresDeposit && '· يتطلب عربوناً'} {!t.active && '· مخفي'}</div>
              </div>
              <button onClick={() => setTypeIcon(t)} className="rounded-lg bg-sand-100 px-3 py-2 text-sm font-bold">🖼️</button>
              <button onClick={() => run(() => api(`/admin/auction-types/${t.id}`, { method: 'PATCH', body: JSON.stringify({ active: !t.active }) }))}
                className="rounded-lg bg-sand-100 px-3 py-2 text-sm font-bold">{t.active ? 'إخفاء' : 'إظهار'}</button>
              <button onClick={() => confirm('حذف؟') && run(() => api(`/admin/auction-types/${t.id}`, { method: 'DELETE' }))}
                className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-600">حذف</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'ads' && (
        <div className="space-y-2">
          <button onClick={addAd} className="btn-primary w-full">＋ إعلان جديد</button>
          {(ads ?? []).length === 0 && <p className="py-6 text-center text-gray-400">لا توجد إعلانات بعد</p>}
          {(ads ?? []).map((a) => (
            <div key={a.id} className="card flex items-center gap-2 p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{a.title}</div>
                <div className="text-xs text-gray-500">{a.placement} · {a.status} · 👁️ {a.impressions} · 🖱️ {a.clicks}</div>
              </div>
              <button onClick={() => run(() => api(`/admin/ads/${a.id}`, { method: 'PATCH', body: JSON.stringify({ status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }) }))}
                className="rounded-lg bg-sand-100 px-3 py-2 text-sm font-bold">{a.status === 'ACTIVE' ? 'إيقاف' : 'تفعيل'}</button>
              <button onClick={() => confirm('حذف؟') && run(() => api(`/admin/ads/${a.id}`, { method: 'DELETE' }))}
                className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-600">حذف</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tab({ children, on, onClick }: { children: React.ReactNode; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 rounded-2xl py-3 text-sm font-bold transition ${on ? 'bg-brand text-white' : 'bg-white ring-1 ring-sand-200 text-gray-600'}`}>
      {children}
    </button>
  );
}
function Center({ children }: { children: React.ReactNode }) {
  return <div className="card mx-auto max-w-md p-8 text-center text-lg">{children}</div>;
}
