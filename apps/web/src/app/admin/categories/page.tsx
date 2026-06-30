'use client';

import { useEffect, useMemo, useState } from 'react';
import { uiToast, uiConfirm, uiPrompt } from '@/lib/ui';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  THEME_LIST, FAMILIES, themeByKey, gradient, resolveSkin, sceneBackground, skinVars,
  MOTIF_OPTIONS, SHAPE_OPTIONS, LAYOUT_OPTIONS, CARD_OPTIONS,
} from '@/lib/themes';

interface Cat {
  id: string;
  name: string;
  icon?: string | null;
  themeKey?: string | null;
  motifKey?: string | null;
  shapeKey?: string | null;
  layoutKey?: string | null;
  cardStyle?: string | null;
  hidden?: boolean;
  order?: number;
  parentId?: string | null;
}

const ICON_SUGGESTIONS = ['🐪', '🐫', '🐐', '🐑', '🐏', '🐄', '🐂', '🐎', '🐴', '🐔', '🦅', '🐓', '🛒', '💊', '🌾', '🧴', '🥛', '🍖', '🏷️', '⭐'];
// ألوان حافة حسب العمق — توضّح تداخل الفروع بصرياً (تُستخدم عند غياب ثيم خاص)
const DEPTH_STRIPE = ['#0f7b6c', '#caa45d', '#7c8b9a', '#c98a6b'];

interface Draft {
  name: string; icon: string; themeKey: string; hidden: boolean;
  motifKey: string; shapeKey: string; layoutKey: string; cardStyle: string;
}
const EMPTY_DRAFT: Draft = { name: '', icon: '', themeKey: '', hidden: false, motifKey: '', shapeKey: '', layoutKey: '', cardStyle: '' };
const depthLabel = (d: number) => (d === 0 ? 'النوع (الرأس)' : `المستوى ${d + 1}`);

interface NodeCtx {
  childrenOf: Map<string | null, Cat[]>;
  open: Record<string, boolean>;
  toggle: (id: string) => void;
  move: (c: Cat, dir: -1 | 1) => void;
  toggleHide: (c: Cat) => void;
  openEdit: (c: Cat) => void;
  openAdd: (parentId: string | null, depth: number) => void;
  del: (c: Cat) => void;
}

