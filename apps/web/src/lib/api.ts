// عميل بسيط للتعامل مع الواجهة الخلفية

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mazad_token');
}

export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `خطأ ${res.status}`);
  }
  return res.json();
}

// أنواع مختصرة
export interface ListingSummary {
  id: string;
  title: string;
  city: string;
  region: string;
  price?: string | null;
  saleType: 'DIRECT' | 'AUCTION';
  category?: { name: string; icon?: string };
  media?: { url: string }[];
  seller?: { name: string; trustScore: number; identityStatus: string };
  auction?: { id: string; status: string; endAt: string; startPrice: string };
}
