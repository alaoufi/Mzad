'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uiToast } from '@/lib/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { SITE_TEXTS } from '@/lib/texts';

export default function AdminTextsPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api<any>('/admin/settings').then((r) => setTexts(r.texts ?? {})).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const save = async () => {
    setSaving(true);
    try { await api('/admin/settings', { method: 'PATCH', body: JSON.stringify({ texts }) }); uiToast('✅ حُفظت النصوص', 'success'); }
    catch (e: any) { uiToast(e.message, 'error'); } finally { setSaving(false); }
  };

  if (!ready) return null;
  if (!user) return <p className="py-10 text-center text-gray-500">ادخل بحساب الإدارة.</p>;
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/admin')} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-dark shadow-sm ring-1 ring-sand-200">→ الإدارة</button>
        <h1 className="text-2xl font-extrabold text-engrave">📝 النصوص</h1>
      </div>

      <div className="card space-y-3 p-4">
        <p className="text-xs text-gray-500">عدّل النصوص الظاهرة للزوّار والتجّار. اترك الحقل فارغاً للرجوع للنص الافتراضي.</p>
        <div className="space-y-3">
          {SITE_TEXTS.map((t) => (
            <div key={t.key} className="rounded-2xl bg-sand-50 p-3 ring-1 ring-black/[0.03]">
              <label className="mb-1 block text-sm font-bold text-gray-600">{t.label}</label>
              {t.multiline ? (
                <textarea className="input min-h-[60px]" placeholder={t.def} value={texts[t.key] ?? ''}
                  onChange={(e) => setTexts((p) => ({ ...p, [t.key]: e.target.value }))} />
              ) : (
                <input className="input" placeholder={t.def} value={texts[t.key] ?? ''}
                  onChange={(e) => setTexts((p) => ({ ...p, [t.key]: e.target.value }))} />
              )}
            </div>
          ))}
        </div>
        <button onClick={save} disabled={saving} className="btn-primary w-full disabled:opacity-50">{saving ? '...' : 'حفظ النصوص'}</button>
      </div>
    </div>
  );
}
