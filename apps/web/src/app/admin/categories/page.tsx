'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { THEME_LIST, FAMILIES, themeByKey, gradient } from '@/lib/themes';

interface Cat {
  id: string;
  name: string;
  icon?: string;
  hidden?: boolean;
  themeKey?: string | null;
  level?: string;
  children?: Cat[];
}

type Level = 'SPECIES' | 'TYPE' | 'BREED';
const LEVEL_LABEL: Record<Level, string> = { SPECIES: 'النوع', TYPE: 'اللون / الصنف', BREED: 'السلالة' };

// اقتراحات أيقونات شائعة
const ICON_SUGGESTIONS = ['🐪', '🐫', '🐐', '🐑', '🐏', '🐄', '🐂', '🐎', '🐴', '🐔', '🦅', '🐓', '🛒', '💊', '🌾', '🧴', '🥛', '🍖', '🏷️', '⭐'];

interface Draft { name: string; icon: string; themeKey: string; hidden: boolean }

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tree, setTree] = useState<Cat[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // نافذة التعديل/الإضافة الموحّدة
  const [editFor, setEditFor] = useState<Cat | null>(null);
  const [addCtx, setAddCtx] = useState<{ parentId: string | null; level: Level } | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: '', icon: '', themeKey: '', hidden: false });
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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

  const openEdit = (c: Cat) => {
    setAddCtx(null);
    setDraft({ name: c.name, icon: c.icon ?? '', themeKey: c.themeKey ?? '', hidden: !!c.hidden });
    setEditFor(c);
  };
  const openAdd = (parentId: string | null, level: Level) => {
    setEditFor(null);
    setDraft({ name: '', icon: '', themeKey: '', hidden: false });
    setAddCtx({ parentId, level });
  };
  const closeModal = () => { setEditFor(null); setAddCtx(null); };

  const save = async () => {
    if (!draft.name.trim()) { alert('الاسم مطلوب'); return; }
    setSaving(true);
    try {
      if (editFor) {
        await api(`/admin/categories/${editFor.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: draft.name, icon: draft.icon, themeKey: draft.themeKey, hidden: draft.hidden }),
        });
      } else if (addCtx) {
        await api('/admin/categories', {
          method: 'POST',
          body: JSON.stringify({ name: draft.name, level: addCtx.level, parentId: addCtx.parentId, icon: draft.icon, themeKey: draft.themeKey }),
        });
      }
      closeModal();
      load();
    } catch (e: any) { setError(e.message); alert(e.message); }
    finally { setSaving(false); }
  };

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

  const modalLevel: Level = editFor ? (editFor.level as Level) ?? 'SPECIES' : addCtx?.level ?? 'SPECIES';

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">🗂️ إدارة التصنيفات</h1>
        <button onClick={() => router.push('/admin')} className="text-sm font-bold text-brand">← اللوحة</button>
      </div>
      <p className="text-sm text-gray-500">النوع ← اللون/الصنف ← السلالة. تحكّم كامل بالشجرة.</p>
      {error && <div className="rounded-2xl bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="flex gap-2">
        <button onClick={() => openAdd(null, 'SPECIES')} className="btn-primary flex-1">＋ إضافة نوع جديد</button>
        <button
          onClick={() => {
            if (!confirm('⚠️ سيحذف هذا كل التصنيفات والإعلانات الحالية ويعيد بناء الشجرة الافتراضية (إبل/غنم/خيل + المستلزمات). متابعة؟')) return;
            run(async () => {
              const r = await api<{ species: number; types: number; breeds: number }>('/admin/rebuild-catalog', { method: 'POST' });
              alert(`✅ تمت إعادة البناء: ${r.species} أنواع، ${r.types} أصناف، ${r.breeds} سلالات.`);
            });
          }}
          className="btn-outline !min-h-0 shrink-0 !border-red-300 !px-3 !text-red-600">
          ♻️ إعادة بناء
        </button>
      </div>

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
              <ThemeSwatch themeKey={sp.themeKey} />
              <EditBtn onClick={() => openEdit(sp)} />
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
                      <ThemeSwatch themeKey={color.themeKey} />
                      <EditBtn onClick={() => openEdit(color)} />
                      <Btn onClick={() => del(color)}>🗑️</Btn>
                    </div>
                    {open[color.id] && (
                      <div className="space-y-1 px-3 pb-3">
                        {color.children?.map((breed) => (
                          <div key={breed.id} className={`flex items-center gap-2 rounded-xl bg-sand-50 px-3 py-2 ${breed.hidden ? 'opacity-50' : ''}`}>
                            <span className="flex-1">
                              {breed.icon} {breed.name}{breed.hidden && <span className="mr-1 text-xs text-red-500">(مخفي)</span>}
                            </span>
                            <ThemeSwatch themeKey={breed.themeKey} />
                            <EditBtn onClick={() => openEdit(breed)} />
                            <Btn onClick={() => del(breed)}>🗑️</Btn>
                          </div>
                        ))}
                        <button onClick={() => openAdd(color.id, 'BREED')}
                          className="w-full rounded-xl border-2 border-dashed border-sand-300 py-2 text-sm font-bold text-gray-500">
                          ＋ سلالة
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => openAdd(sp.id, 'TYPE')}
                  className="w-full rounded-xl border-2 border-dashed border-sand-300 py-2 text-sm font-bold text-gray-500">
                  ＋ لون / صنف
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* نافذة التعديل/الإضافة الموحّدة */}
      {(editFor || addCtx) && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3" onClick={closeModal}>
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">
                {editFor ? `✏️ تعديل ${LEVEL_LABEL[modalLevel]}` : `＋ إضافة ${LEVEL_LABEL[modalLevel]}`}
              </h3>
              <button onClick={closeModal} className="text-2xl leading-none text-gray-400">×</button>
            </div>

            {/* الاسم */}
            <label className="mb-1 block text-sm font-bold text-gray-600">الاسم</label>
            <input className="input mb-4" placeholder="مثل: إبل" value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} autoFocus />

            {/* الأيقونة */}
            <label className="mb-1 block text-sm font-bold text-gray-600">الأيقونة</label>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sand-100 text-2xl">
                {draft.icon || '—'}
              </div>
              <input className="input flex-1" placeholder="رمز تعبيري (اختياري)" value={draft.icon}
                onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))} />
              {draft.icon && (
                <button onClick={() => setDraft((d) => ({ ...d, icon: '' }))}
                  className="rounded-xl bg-sand-100 px-3 py-2 text-sm font-bold text-gray-500">مسح</button>
              )}
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {ICON_SUGGESTIONS.map((e) => (
                <button key={e} onClick={() => setDraft((d) => ({ ...d, icon: e }))}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl ring-1 transition ${draft.icon === e ? 'bg-brand/10 ring-brand' : 'ring-sand-200 hover:bg-sand-50'}`}>
                  {e}
                </button>
              ))}
            </div>

            {/* الإخفاء */}
            <label className="mb-4 flex cursor-pointer items-center justify-between rounded-2xl border-2 border-sand-200 px-4 py-3">
              <span className="font-bold">إخفاء من الموقع</span>
              <input type="checkbox" className="h-6 w-6 accent-brand" checked={draft.hidden}
                onChange={(e) => setDraft((d) => ({ ...d, hidden: e.target.checked }))} />
            </label>

            {/* الثيم */}
            <label className="mb-2 block text-sm font-bold text-gray-600">الثيم (هوية القسم)</label>
            <button onClick={() => setDraft((d) => ({ ...d, themeKey: '' }))}
              className={`mb-3 w-full rounded-xl border-2 py-2 text-sm font-bold ${draft.themeKey === '' ? 'border-brand bg-sand-50 text-brand' : 'border-dashed border-sand-300 text-gray-500'}`}>
              بلا ثيم (افتراضي النوع)
            </button>
            <div className="max-h-64 overflow-y-auto rounded-2xl bg-sand-50 p-2">
              {['مميّزة', ...FAMILIES].map((family) => {
                const items = THEME_LIST.filter((t) => t.family === family);
                if (!items.length) return null;
                return (
                  <div key={family} className="mb-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundImage: gradient(items[0]) }} />
                      <h4 className="text-xs font-extrabold text-gray-600">{family}</h4>
                      <span className="text-[10px] text-gray-400">({items.length})</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {items.map((t) => (
                        <button key={t.key} onClick={() => setDraft((d) => ({ ...d, themeKey: t.key }))}
                          className={`overflow-hidden rounded-xl ring-2 transition ${draft.themeKey === t.key ? 'ring-brand' : 'ring-transparent'}`}>
                          <div className="h-9 w-full" style={{ backgroundImage: gradient(t) }} />
                          <div className="bg-white py-0.5 text-[10px] font-bold text-gray-600">{t.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* أزرار */}
            <div className="mt-5 flex gap-2">
              <button onClick={closeModal} className="btn-outline flex-1">إلغاء</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                {saving ? '...' : editFor ? 'حفظ التعديل' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
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

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg bg-brand px-3 py-1 text-sm font-bold text-white hover:bg-brand-dark">
      ✏️ تعديل
    </button>
  );
}

function ThemeSwatch({ themeKey }: { themeKey?: string | null }) {
  if (!themeKey) return null;
  return (
    <span className="h-7 w-7 shrink-0 overflow-hidden rounded-lg ring-1 ring-sand-200" title="الثيم المعيّن"
      style={{ backgroundImage: gradient(themeByKey(themeKey)) }} />
  );
}
