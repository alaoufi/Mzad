'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

interface Cat { id: string; name: string; icon?: string; children?: Cat[] }

// منتقي الاهتمامات: يختار المستخدم نوعاً كاملاً أو صنفاً أو سلالة معيّنة (أي مستوى، تعدّد)
export function InterestPicker({
  initial,
  title = 'ما الذي يهمّك؟',
  subtitle = 'اختر ما تحب متابعته — نوعاً أو لوناً أو سلالة، وكذلك من المستلزمات. تظهر لك في العروض والمزادات والمستلزمات اهتماماتك فقط، ويمكنك تعديلها لاحقاً من ملفك.',
  onSave,
  onClose,
  onSkip,
}: {
  initial: string[];
  title?: string;
  subtitle?: string;
  onSave: (ids: string[]) => void;
  onClose: () => void;
  onSkip?: () => void;
}) {
  const [tree, setTree] = useState<Cat[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [sel, setSel] = useState<Set<string>>(new Set(initial));
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    api<Cat[]>('/categories').then(setTree).catch(() => {});
  }, []);

  // فهرسة الأب والأبناء — لفرض اختيار مستوى واحد لكل فرع (صرامة)
  const byId = useMemo(() => {
    const m = new Map<string, Cat>();
    const walk = (n: Cat) => { m.set(n.id, n); n.children?.forEach(walk); };
    tree.forEach(walk);
    return m;
  }, [tree]);
  const parentOf = useMemo(() => {
    const m = new Map<string, string | undefined>();
    const walk = (n: Cat, p?: string) => { m.set(n.id, p); n.children?.forEach((c) => walk(c, n.id)); };
    tree.forEach((t) => walk(t, undefined));
    return m;
  }, [tree]);
  const descendantsOf = (id: string): string[] => {
    const out: string[] = [];
    const walk = (n?: Cat) => n?.children?.forEach((k) => { out.push(k.id); walk(k); });
    walk(byId.get(id));
    return out;
  };
  const ancestorSelected = (id: string): boolean => {
    let p = parentOf.get(id);
    while (p) { if (sel.has(p)) return true; p = parentOf.get(p); }
    return false;
  };
  const descendantSelected = (id: string): boolean => descendantsOf(id).some((d) => sel.has(d));

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  // عند الاختيار: نزيل أي أصل مختار (يُقفل الأعلى) وأي أبناء محدّدين (الأصل يشمل كل ما تحته)
  const flip = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) { n.delete(id); return n; }
      let p = parentOf.get(id);
      while (p) { n.delete(p); p = parentOf.get(p); }
      for (const d of descendantsOf(id)) n.delete(d);
      n.add(id);
      return n;
    });

  const Box = ({ id, covered }: { id: string; covered?: boolean }) => (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 text-sm ${
      sel.has(id) ? 'border-brand bg-brand text-white' : covered ? 'border-brand/40 bg-brand/10 text-brand' : 'border-sand-300'}`}>
      {sel.has(id) ? '✓' : covered ? '•' : ''}
    </span>
  );

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-engrave">{title}</h3>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400">×</button>
        </div>
        <p className="mb-3 text-sm text-gray-500">{subtitle}</p>

        {/* المحدّد حالياً — يُظهر كل اختيار ولو كان داخل فرع مطويّ، ويُزال بنقرة */}
        {sel.size > 0 && (
          <div className="mb-4 rounded-2xl border border-brand/30 bg-brand/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-extrabold text-brand-dark">المحدّد حالياً ({sel.size})</span>
              <button onClick={() => setSel(new Set())} className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-red-500 ring-1 ring-sand-200">
                مسح الكل
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[...sel].map((id) => {
                const c = byId.get(id);
                return (
                  <button key={id} onClick={() => flip(id)}
                    className="flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
                    <span>{c ? `${c.icon ?? ''} ${c.name}` : 'تصنيف'}</span>
                    <span className="text-white/80">✕</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {tree.map((sp) => {
            const spLocked = descendantSelected(sp.id);
            return (
            <div key={sp.id} className="rounded-2xl border border-sand-200">
              <div className="flex items-center gap-2 p-2.5">
                <button onClick={() => flip(sp.id)} disabled={spLocked}
                  className="flex flex-1 items-center gap-2 text-right disabled:opacity-60">
                  <Box id={sp.id} />
                  <span className="text-xl">{sp.icon}</span>
                  <span className="font-bold">{sp.name}</span>
                  {spLocked && <span className="text-[10px] font-bold text-amber-600">محدّد فرعياً</span>}
                </button>
                {sp.children && sp.children.length > 0 && (
                  <button onClick={() => toggle(sp.id)} className="px-2 text-gray-400">{open[sp.id] ? '▾' : '▸'}</button>
                )}
              </div>
              {open[sp.id] && sp.children?.map((t) => {
                const tCovered = ancestorSelected(t.id);
                const tLocked = descendantSelected(t.id);
                return (
                <div key={t.id} className="border-t border-sand-100 ps-4">
                  <div className="flex items-center gap-2 p-2">
                    <button onClick={() => flip(t.id)} disabled={tCovered || tLocked}
                      className="flex flex-1 items-center gap-2 text-right disabled:opacity-60">
                      <Box id={t.id} covered={tCovered} />
                      <span>{t.icon} {t.name}</span>
                      {tCovered && <span className="text-[10px] font-bold text-brand">مشمول</span>}
                      {!tCovered && tLocked && <span className="text-[10px] font-bold text-amber-600">محدّد فرعياً</span>}
                    </button>
                    {t.children && t.children.length > 0 && (
                      <button onClick={() => toggle(t.id)} className="px-2 text-xs text-gray-400">{open[t.id] ? '▾' : '▸'}</button>
                    )}
                  </div>
                  {open[t.id] && (
                    <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                      {t.children?.map((b) => {
                        const bCovered = ancestorSelected(b.id);
                        return (
                        <button key={b.id} onClick={() => flip(b.id)} disabled={bCovered}
                          className={`rounded-full px-3 py-1 text-sm font-bold transition disabled:opacity-60 ${
                            sel.has(b.id) ? 'bg-brand text-white' : bCovered ? 'bg-brand/10 text-brand' : 'bg-sand-100 text-gray-600'}`}>
                          {sel.has(b.id) ? '✓ ' : bCovered ? '• ' : ''}{b.name}
                        </button>
                      )})}
                    </div>
                  )}
                </div>
              )})}
            </div>
          )})}
        </div>

        <div className="mt-5 flex gap-2">
          {onSkip && <button onClick={onSkip} className="btn-outline flex-1">تصفّح الكل</button>}
          <button onClick={() => { setSaving(true); onSave([...sel]); }} disabled={saving}
            className="btn-primary flex-1 disabled:opacity-50">
            {saving ? '...' : `حفظ${sel.size ? ` (${sel.size})` : ''}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
