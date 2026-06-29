'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';
import { useAuth } from './auth';

interface FavContext {
  isFav: (id: string) => boolean;
  toggle: (id: string) => void;
  loggedIn: boolean;
}

const Ctx = createContext<FavContext>({ isFav: () => false, toggle: () => {}, loggedIn: false });

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setIds(new Set()); return; }
    api<{ ids: string[] }>('/favorites/ids').then((r) => setIds(new Set(r.ids))).catch(() => {});
  }, [user]);

  const isFav = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback(
    (id: string) => {
      if (!user) { window.location.href = '/login'; return; }
      // تحديث تفاؤلي
      setIds((prev) => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      });
      api<{ favorited: boolean }>(`/listings/${id}/favorite`, { method: 'POST' })
        .then((r) =>
          setIds((prev) => {
            const n = new Set(prev);
            r.favorited ? n.add(id) : n.delete(id);
            return n;
          }),
        )
        .catch(() => {});
    },
    [user],
  );

  return <Ctx.Provider value={{ isFav, toggle, loggedIn: !!user }}>{children}</Ctx.Provider>;
}

export const useFavorites = () => useContext(Ctx);

export function HeartButton({ id, className = '' }: { id: string; className?: string }) {
  const { isFav, toggle } = useFavorites();
  const fav = isFav(id);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}
      aria-label="المفضلة"
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-lg shadow backdrop-blur transition active:scale-90 ${className}`}
    >
      <span className={fav ? 'scale-110' : 'opacity-60'}>{fav ? '❤️' : '🤍'}</span>
    </button>
  );
}
