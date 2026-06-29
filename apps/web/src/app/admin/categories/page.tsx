'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Cat {
  id: string;
  name: string;
  icon?: string;
  hidden?: boolean;
  children?: Cat[];
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tree, setTree] = useState<Cat[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () =>
    api<Cat[]>('/admin/categories').then(setTree).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
  }, [user]);

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const run = async (fn: () => Promise<any>) => {
    setError('');
    try { await fn(); load(); } catch (e: any) { setError(e.message); alert(e.message); }
  };

  const addSpecies = () => {
    const name = prompt('اسم النوع الجديد (مثل: إبل):');
    if (!name?.trim()) return;
    const icon = prompt('رمز تعبيري للنوع (اختياري، مثل: 🐪):') ?? '';
    run(() => api('/admin/categories', { method: 'POST', body: JSON.stringify({ name, level: 'SPECIES', icon }) }));
  };
  const addChild = (parentId: string, level: 'TYPE' | 'BREED', label: string) => {
    const name = prompt(`اسم ${label} الجديد:`);
    if (!name?.trim()) return;
    run(() => api('/admin/categories', { method: 'POST', body: JSON.stringify({ name, level, parentId }) }));
  };
  const rename = (c: Cat) => {
    const name = prompt('الاسم الجديد:', c.name);
    if (name === null || !name.trim()) return;
    run(() => api(`/admin/categories/${c.id}`, { method: 'PATCH', body: JSON.stringify({ name }) }));
  };
  const setIcon = (c: Cat) => {
    const icon = prompt('الأيقونة (رمز تعبيري مثل 🐪، اتركه فارغاً للحذف):', c.icon ?? '');
    if (icon === null) return;
    run(() => api(`/admin/categories/${c.id}`, { method: 'PATCH', body: JSON.stringify({ icon }) }));
  };
  const toggleHide = (c: Cat) =>
    run(() => api(`/admin/categories/${c.id}`, { method: 'PATCH', body: JSON.stringify({ hidden: !c.hidden }) }));
  const del = (c: Cat) => {
    if (!confirm(`حذف "${c.name}"؟`)) return;
    run(() => api(`/admin/categories/${c.id}`, { method: 'DELETE' }));
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="mb-4 text-5xl">🗂️</p>
          <p className="mb-4 text-lg">إدارة التصنيفات — سجّل الدخول بحساب مشرف</p>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }
  if (loading) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">🗂️ إدارة التصنيفات</h1>
        <button onClick={() => router.push('/admin')} className="text-sm font-bold text-brand">← اللوحة</button>
      </div>
      <p className="text-sm text-gray-500">النوع ← اللون/الصنف ← السلالة. تحكّم كامل بالشجرة.</p>
      {error && <div className="rounded-2xl bg-red-50 p-3 text-red-700">{error}</div>}

      <button onClick={addSpecies} className="btn-primary w-full">＋ إضافة نوع جديد</button>

      <div className="space-y-3">
        {tree.map((sp) => (
          <div key={sp.id} className="card overflow-hidden">
            {/* النوع */}
            <div className={`flex items-center gap-2 bg-sand-50 p-3 ${sp.hidden ? 'opacity-50' : ''}`}>
              <button onClick={() => toggle(sp.id)} className="text-xl">{open[sp.id] ? '▾' : '▸'}</button>
              <span className="text-2xl">{sp.icon}</span>
              <span className="flex-1 text-lg font-bold">
                {sp.name}{sp.hidden && <span className="mr-1 text-xs text-red-500">(مخفي)</span>}
              </span>
              <Btn onClick={() => setIcon(sp)}>🖼️</Btn>
              <Btn onClick={() => rename(sp)}>✏️</Btn>
              <Btn onClick={() => toggleHide(sp)}>{sp.hidden ? '🙈' : '👁️'}</Btn>
              <Btn onClick={() => del(sp)}>🗑️</Btn>
            </div>

            {open[sp.id] && (
              <div className="space-y-2 p-3">
                {sp.children?.map((color) => (
                  <div key={color.id} className="rounded-2xl border border-sand-200">
                    <div className={`flex items-center gap-2 p-2 ${color.hidden ? 'opacity-50' : ''}`}>
                      <button onClick={() => toggle(color.id)} className="text-sm">{open[color.id] ? '▾' : '▸'}</button>
                      <span className="flex-1 font-bold text-brand-dark">
                        {color.icon} {color.name}{color.hidden && <span className="mr-1 text-xs text-red-500">(مخفي)</span>}
                      </span>
                      <Btn onClick={() => setIcon(color)}>🖼️</Btn>
                      <Btn onClick={() => rename(color)}>✏️</Btn>
                      <Btn onClick={() => toggleHide(color)}>{color.hidden ? '🙈' : '👁️'}</Btn>
                      <Btn onClick={() => del(color)}>🗑️</Btn>
                    </div>
                    {open[color.id] && (
                      <div className="space-y-1 px-3 pb-3">
                        {color.children?.map((breed) => (
                          <div key={breed.id} className={`flex items-center gap-2 rounded-xl bg-sand-50 px-3 py-2 ${breed.hidden ? 'opacity-50' : ''}`}>
                            <span className="flex-1">
                              {breed.icon} {breed.name}{breed.hidden && <span className="mr-1 text-xs text-red-500">(مخفي)</span>}
                            </span>
                            <Btn onClick={() => setIcon(breed)}>🖼️</Btn>
                            <Btn onClick={() => rename(breed)}>✏️</Btn>
                            <Btn onClick={() => toggleHide(breed)}>{breed.hidden ? '🙈' : '👁️'}</Btn>
                            <Btn onClick={() => del(breed)}>🗑️</Btn>
                          </div>
                        ))}
                        <button onClick={() => addChild(color.id, 'BREED', 'السلالة')}
                          className="w-full rounded-xl border-2 border-dashed border-sand-300 py-2 text-sm font-bold text-gray-500">
                          ＋ سلالة
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => addChild(sp.id, 'TYPE', 'اللون/الصنف')}
                  className="w-full rounded-xl border-2 border-dashed border-sand-300 py-2 text-sm font-bold text-gray-500">
                  ＋ لون / صنف
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg bg-white px-2 py-1 text-sm ring-1 ring-sand-200 hover:bg-sand-50">
      {children}
    </button>
  );
}
