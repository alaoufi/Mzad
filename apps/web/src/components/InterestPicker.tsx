'use client';

import { useEffect, useState } from 'react';
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

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const flip = (id: string) =>
    setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const Box = ({ id }: { id: string }) => (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 text-sm ${sel.has(id) ? 'border-brand bg-brand text-white' : 'border-sand-300'}`}>
      {sel.has(id) ? '✓' : ''}
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
        <p className="mb-4 text-sm text-gray-500">{subtitle}</p>

        <div className="space-y-2">
          {tree.map((sp) => (
            <div key={sp.id} className="rounded-2xl border border-sand-200">
              <div className="flex items-center gap-2 p-2.5">
                <button onClick={() => flip(sp.id)} className="flex flex-1 items-center gap-2 text-right">
                  <Box id={sp.id} />
                  <span className="text-xl">{sp.icon}</span>
                  <span className="font-bold">{sp.name}</span>
                </button>
                {sp.children && sp.children.length > 0 && (
                  <button onClick={() => toggle(sp.id)} className="px-2 text-gray-400">{open[sp.id] ? '▾' : '▸'}</button>
                )}
              </div>
              {open[sp.id] && sp.children?.map((t) => (
                <div key={t.id} className="border-t border-sand-100 ps-4">
                  <div className="flex items-center gap-2 p-2">
                    <button onClick={() => flip(t.id)} className="flex flex-1 items-center gap-2 text-right">
                      <Box id={t.id} />
                      <span>{t.icon} {t.name}</span>
                    </button>
                    {t.children && t.children.length > 0 && (
                      <button onClick={() => toggle(t.id)} className="px-2 text-xs text-gray-400">{open[t.id] ? '▾' : '▸'}</button>
                    )}
                  </div>
                  {open[t.id] && (
                    <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                      {t.children?.map((b) => (
                        <button key={b.id} onClick={() => flip(b.id)}
                          className={`rounded-full px-3 py-1 text-sm font-bold transition ${sel.has(b.id) ? 'bg-brand text-white' : 'bg-sand-100 text-gray-600'}`}>
                          {sel.has(b.id) ? '✓ ' : ''}{b.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
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
