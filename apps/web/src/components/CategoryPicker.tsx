'use client';

import { useMemo } from 'react';

interface Cat { id: string; name: string; icon?: string; children?: Cat[] }

// منتقي تصنيف واحد بالتنقّل الهرمي (نوع ← صنف ← سلالة) — يمكن اختيار أي مستوى
export function CategoryPicker({
  tree, valueId, onChange,
}: { tree: Cat[]; valueId?: string; onChange: (id: string) => void }) {
  const byId = useMemo(() => {
    const m = new Map<string, Cat>();
    const w = (n: Cat) => { m.set(n.id, n); n.children?.forEach(w); };
    tree.forEach(w);
    return m;
  }, [tree]);
  const parentOf = useMemo(() => {
    const m = new Map<string, string | undefined>();
    const w = (n: Cat, p?: string) => { m.set(n.id, p); n.children?.forEach((c) => w(c, n.id)); };
    tree.forEach((t) => w(t, undefined));
    return m;
  }, [tree]);

  const path = useMemo(() => {
    const out: Cat[] = [];
    let cur = valueId;
    while (cur) { const c = byId.get(cur); if (c) out.unshift(c); cur = parentOf.get(cur); }
    return out;
  }, [valueId, byId, parentOf]);

  const deepest = path[path.length - 1];
  const options = (deepest ? (deepest.children ?? []) : tree).filter((c) => !(c as any).hidden);

  return (
    <div className="rounded-2xl bg-sand-50 p-3 ring-1 ring-black/[0.04]">
      <div className="mb-2 text-xs font-bold text-gray-500">التصنيف</div>
      {path.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {path.map((n, i) => (
            <button key={n.id} type="button" onClick={() => onChange(parentOf.get(path[i].id) ?? '')}
              className="flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
              {n.icon ? `${n.icon} ` : ''}{n.name} <span className="opacity-80">✕</span>
            </button>
          ))}
        </div>
      )}
      {options.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {options.map((c) => (
            <button key={c.id} type="button" onClick={() => onChange(c.id)}
              className="rounded-full bg-white px-3 py-1 text-sm font-bold text-brand-dark ring-1 ring-sand-200 transition active:scale-95">
              {c.icon ? `${c.icon} ` : ''}{c.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">هذا أدقّ تصنيف — أو اختر من الأعلى لتغييره.</p>
      )}
    </div>
  );
}