// عقدة شجرة بأي عمق — مكوّن مستقل (لا يُعاد إنشاؤه فيتجنّب إعادة التركيب البطيئة)
function NodeRow({ cat, depth, ctx }: { cat: Cat; depth: number; ctx: NodeCtx }) {
  const kids = ctx.childrenOf.get(cat.id) ?? [];
  const sibs = ctx.childrenOf.get(cat.parentId ?? null) ?? [];
  const idx = sibs.findIndex((s) => s.id === cat.id);
  const isOpen = ctx.open[cat.id];
  // لون الحافة حسب العمق (أو ثيم القسم) لتوضيح التداخل
  const stripe = cat.themeKey ? themeByKey(cat.themeKey).accent : DEPTH_STRIPE[Math.min(depth, DEPTH_STRIPE.length - 1)];
  return (
    <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white"
      style={{ marginInlineStart: depth ? 14 : 0, borderInlineStartWidth: 5, borderInlineStartColor: stripe }}>
      <div className={`flex items-center gap-1.5 p-2 ${cat.hidden ? 'opacity-50' : ''}`}>
        {kids.length ? (
          <button onClick={() => ctx.toggle(cat.id)} title={isOpen ? 'طيّ الفروع' : 'عرض الفروع'}
            className="flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-extrabold text-white transition active:scale-95"
            style={{ backgroundColor: isOpen ? stripe : `${stripe}d9` }}>
            <span className={`text-xs leading-none transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
            <span className="text-xs leading-none">{kids.length}</span>
          </button>
        ) : (
          <span className="flex h-8 w-7 items-center justify-center text-sm text-sand-300">•</span>
        )}
        {cat.icon && <span className="text-lg">{cat.icon}</span>}
        <span className={`flex-1 truncate ${depth === 0 ? 'text-base font-extrabold' : depth === 1 ? 'font-bold text-brand-dark' : ''}`}>
          {cat.name}{cat.hidden && <span className="mr-1 text-[10px] text-red-500">(مخفي)</span>}
        </span>
        {cat.themeKey && (
          <span className="h-6 w-6 shrink-0 overflow-hidden rounded-md ring-1 ring-sand-200" title="ثيم"
            style={{ backgroundImage: gradient(themeByKey(cat.themeKey)) }} />
        )}
        <button onClick={() => ctx.move(cat, -1)} disabled={idx === 0}
          className="flex h-8 w-7 items-center justify-center rounded-lg bg-sand-100 text-gray-600 disabled:opacity-30">▲</button>
        <button onClick={() => ctx.move(cat, 1)} disabled={idx === sibs.length - 1}
          className="flex h-8 w-7 items-center justify-center rounded-lg bg-sand-100 text-gray-600 disabled:opacity-30">▼</button>
        <IconBtn onClick={() => ctx.toggleHide(cat)}>{cat.hidden ? '🙈' : '👁️'}</IconBtn>
        <IconBtn onClick={() => ctx.openEdit(cat)}>✏️</IconBtn>
        <IconBtn onClick={() => ctx.del(cat)}>🗑️</IconBtn>
      </div>
      {isOpen && (
        <div className="space-y-1.5 px-2 pb-2">
          {kids.map((k) => <NodeRow key={k.id} cat={k} depth={depth + 1} ctx={ctx} />)}
          <button onClick={() => ctx.openAdd(cat.id, depth + 1)}
            className="w-full rounded-xl border-2 border-dashed border-sand-300 py-2 text-xs font-bold text-gray-500 hover:border-brand hover:text-brand">
            ＋ إضافة تصنيف فرعي تحت «{cat.name}»
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [flat, setFlat] = useState<Cat[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [editFor, setEditFor] = useState<Cat | null>(null);
  const [addParent, setAddParent] = useState<{ id: string | null; depth: number } | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const load = () =>
    api<Cat[]>('/admin/categories').then(setFlat).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
  }, [user]);

  const childrenOf = useMemo(() => {
    const m = new Map<string | null, Cat[]>();
    for (const c of flat) {
      const k = c.parentId ?? null;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(c);
    }
    for (const arr of m.values()) arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
    return m;
  }, [flat]);

  const depthOf = (cat: Cat): number => {
    let d = 0, p = cat.parentId;
    const byId = new Map(flat.map((c) => [c.id, c]));
    while (p) { d++; p = byId.get(p)?.parentId ?? null; }
    return d;
  };

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const run = async (fn: () => Promise<any>) => {
    setError('');
    try { await fn(); load(); } catch (e: any) { setError(e.message); uiToast(e.message); }
  };

  const openEdit = (c: Cat) => {
    setAddParent(null);
    setDraft({
      name: c.name, icon: c.icon ?? '', themeKey: c.themeKey ?? '', hidden: !!c.hidden,
      motifKey: c.motifKey ?? '', shapeKey: c.shapeKey ?? '', layoutKey: c.layoutKey ?? '', cardStyle: c.cardStyle ?? '',
    });
    setEditFor(c);
  };
  const openAdd = (parentId: string | null, depth: number) => {
    setEditFor(null);
    setDraft(EMPTY_DRAFT);
    setAddParent({ id: parentId, depth });
    if (parentId) setOpen((o) => ({ ...o, [parentId]: true }));
  };
  const closeModal = () => { setEditFor(null); setAddParent(null); };

  const save = async () => {
    if (!draft.name.trim()) { uiToast('الاسم مطلوب'); return; }
    setSaving(true);
    try {
      const axes = { motifKey: draft.motifKey, shapeKey: draft.shapeKey, layoutKey: draft.layoutKey, cardStyle: draft.cardStyle };
      if (editFor) {
        await api(`/admin/categories/${editFor.id}`, { method: 'PATCH',
          body: JSON.stringify({ name: draft.name, icon: draft.icon, themeKey: draft.themeKey, hidden: draft.hidden, ...axes }) });
      } else if (addParent) {
        await api('/admin/categories', { method: 'POST',
          body: JSON.stringify({ name: draft.name, parentId: addParent.id, icon: draft.icon, themeKey: draft.themeKey, ...axes }) });
      }
      closeModal();
      load();
    } catch (e: any) { setError(e.message); uiToast(e.message); }
    finally { setSaving(false); }
  };

  const del = async (c: Cat) => {
    if (!await uiConfirm(`حذف "${c.name}"؟ (يجب ألا يكون له فروع أو إعلانات)`)) return;
    run(() => api(`/admin/categories/${c.id}`, { method: 'DELETE' }));
  };
  const toggleHide = (c: Cat) =>
    run(() => api(`/admin/categories/${c.id}`, { method: 'PATCH', body: JSON.stringify({ hidden: !c.hidden }) }));

  // إعادة ترتيب: نعيد ترقيم كل الإخوة تسلسلياً (يعمل حتى لو كانت كلها order=0)
  const move = (c: Cat, dir: -1 | 1) => {
    const sibs = [...(childrenOf.get(c.parentId ?? null) ?? [])];
    const i = sibs.findIndex((s) => s.id === c.id);
    const j = i + dir;
    if (j < 0 || j >= sibs.length) return;
    const [moved] = sibs.splice(i, 1);
    sibs.splice(j, 0, moved);
    run(async () => {
      for (let k = 0; k < sibs.length; k++) {
        if ((sibs[k].order ?? -1) !== k) {
          await api(`/admin/categories/${sibs[k].id}`, { method: 'PATCH', body: JSON.stringify({ order: k }) });
        }
      }
    });
  };

  if (!ready) return null;
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

  const roots = childrenOf.get(null) ?? [];
  const modalDepth = editFor ? depthOf(editFor) : addParent?.depth ?? 0;
  // الهوية الناتجة عن المسوّدة (للمعاينة الحيّة)
  const previewSkin = resolveSkin([{
    name: draft.name || 'معاينة', themeKey: draft.themeKey || null,
    motifKey: draft.motifKey || null, shapeKey: draft.shapeKey || null,
    layoutKey: draft.layoutKey || null, cardStyle: draft.cardStyle || null,
  }]);
  const cardLabel = CARD_OPTIONS.find((o) => o.key === previewSkin.cardStyle)?.label ?? previewSkin.cardStyle;
  const ctx: NodeCtx = { childrenOf, open, toggle, move, toggleHide, openEdit, openAdd, del };

  return (
    <div className="animate-fadeup space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">🗂️ إدارة التصنيفات</h1>
        <button onClick={() => router.push('/admin')} className="text-sm font-bold text-brand">← اللوحة</button>
      </div>
      <p className="text-sm text-gray-500">
        أضف رأساً (نوعاً)، ثم تحته أي عدد من المستويات بأي عمق — لكل عنصر اسمه وأيقونته وثيمه.
        الزر الملوّن ▶ على اليمين يفتح/يطوي الفروع ويظهر عددها. ترتيب (▲▼) · إظهار/إخفاء · حذف.
      </p>
      {error && <div className="rounded-2xl bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="flex gap-2">
        <button onClick={() => openAdd(null, 0)} className="btn-primary flex-1">＋ إضافة نوع رئيسي</button>
        <button
          onClick={async () => {
            if (!(await uiConfirm('⚠️ سيحذف هذا كل التصنيفات والإعلانات الحالية ويعيد بناء الشجرة الافتراضية. متابعة؟', { danger: true, confirmText: 'إعادة بناء' }))) return;
            run(async () => {
              const r = await api<{ species: number; types: number; breeds: number }>('/admin/rebuild-catalog', { method: 'POST' });
              uiToast(`✅ تمت إعادة البناء: ${r.species} أنواع، ${r.types} أصناف، ${r.breeds} سلالات.`);
            });
          }}
          className="btn-outline !min-h-0 shrink-0 !border-red-300 !px-3 !text-red-600">
          ♻️ إعادة بناء
        </button>
      </div>

      <div className="space-y-2">
        {roots.map((r) => <NodeRow key={r.id} cat={r} depth={0} ctx={ctx} />)}
        {roots.length === 0 && <p className="py-8 text-center text-gray-400">لا توجد تصنيفات — أضف أول نوع.</p>}
      </div>

      {(editFor || addParent) && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3" onClick={closeModal}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">
                {editFor ? `✏️ تعديل — ${depthLabel(modalDepth)}` : `＋ إضافة — ${depthLabel(modalDepth)}`}
              </h3>
              <button onClick={closeModal} className="text-2xl leading-none text-gray-400">×</button>
            </div>

            <label className="mb-1 block text-sm font-bold text-gray-600">الاسم / التعريف</label>
            <input className="input mb-4" placeholder="اكتب الاسم..." value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} autoFocus />

            <label className="mb-1 block text-sm font-bold text-gray-600">الأيقونة</label>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sand-100 text-2xl">{draft.icon || '—'}</div>
              <input className="input flex-1" placeholder="رمز تعبيري (اختياري)" value={draft.icon}
                onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))} />
              {draft.icon && <button onClick={() => setDraft((d) => ({ ...d, icon: '' }))} className="rounded-xl bg-sand-100 px-3 py-2 text-sm font-bold text-gray-500">مسح</button>}
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {ICON_SUGGESTIONS.map((e) => (
                <button key={e} onClick={() => setDraft((d) => ({ ...d, icon: e }))}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl ring-1 transition ${draft.icon === e ? 'bg-brand/10 ring-brand' : 'ring-sand-200 hover:bg-sand-50'}`}>{e}</button>
              ))}
            </div>

            <label className="mb-4 flex cursor-pointer items-center justify-between rounded-2xl border-2 border-sand-200 px-4 py-3">
              <span className="font-bold">إخفاء من الموقع</span>
              <input type="checkbox" className="h-6 w-6 accent-brand" checked={draft.hidden}
                onChange={(e) => setDraft((d) => ({ ...d, hidden: e.target.checked }))} />
            </label>

            <label className="mb-2 block text-sm font-bold text-gray-600">الثيم (هوية القسم)</label>
            <button onClick={() => setDraft((d) => ({ ...d, themeKey: '' }))}
              className={`mb-3 w-full rounded-xl border-2 py-2 text-sm font-bold ${draft.themeKey === '' ? 'border-brand bg-sand-50 text-brand' : 'border-dashed border-sand-300 text-gray-500'}`}>
              بلا ثيم (وراثة من الأب)
            </button>
            <div className="max-h-60 overflow-y-auto rounded-2xl bg-sand-50 p-2">
              {['مميّزة', ...FAMILIES].map((family) => {
                const items = THEME_LIST.filter((t) => t.family === family);
                if (!items.length) return null;
                return (
                  <div key={family} className="mb-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundImage: gradient(items[0]) }} />
                      <h4 className="text-xs font-extrabold text-gray-600">{family}</h4>
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

            {/* هوية القسم — معاينة حيّة وتثبيت المحاور */}
            <div className="mt-4 rounded-2xl border-2 border-sand-200 p-3">
              <h4 className="mb-2 text-sm font-extrabold text-brand-dark">🎨 هوية القسم — معاينة وتثبيت</h4>
              <div className="mb-3 overflow-hidden rounded-2xl p-3"
                style={{ background: sceneBackground(previewSkin.theme, previewSkin.motif, previewSkin.mood), ...skinVars(previewSkin) }}>
                <div className="card p-2">
                  <div className="h-14 w-full rounded-[inherit]" style={{ backgroundImage: gradient(previewSkin.theme) }} />
                  <div className="px-1 pt-1.5 text-[11px] font-bold text-gray-600">شكل البطاقة: {cardLabel}</div>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="chip !bg-white !py-1 !text-[11px]">رقاقة</span>
                  <button type="button" className="btn-primary !min-h-0 !px-3 !py-1 !text-[11px]">زر</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <PinSelect label="النمط (الخلفية)" value={draft.motifKey} options={MOTIF_OPTIONS} onChange={(v) => setDraft((d) => ({ ...d, motifKey: v }))} />
                <PinSelect label="الاستدارة" value={draft.shapeKey} options={SHAPE_OPTIONS} onChange={(v) => setDraft((d) => ({ ...d, shapeKey: v }))} />
                <PinSelect label="التخطيط" value={draft.layoutKey} options={LAYOUT_OPTIONS} onChange={(v) => setDraft((d) => ({ ...d, layoutKey: v }))} />
                <PinSelect label="شكل البطاقة" value={draft.cardStyle} options={CARD_OPTIONS} onChange={(v) => setDraft((d) => ({ ...d, cardStyle: v }))} />
              </div>
              <p className="mt-2 text-[11px] text-gray-400">«تلقائي» يُشتقّ من اسم القسم. ثبّت أي محور لتجاوز التلقائي.</p>
            </div>

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

function PinSelect({ label, value, options, onChange }: {
  label: string; value: string; options: { key: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-gray-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-sand-200 bg-white px-2 py-2 text-sm font-bold text-gray-700">
        <option value="">تلقائي</option>
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </label>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex h-8 items-center rounded-lg bg-white px-1.5 text-sm ring-1 ring-sand-200 hover:bg-sand-50">
      {children}
    </button>
  );
}
