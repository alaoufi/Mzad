'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { uiToast, uiConfirm, uiPrompt } from '@/lib/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { LiveAuction } from '@/components/LiveAuction';
import { ListingChat } from '@/components/ListingChat';
import { SellerReviews } from '@/components/SellerReviews';
import { resolveTheme, resolveIcon, resolveMotif, gradient, sceneBackground, themeVars } from '@/lib/themes';
import { usePageTheme } from '@/lib/theme-context';
import { isOpenEnd } from '@/lib/auction';
import { HeartButton } from '@/lib/favorites';
import { HijriDate } from '@/components/HijriDate';

const HEALTH_LABELS: Record<string, string> = {
  vaccinated: 'مُطعّم',
  udder: 'سلامة الضرع',
  abscess: 'خالٍ من الخراجات',
  mange: 'خالٍ من الجرب',
  teeth: 'سلامة الأسنان',
  limp: 'خالٍ من العرج',
};

export default function ListingPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [form, setForm] = useState<any>({});
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(() => {
    api(`/listings/${params.id}`).then(setListing).catch((e) => setError(e.message));
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const openEdit = () => {
    setForm({
      title: listing.title, description: listing.description, count: listing.count, sex: listing.sex,
      approxWeightKg: listing.approxWeightKg ?? '', city: listing.city, region: listing.region,
      price: listing.price ?? '',
    });
    setEditing(true);
  };
  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      await api(`/listings/${params.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      setEditing(false); uiToast('تم حفظ التعديل', 'success'); load();
    } catch (e: any) { uiToast(e.message, 'error'); }
    finally { setSavingEdit(false); }
  };
  const openPrivateChat = async () => {
    if (!user) { uiToast('سجّل الدخول أولاً للمراسلة', 'info'); return; }
    try {
      const r = await api<{ id: string }>('/conversations', { method: 'POST', body: JSON.stringify({ listingId: params.id }) });
      router.push(`/messages/${r.id}`);
    } catch (e: any) { uiToast(e.message, 'error'); }
  };
  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `${listing.title} — في مزاد`;
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title: listing.title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        uiToast('تم نسخ رابط الإعلان', 'success');
      }
    } catch { /* أُلغيت المشاركة */ }
  };
  const requestPurchase = async () => {
    if (!user) { uiToast('سجّل الدخول أولاً لإرسال طلبك', 'info'); return; }
    try {
      await api(`/listings/${params.id}/messages`, { method: 'POST', body: JSON.stringify({ body: 'مرحباً، أرغب بشراء هذا الإعلان. هل ما زال متاحاً؟' }) });
      uiToast('تم إرسال طلبك للبائع — تابع المحادثة بالأسفل', 'success');
    } catch (e: any) { uiToast(e.message, 'error'); }
  };
  const toggleArchive = async () => {
    try {
      await api(`/listings/${params.id}`, { method: 'PATCH', body: JSON.stringify({ archived: !listing.archived }) });
      uiToast(listing.archived ? 'أُعيد الإعلان للعرض' : 'نُقل الإعلان للأرشيف', 'success'); load();
    } catch (e: any) { uiToast(e.message, 'error'); }
  };
  const adminToggleHide = async () => {
    const next = listing.status === 'CLOSED' ? 'ACTIVE' : 'CLOSED';
    try {
      await api(`/admin/listings/${params.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      uiToast(next === 'CLOSED' ? 'أُخفي الإعلان' : 'أُظهر الإعلان', 'success'); load();
    } catch (e: any) { uiToast(e.message, 'error'); }
  };

  const convert = async (to: 'DIRECT' | 'AUCTION' | 'ONSOOM') => {
    try {
      const body: any = { to };
      if (to === 'AUCTION') {
        body.startPrice = Number(await uiPrompt('سعر بداية المزاد (ريال):', '1000') || 0);
        body.durationHours = Number(await uiPrompt('مدة المزاد بالساعات:', '24') || 24);
      } else if (to === 'ONSOOM') {
        body.startPrice = Number(await uiPrompt('أقل مبلغ للمساومة (ريال):', '0') || 0);
      } else if (to === 'DIRECT') {
        body.price = Number(await uiPrompt('السعر الثابت (ريال):', '0') || 0);
      }
      await api(`/listings/${params.id}/convert`, { method: 'POST', body: JSON.stringify(body) });
      load();
    } catch (e: any) { uiToast(e.message); }
  };

  // سلسلة: سلالة ← لون ← نوع (من الأعمق للأعلى) — تُحسب قبل أي return لأن الخطّاف يجب أن يعمل دائماً
  const cat = listing?.category;
  const chain = [cat, cat?.parent, cat?.parent?.parent].filter(Boolean);
  const theme = resolveTheme(chain);
  const motif = resolveMotif(chain, theme);
  usePageTheme(theme); // يلوّن ترويسة الموقع والشريط السفلي بلون نوع الإعلان

  if (error) return <p className="py-10 text-center text-red-600">{error}</p>;
  if (!listing) return <p className="py-10 text-center text-gray-500">جارٍ التحميل...</p>;

  const media = listing.media ?? [];
  const emoji = resolveIcon(chain);
  const marketName = (cat?.parent?.parent ?? cat?.parent ?? cat)?.name ?? 'السوق';

  // صلاحيات التعديل والأرشفة
  const isOwner = !!user && user.id === listing.seller?.id;
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BROKER';
  const within2h = !!listing.createdAt && Date.now() - new Date(listing.createdAt).getTime() < 2 * 60 * 60 * 1000;
  const canEditFields = isStaff || (isOwner && within2h);
  const canArchive = isOwner || isStaff;

  return (
    <div className="-mx-4 -my-6 min-h-screen px-4 py-6 animate-fadeup" style={{ background: sceneBackground(theme, motif), ...themeVars(theme) }}>
      {/* لافتة السوق حسب النوع */}
      <div className="mb-5 flex items-center gap-3 rounded-3xl p-4 text-white shadow-lg"
        style={{ backgroundImage: gradient(theme), boxShadow: `0 20px 40px -18px ${theme.from}88` }}>
        <span className="text-4xl animate-floaty">{emoji}</span>
        <div>
          <div className="text-lg font-extrabold text-emboss-light">سوق {marketName}</div>
          <div className="text-sm text-white/80">
            {[cat?.parent?.parent?.name, cat?.parent?.name, cat?.name].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      {listing.status === 'DRAFT' && (
        <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-center font-bold text-amber-800">
          ⏳ إعلانك بانتظار موافقة الإدارة قبل ظهوره للجميع
        </div>
      )}

      {/* شريط إدارة الإعلان (تعديل/إخفاء/أرشفة) */}
      {(canEditFields || canArchive) && (
        <div className="card mb-4 p-3">
          <div className="mb-2 text-xs font-bold text-gray-500">⚙️ إدارة الإعلان</div>
          <div className="flex flex-wrap items-center gap-2">
            {listing.archived && <span className="chip !bg-gray-200 !text-gray-700">🗄️ مؤرشف</span>}
            {listing.status === 'CLOSED' && <span className="chip !bg-amber-100 !text-amber-700">🙈 مخفي</span>}
            {canEditFields && (
              <button onClick={openEdit} className="btn-primary !min-h-0 !px-4 !py-2 !text-sm">✏️ تعديل</button>
            )}
            {isAdmin && (
              <button onClick={adminToggleHide} className="btn-outline !min-h-0 !px-4 !py-2 !text-sm">
                {listing.status === 'CLOSED' ? '👁️ إظهار' : '🙈 إخفاء'}
              </button>
            )}
            {canArchive && (
              <button onClick={toggleArchive} className="btn-outline !min-h-0 !px-4 !py-2 !text-sm">
                {listing.archived ? '♻️ استرجاع' : '🗄️ أرشفة'}
              </button>
            )}
            {isAdmin && (
              <button onClick={() => router.push(`/admin/conversations/${listing.id}`)} className="btn-outline !min-h-0 !px-4 !py-2 !text-sm">
                📨 المحادثات
              </button>
            )}
          </div>
          {isOwner && !within2h && !isStaff && (
            <p className="mt-2 text-xs text-gray-400">انتهت مهلة التعديل (ساعتان من النشر) — يمكنك الأرشفة، أو التواصل مع الإدارة للتعديل.</p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
      {/* الميديا */}
      <div>
        <div className="card aspect-[4/3] bg-sand-100">
          {media[activeImg] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media[activeImg].url}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl">
              {listing.category?.parent?.icon ?? listing.category?.icon ?? '🐾'}
            </div>
          )}
        </div>
        {media.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {media.map((m: any, i: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={m.url}
                onClick={() => setActiveImg(i)}
                className={`h-20 w-20 cursor-pointer rounded-xl object-cover ${
                  i === activeImg ? 'ring-2 ring-brand' : ''
                }`}
                alt=""
              />
            ))}
          </div>
        )}
      </div>

      {/* التفاصيل */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-engrave">{listing.title}</h1>
            <p className="mt-1 text-gray-500">📍 {listing.city} — {listing.region}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-gray-400">
              {listing.createdAt && <span>🗓️ <HijriDate value={listing.createdAt} /></span>}
              {typeof listing.views === 'number' && <span>👁️ {listing.views.toLocaleString('ar-SA')} مشاهدة</span>}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={share} aria-label="مشاركة"
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl ring-1 ring-sand-200">↗️</button>
            <HeartButton id={listing.id} className="!h-11 !w-11 !text-2xl ring-1 ring-sand-200" />
          </div>
        </div>

        {/* البائع والثقة */}
        <div className="card flex items-center justify-between p-4">
          <div>
            <div className="font-bold">{listing.seller?.name}</div>
            <div className="text-sm text-gray-500">
              ⭐ {listing.seller?.trustScore?.toFixed(1) ?? '—'}
              {listing.seller?.identityStatus === 'VERIFIED' && (
                <span className="mr-2 chip">✔ موثّق</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            {!isOwner && (
              <button onClick={openPrivateChat}
                className="rounded-2xl px-4 py-2 text-sm font-bold text-white shadow"
                style={{ backgroundImage: 'linear-gradient(135deg, #128C7E, #25D366)' }}>
                💬 مراسلة خاصة
              </button>
            )}
            {listing.seller?.phone && (
              <a
                href={`https://wa.me/${String(listing.seller.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`السلام عليكم، بخصوص إعلان «${listing.title}» في مزاد`)}`}
                target="_blank" rel="noopener noreferrer"
                className="rounded-2xl border border-green-300 px-4 py-1.5 text-center text-sm font-bold text-green-700"
              >
                واتساب
              </a>
            )}
          </div>
        </div>

        {/* المواصفات */}
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-bold">المواصفات</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Spec label="النوع" value={`${listing.category?.parent?.name ?? ''} / ${listing.category?.name ?? ''}`} />
            <Spec label="العدد" value={listing.count} />
            <Spec label="الجنس" value={sexLabel(listing.sex)} />
            {listing.approxWeightKg && <Spec label="الوزن التقريبي" value={`${listing.approxWeightKg} كجم`} />}
            {listing.productionStatus && <Spec label="حالة الإنتاج" value={listing.productionStatus} />}
          </dl>
        </div>

        {/* الحالة الصحية */}
        {listing.health?.length > 0 && (
          <div className="card p-4">
            <h2 className="mb-3 text-lg font-bold">🩺 الحالة الصحية والعيوب</h2>
            <div className="flex flex-wrap gap-2">
              {listing.health.map((h: any) => (
                <span
                  key={h.id}
                  className={`chip ${h.value ? '!bg-green-100 !text-green-800' : '!bg-red-100 !text-red-800'}`}
                >
                  {h.value ? '✔ سليم —' : '✕ غير سليم —'} {h.label ?? HEALTH_LABELS[h.key] ?? h.key}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* الوصف */}
        <div className="card p-4">
          <h2 className="mb-2 text-lg font-bold">الوصف</h2>
          <p className="leading-relaxed text-gray-700">{listing.description}</p>
        </div>

        {/* السعر / المزاد / على السوم */}
        {(() => {
          const canManage =
            !!user && (user.id === listing.seller?.id || user.role === 'BROKER' || user.role === 'ADMIN');
          const hasAuction = !!listing.auction;
          const open = hasAuction && isOpenEnd(listing.auction.endAt);
          const timed = hasAuction && !open;

          return (
            <>
              {hasAuction ? (
                <LiveAuction auctionId={listing.auction.id} canManage={canManage} />
              ) : (
                <div className="card flex items-center justify-between p-5">
                  <div>
                    <div className="text-gray-500">السعر</div>
                    <div className="text-3xl font-extrabold text-brand-dark text-emboss">
                      {listing.price ? `${Number(listing.price).toLocaleString('ar-SA')} ﷼` : 'على السوم'}
                    </div>
                  </div>
                  <button className="btn-primary" onClick={requestPurchase}>اطلب الشراء</button>
                </div>
              )}

              {/* تحويل نوع البيع (للمالك أو الدلال أو الإدارة) */}
              {canManage && (
                <div className="card p-4">
                  <h3 className="mb-2 text-sm font-bold text-gray-500">تحويل نوع البيع</h3>
                  <div className="flex flex-wrap gap-2">
                    {(timed || open) && (
                      <button onClick={() => convert('DIRECT')} className="btn-outline !min-h-0 !px-4 !py-2 !text-sm">🏷️ عرض بسعر</button>
                    )}
                    {!open && (
                      <button onClick={() => convert('ONSOOM')} className="btn-outline !min-h-0 !px-4 !py-2 !text-sm">🤝 على السوم</button>
                    )}
                    {!timed && (
                      <button onClick={() => convert('AUCTION')} className="btn-outline !min-h-0 !px-4 !py-2 !text-sm">🔨 مزاد مؤقّت</button>
                    )}
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* المحادثة والتقييمات */}
        <ListingChat listingId={listing.id} />
        {listing.seller?.id && <SellerReviews sellerId={listing.seller.id} />}

        <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
          <button
            onClick={async () => {
              if (!user) { uiToast('سجّل الدخول أولاً للإبلاغ'); return; }
              const reason = await uiPrompt('سبب الإبلاغ عن هذا الإعلان:');
              if (!reason?.trim()) return;
              try {
                await api('/reports', { method: 'POST', body: JSON.stringify({ targetType: 'listing', targetId: listing.id, reason }) });
                uiToast('🚩 شكراً، سيراجع فريق الأمان البلاغ');
              } catch (e: any) { uiToast(e.message); }
            }}
          >
            🚩 إبلاغ عن الإعلان
          </button>
          <span className="text-gray-300">·</span>
          <button
            onClick={async () => {
              if (!user) { uiToast('سجّل الدخول أولاً'); return; }
              const reason = await uiPrompt('سبب فتح نزاع على هذه الصفقة:');
              if (!reason?.trim()) return;
              const detail = await uiPrompt('تفاصيل إضافية (اختياري):') || '';
              try {
                await api('/disputes', { method: 'POST', body: JSON.stringify({ listingId: listing.id, reason, detail }) });
                uiToast('⚖️ تم فتح النزاع، ستراجعه الإدارة. تابعه من «نزاعاتي».');
              } catch (e: any) { uiToast(e.message); }
            }}
          >
            ⚖️ فتح نزاع على الصفقة
          </button>
        </div>
      </div>
      </div>

      {editing && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3" onClick={() => setEditing(false)}>
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">✏️ تعديل الإعلان</h3>
              <button onClick={() => setEditing(false)} className="text-2xl leading-none text-gray-400">×</button>
            </div>
            <div className="space-y-3">
              <input className="input" placeholder="عنوان الإعلان" value={form.title ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))} />
              <textarea className="input min-h-[100px]" placeholder="الوصف" value={form.description ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="input" placeholder="العدد" value={form.count ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, count: e.target.value }))} />
                <input type="number" className="input" placeholder="الوزن (كجم)" value={form.approxWeightKg ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, approxWeightKg: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                {[['MALE', 'ذكر'], ['FEMALE', 'أنثى'], ['MIXED', 'مختلط']].map(([v, l]) => (
                  <button key={v} onClick={() => setForm((f: any) => ({ ...f, sex: v }))}
                    className={`flex-1 rounded-2xl border-2 py-2.5 font-bold ${form.sex === v ? 'border-brand bg-sand-50' : 'border-sand-200'}`}>{l}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="المدينة" value={form.city ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, city: e.target.value }))} />
                <input className="input" placeholder="المنطقة" value={form.region ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, region: e.target.value }))} />
              </div>
              {!listing.auction && (
                <input type="number" className="input text-xl" placeholder="السعر (ريال) — اتركه فارغاً لِـ«على السوم»" value={form.price ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, price: e.target.value }))} />
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-outline flex-1">إلغاء</button>
              <button onClick={saveEdit} disabled={savingEdit} className="btn-primary flex-1 disabled:opacity-50">{savingEdit ? '...' : 'حفظ'}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-sand-50 px-3 py-2">
      <dt className="text-gray-400">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

function sexLabel(s: string) {
  return { MALE: 'ذكر', FEMALE: 'أنثى', MIXED: 'مختلط' }[s] ?? s;
}
