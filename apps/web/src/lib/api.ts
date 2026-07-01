// عميل بسيط للتعامل مع الواجهة الخلفية

// افتراضياً يستخدم مسارات API الداخلية في Next.js (نفس الأصل).
// لاستخدام الواجهة الخلفية NestJS المنفصلة، اضبط NEXT_PUBLIC_API_URL=http://localhost:4000/api
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mazad_token');
}

// مؤشّر تحميل عام: نتتبّع الطلبات الجارية لعرض شريط تحميل علوي فلا يبدو الموقع «معلّقاً»
let inflight = 0;
const activityListeners = new Set<(n: number) => void>();
export function onApiActivity(cb: (n: number) => void): () => void {
  activityListeners.add(cb);
  return () => activityListeners.delete(cb);
}
function setInflight(n: number) { inflight = n; activityListeners.forEach((l) => l(inflight)); }

export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  setInflight(inflight + 1);
  try {
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
  } finally {
    setInflight(Math.max(0, inflight - 1));
  }
}

// أنواع مختصرة
export interface ListingSummary {
  id: string;
  title: string;
  city: string;
  region: string;
  price?: string | null;
  saleType: 'DIRECT' | 'AUCTION';
  archived?: boolean;
  category?: { name: string; icon?: string };
  media?: { url: string }[];
  seller?: { name: string; trustScore: number; identityStatus: string };
  auction?: { id: string; status: string; endAt: string; startPrice: string };
}
